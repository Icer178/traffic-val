"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Violation, ViolationStatus } from "@/types";

export default function EditViolationPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [violation, setViolation] = useState<Violation | null>(null);
  const [formData, setFormData] = useState({
    status: "" as ViolationStatus,
    adminNotes: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
        return;
      }

      const role = user.user_metadata?.role || "user";
      setUserRole(role);

      // Only admins and sub-admins can edit
      if (role !== "admin" && role !== "sub_admin") {
        router.push("/violations");
        return;
      }

      setUser(user);
      fetchViolation();
    };
    getUser();
  }, [router, supabase, params.id]);

  const fetchViolation = async () => {
    try {
      const response = await fetch(`/api/violations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setViolation(data);
        setFormData({
          status: data.status,
          adminNotes: data.adminNotes || "",
        });
      } else {
        setError("Violation not found");
      }
    } catch (error) {
      console.error("Error fetching violation:", error);
      setError("Failed to load violation");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/violations/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          adminNotes: formData.adminNotes,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.replace("/violations");
        }, 2000);
      } else {
        setError("Failed to update violation");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading violation...</p>
        </div>
      </div>
    );
  }

  if (!violation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardBody className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Violation Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The violation you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/violations")}>
              Back to Violations
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardBody className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/30 mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Violation Updated!
            </h2>
            <p className="text-gray-600">
              The violation has been successfully updated.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.replace("/violations")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Violations
          </Button>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Violation
              </h1>
              <p className="text-gray-600">
                {userRole === "sub_admin"
                  ? "Update status (pending/under review) and add notes"
                  : "Update status and add administrative notes"}
              </p>
            </div>
          </div>
        </div>

        {/* Violation Info Card */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Violation Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">License Plate</p>
                <p className="font-semibold text-gray-900">
                  {violation.vehiclePlate}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Type</p>
                <p className="font-semibold text-gray-900">
                  {violation.type.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Location</p>
                <p className="font-semibold text-gray-900">
                  {violation.location}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(violation.dateTime).toLocaleDateString()}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Description</p>
                <p className="font-semibold text-gray-900">
                  {violation.description}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as ViolationStatus,
                    })
                  }
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  {userRole === "admin" && (
                    <>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {userRole === "sub_admin"
                    ? "Sub-admins can only set to Pending or Under Review"
                    : "Update the violation status"}
                </p>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={formData.adminNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, adminNotes: e.target.value })
                  }
                  rows={6}
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Add administrative notes, investigation details, or resolution information..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Internal notes visible to admins only
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.replace("/violations")}
                  className="flex-1"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  isLoading={saving}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
