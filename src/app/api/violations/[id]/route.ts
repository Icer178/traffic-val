import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userRole = user.user_metadata?.role || "user";
  const userId = user.id;

  try {
    const { data: violation, error } = await supabase
      .from("violations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !violation) {
      return NextResponse.json(
        { error: "Violation not found" },
        { status: 404 }
      );
    }

    // Users can only see their own violations
    if (userRole === "user" && violation.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform to camelCase
    const transformedViolation = {
      id: violation.id,
      userId: violation.user_id,
      type: violation.type,
      description: violation.description,
      location: violation.location,
      vehiclePlate: violation.vehicle_plate,
      vehicleModel: violation.vehicle_model,
      vehicleColor: violation.vehicle_color,
      dateTime: violation.date_time,
      reporterName: violation.reporter_name,
      reporterEmail: violation.reporter_email,
      reporterPhone: violation.reporter_phone,
      status: violation.status,
      evidenceUrls: violation.evidence_urls,
      adminNotes: violation.admin_notes,
      createdAt: violation.created_at,
      updatedAt: violation.updated_at,
    };

    return NextResponse.json(transformedViolation);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch violation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = user.user_metadata?.role || "user";
  const userId = user.id;

  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch the violation first
    const { data: violation, error: fetchError } = await supabase
      .from("violations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !violation) {
      return NextResponse.json(
        { error: "Violation not found" },
        { status: 404 }
      );
    }

    // Permission checks based on role
    if (userRole === "user") {
      // Users can only update evidence_urls on their own violations
      if (violation.user_id !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Users can only update evidence_urls
      if (Object.keys(body).some(key => key !== "evidence_urls")) {
        return NextResponse.json(
          { error: "Users can only update evidence" },
          { status: 403 }
        );
      }
    } else if (userRole === "sub_admin") {
      // Sub-admins can update status (but only to pending/under_review) and add notes
      if (body.status && !["pending", "under_review"].includes(body.status)) {
        return NextResponse.json(
          { error: "Sub-admins can only set status to pending or under_review" },
          { status: 403 }
        );
      }
    }
    // Admins can update everything (no restrictions)

    // Transform camelCase to snake_case for update
    const updateData: any = {};
    if (body.evidence_urls) updateData.evidence_urls = body.evidence_urls;
    
    // Sub-admins and admins can update status and notes
    if (userRole === "sub_admin" || userRole === "admin") {
      if (body.status) updateData.status = body.status;
      if (body.adminNotes !== undefined) updateData.admin_notes = body.adminNotes;
    }
    if (body.type && userRole === "admin") updateData.type = body.type;
    if (body.description && userRole === "admin") updateData.description = body.description;
    if (body.location && userRole === "admin") updateData.location = body.location;

    const { data: updatedViolation, error: updateError } = await supabase
      .from("violations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update violation" },
        { status: 500 }
      );
    }

    // Transform back to camelCase
    const transformedViolation = {
      id: updatedViolation.id,
      userId: updatedViolation.user_id,
      type: updatedViolation.type,
      description: updatedViolation.description,
      location: updatedViolation.location,
      vehiclePlate: updatedViolation.vehicle_plate,
      vehicleModel: updatedViolation.vehicle_model,
      vehicleColor: updatedViolation.vehicle_color,
      dateTime: updatedViolation.date_time,
      reporterName: updatedViolation.reporter_name,
      reporterEmail: updatedViolation.reporter_email,
      reporterPhone: updatedViolation.reporter_phone,
      status: updatedViolation.status,
      evidenceUrls: updatedViolation.evidence_urls,
      adminNotes: updatedViolation.admin_notes,
      createdAt: updatedViolation.created_at,
      updatedAt: updatedViolation.updated_at,
    };

    return NextResponse.json(transformedViolation);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to update violation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = user.user_metadata?.role || "user";

  // Only admins can delete violations
  if (userRole !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { error } = await supabase
      .from("violations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete violation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to delete violation" },
      { status: 500 }
    );
  }
}
