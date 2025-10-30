"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Shield,
  Eye,
  User as UserIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { UserRoles } from "@/types";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    name?: string;
    role?: string;
  };
}

export default function UserManagementPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      // Only admins can access user management
      if (role !== "admin") {
        router.push("/admin");
        return;
      }

      setCurrentUser(user);
      fetchUsers();
    };
    getUser();
  }, [router, supabase]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load users");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError("");
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update user role");
        setUpdating(null);
        return;
      }

      setSuccess("User role updated successfully");
      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update user role");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(userId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete user");
        setDeleting(null);
        return;
      }

      setSuccess("User deleted successfully");
      // Refresh the user list
      await fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-gray-600">Manage user roles and permissions</p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
                    <div className="mt-3 text-xs text-red-700 bg-red-100 rounded p-3">
                      <p className="font-semibold mb-1">Setup Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to your Supabase Dashboard → Settings → API</li>
                        <li>
                          Copy the <strong>service_role</strong> key (not the
                          anon key)
                        </li>
                        <li>
                          Add it to your{" "}
                          <code className="bg-red-200 px-1 rounded">
                            .env.local
                          </code>{" "}
                          file:
                        </li>
                      </ol>
                      <pre className="mt-2 bg-red-200 p-2 rounded text-xs overflow-x-auto">
                        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
                      </pre>
                      <p className="mt-2">
                        ⚠️ Never commit this key to version control!
                      </p>
                      <p className="mt-1">
                        ⚠️ Restart your dev server after adding the key
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Search and Filters */}
        {users.length > 0 && (
          <Card className="mb-6">
            <CardBody className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Users List */}
        {users.length > 0 && (
          <Card className="mb-6">
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users
                      .filter(
                        (u) =>
                          u.email
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          u.user_metadata?.name
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.email?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.user_metadata?.name || "No name"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.user_metadata?.role === "admin"
                                  ? "bg-blue-100 text-blue-800"
                                  : user.user_metadata?.role === "sub_admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.user_metadata?.role || "user"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {user.id === currentUser?.id ? (
                              <span className="text-gray-400">(You)</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select
                                  value={user.user_metadata?.role || "user"}
                                  onChange={(e) =>
                                    handleRoleChange(user.id, e.target.value)
                                  }
                                  disabled={updating === user.id || deleting === user.id}
                                  className="text-black border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="user">User</option>
                                  <option value="sub_admin">Sub-Admin</option>
                                  <option value="admin">Admin</option>
                                </select>
                                {updating === user.id && (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteUser(user.id, user.email || "")
                                  }
                                  disabled={updating === user.id || deleting === user.id}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete user"
                                >
                                  {deleting === user.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Role Reference Card */}
        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Role Permissions Reference
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Admin */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Admin</h4>
                    <p className="text-xs text-blue-700">
                      <code className="bg-blue-100 px-1 rounded">admin</code>
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>View all violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Edit all statuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Delete violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Manage users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Full system access</span>
                  </li>
                </ul>
              </div>

              {/* Sub-Admin */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900">Sub-Admin</h4>
                    <p className="text-xs text-purple-700">
                      <code className="bg-purple-100 px-1 rounded">
                        sub_admin
                      </code>
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>View all violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Edit violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Update status (pending/under review)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Add admin notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600" />
                    <span>Cannot set resolved/dismissed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600" />
                    <span>Cannot delete violations</span>
                  </li>
                </ul>
              </div>

              {/* User */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-900">User</h4>
                    <p className="text-xs text-green-700">
                      <code className="bg-green-100 px-1 rounded">user</code>
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Report violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>View own violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Upload evidence</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Cannot view others' violations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                    <span>Cannot edit after submission</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
