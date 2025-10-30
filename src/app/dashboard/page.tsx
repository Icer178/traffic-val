"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, Clock, CheckCircle, Shield, Eye, Users } from "lucide-react";
import { useViolations } from "@/hooks/useViolations";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: violations, isLoading } = useViolations();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    getUser();
  }, [router, supabase]);

  useEffect(() => {
    gsap.fromTo(
      ".stat-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
    );
  }, [violations]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Get role from user metadata
  const userRole = user.user_metadata?.role || "user";
  const userName = user.user_metadata?.name || user.email?.split('@')[0] || "User";

  const stats = {
    total: violations?.length || 0,
    pending: violations?.filter((v) => v.status === "pending").length || 0,
    underReview: violations?.filter((v) => v.status === "under_review").length || 0,
    resolved: violations?.filter((v) => v.status === "resolved").length || 0,
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case "admin":
        return {
          title: "Administrator",
          description: "Full system access and management",
          icon: Shield,
          color: "from-blue-600 to-blue-700",
          bgColor: "bg-blue-50",
          textColor: "text-blue-900",
        };
      case "sub_admin":
        return {
          title: "Sub Administrator",
          description: "Manage and review all violations",
          icon: Eye,
          color: "from-purple-600 to-purple-700",
          bgColor: "bg-purple-50",
          textColor: "text-purple-900",
        };
      default:
        return {
          title: "User",
          description: "Report and track your violations",
          icon: Users,
          color: "from-green-600 to-green-700",
          bgColor: "bg-green-50",
          textColor: "text-green-900",
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {userName}!
              </h1>
              <p className="text-gray-600">Here's your dashboard overview</p>
            </div>
            <Button onClick={async () => {
              await supabase.auth.signOut();
              router.push("/auth/signin");
              router.refresh();
            }} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Badge */}
        <Card className={`mb-8 ${roleInfo.bgColor} border-2`}>
          <CardBody className="flex items-center gap-4 p-6">
            <div className={`p-4 bg-gradient-to-br ${roleInfo.color} rounded-2xl shadow-lg`}>
              <RoleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${roleInfo.textColor}`}>{roleInfo.title}</h2>
              <p className="text-gray-600">{roleInfo.description}</p>
            </div>
          </CardBody>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card hover:shadow-xl transition-all duration-300">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Violations</p>
                <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-2xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardBody>
          </Card>

          <Card className="stat-card hover:shadow-xl transition-all duration-300">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-4xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-4 bg-yellow-100 rounded-2xl">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardBody>
          </Card>

          <Card className="stat-card hover:shadow-xl transition-all duration-300">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Under Review</p>
                <p className="text-4xl font-bold text-gray-900">{stats.underReview}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-purple-600" />
              </div>
            </CardBody>
          </Card>

          <Card className="stat-card hover:shadow-xl transition-all duration-300">
            <CardBody className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Resolved</p>
                <p className="text-4xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userRole === "user" && (
                <Button
                  onClick={() => router.push("/report")}
                  className="h-24 text-lg"
                  size="lg"
                >
                  <FileText className="w-6 h-6 mr-2" />
                  Report Violation
                </Button>
              )}
              
              {(userRole === "admin" || userRole === "sub_admin") && (
                <Button
                  onClick={() => router.push("/admin")}
                  className="h-24 text-lg"
                  size="lg"
                >
                  <Shield className="w-6 h-6 mr-2" />
                  Admin Panel
                </Button>
              )}

              <Button
                onClick={() => router.push("/violations")}
                variant="outline"
                className="h-24 text-lg"
                size="lg"
              >
                <Eye className="w-6 h-6 mr-2" />
                View All Violations
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Role-specific Information */}
        <Card className="mt-8">
          <CardBody className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Permissions</h2>
            <div className="space-y-3">
              {userRole === "admin" && (
                <>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>View all violations</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Update violation status</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Delete violations</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Full system management</span>
                  </div>
                </>
              )}

              {userRole === "sub_admin" && (
                <>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>View all violations</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Update status (pending/under review)</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Add admin notes</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Cannot resolve or dismiss violations</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Cannot delete violations</span>
                  </div>
                </>
              )}

              {userRole === "user" && (
                <>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Report new violations</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>View your own violations</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Cannot view other users' violations</span>
                  </div>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
