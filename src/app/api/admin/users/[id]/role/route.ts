import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = user.user_metadata?.role || "user";

  // Only admins can update user roles
  if (userRole !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["user", "sub_admin", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: user, sub_admin, admin" },
        { status: 400 }
      );
    }

    // Prevent user from changing their own role
    if (id === user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Create admin client to update user
    const supabaseAdmin = createAdminClient();

    // Update user metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role },
    });

    if (error) {
      console.error("Error updating user role:", error);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);

    // Check if it's a configuration error
    if (error.message?.includes("Missing Supabase environment variables")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
