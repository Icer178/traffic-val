import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CreateViolationInput } from "@/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = user.user_metadata?.role || "user";
  const userId = user.id;

  try {
    // Build query based on user role
    let query = supabase.from("violations").select("*");

    // Users can only see their own violations
    if (userRole === "user") {
      query = query.eq("user_id", userId);
    }
    // Admins and sub-admins can see all violations (no filter)

    // Apply filters from query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    // Order by created_at descending
    query = query.order("created_at", { ascending: false });

    const { data: violations, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch violations" },
        { status: 500 }
      );
    }

    // Transform snake_case to camelCase for frontend
    const transformedViolations = violations?.map((v) => ({
      id: v.id,
      userId: v.user_id,
      type: v.type,
      description: v.description,
      location: v.location,
      vehiclePlate: v.vehicle_plate,
      vehicleModel: v.vehicle_model,
      vehicleColor: v.vehicle_color,
      dateTime: v.date_time,
      reporterName: v.reporter_name,
      reporterEmail: v.reporter_email,
      reporterPhone: v.reporter_phone,
      status: v.status,
      evidenceUrls: v.evidence_urls,
      adminNotes: v.admin_notes,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })) || [];

    return NextResponse.json(transformedViolations);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch violations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateViolationInput = await request.json();
    const userId = user.id;

    // Transform camelCase to snake_case for database
    const violationData = {
      user_id: userId,
      type: body.type,
      description: body.description,
      location: body.location,
      vehicle_plate: body.vehiclePlate,
      vehicle_model: body.vehicleModel || null,
      vehicle_color: body.vehicleColor || null,
      date_time: body.dateTime,
      reporter_name: body.reporterName,
      reporter_email: body.reporterEmail,
      reporter_phone: body.reporterPhone || null,
      evidence_urls: body.evidenceUrls || null,
      status: "pending",
    };

    const { data: violation, error } = await supabase
      .from("violations")
      .insert(violationData)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create violation" },
        { status: 500 }
      );
    }

    // Transform back to camelCase for response
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

    return NextResponse.json(transformedViolation, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to create violation" },
      { status: 500 }
    );
  }
}
