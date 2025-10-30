"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Violation, ViolationStatus } from "@/types";
import gsap from "gsap";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    resolved: 0,
    dismissed: 0,
    todayCount: 0,
    weekCount: 0,
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

      // Only admins and sub-admins can access
      if (role !== "admin" && role !== "sub_admin") {
        router.push("/dashboard");
        return;
      }

      setUser(user);
      fetchViolations();
    };
    getUser();
  }, [router, supabase]);

  const fetchViolations = async () => {
    try {
      const response = await fetch("/api/violations");
      if (response.ok) {
        const data = await response.json();
        setViolations(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching violations:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Violation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    setStats({
      total: data.length,
      pending: data.filter((v) => v.status === "pending").length,
      underReview: data.filter((v) => v.status === "under_review").length,
      resolved: data.filter((v) => v.status === "resolved").length,
      dismissed: data.filter((v) => v.status === "dismissed").length,
      todayCount: data.filter((v) => new Date(v.createdAt) >= today).length,
      weekCount: data.filter((v) => new Date(v.createdAt) >= weekAgo).length,
    });
  };

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".stat-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const recentViolations = violations
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">
                  {userRole === "admin"
                    ? "Full system management"
                    : "Violation management and review"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {userRole === "admin" && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/users")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              )}
              <Button onClick={() => router.push("/violations")}>
                <Eye className="w-4 h-4 mr-2" />
                View All Violations
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Violations */}
          <Card className="stat-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.total}
              </h3>
              <p className="text-sm text-gray-600">Total Violations</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  +{stats.todayCount} today
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Pending */}
          <Card className="stat-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.pending}
              </h3>
              <p className="text-sm text-gray-600">Pending Review</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {((stats.pending / stats.total) * 100 || 0).toFixed(1)}% of
                  total
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Under Review */}
          <Card className="stat-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.underReview}
              </h3>
              <p className="text-sm text-gray-600">Under Review</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {((stats.underReview / stats.total) * 100 || 0).toFixed(1)}%
                  of total
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Resolved */}
          <Card className="stat-card">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.resolved}
              </h3>
              <p className="text-sm text-gray-600">Resolved</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {((stats.resolved / stats.total) * 100 || 0).toFixed(1)}%
                  success rate
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardBody className="p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Status Distribution
              </h3>
              <div className="flex-1 gap-6 flex flex-col ">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Pending
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.pending}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.pending / stats.total) * 100 || 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Under Review
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.underReview}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (stats.underReview / stats.total) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Resolved
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.resolved}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.resolved / stats.total) * 100 || 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Dismissed
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.dismissed}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.dismissed / stats.total) * 100 || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Recent Violations */}
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Recent Violations
              </h3>
              <div className="space-y-3">
                {recentViolations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No violations yet
                  </p>
                ) : (
                  recentViolations.map((violation) => (
                    <div
                      key={violation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/violations`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {violation.vehiclePlate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              violation.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : violation.status === "under_review"
                                ? "bg-blue-100 text-blue-800"
                                : violation.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {violation.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {violation.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(violation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {recentViolations.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push("/violations")}
                >
                  View All Violations
                </Button>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push("/violations?status=pending")}
              >
                <Clock className="w-5 h-5 mr-3 text-yellow-600" />
                <div className="text-left">
                  <p className="font-semibold">Review Pending</p>
                  <p className="text-xs text-gray-600">
                    {stats.pending} violations waiting
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push("/violations")}
              >
                <AlertTriangle className="w-5 h-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold">All Violations</p>
                  <p className="text-xs text-gray-600">Manage all reports</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => router.push("/report")}
              >
                <Users className="w-5 h-5 mr-3 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold">New Report</p>
                  <p className="text-xs text-gray-600">
                    Create violation report
                  </p>
                </div>
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
