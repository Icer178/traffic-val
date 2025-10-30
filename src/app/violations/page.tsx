"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Car,
  User,
  FileText,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Violation, ViolationStatus, ViolationType } from "@/types";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  dismissed: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels = {
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const typeLabels: Record<ViolationType, string> = {
  speeding: "Speeding",
  red_light: "Red Light",
  illegal_parking: "Illegal Parking",
  reckless_driving: "Reckless Driving",
  no_seatbelt: "No Seatbelt",
  phone_usage: "Phone Usage",
  drunk_driving: "Drunk Driving",
  other: "Other",
};

export default function ViolationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<ViolationType | "all">("all");
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/signin");
      } else {
        setUser(user);
        setUserRole(user.user_metadata?.role || "user");
      }
    };
    getUser();
  }, [router, supabase]);

  useEffect(() => {
    if (user) {
      fetchViolations();
    }
  }, [user]);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/violations");
      if (response.ok) {
        const data = await response.json();
        setViolations(data);
        setFilteredViolations(data);
      }
    } catch (error) {
      console.error("Error fetching violations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = violations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((v) => v.type === typeFilter);
    }

    setFilteredViolations(filtered);
  }, [searchQuery, statusFilter, typeFilter, violations]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this violation?")) return;

    try {
      const response = await fetch(`/api/violations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setViolations(violations.filter((v) => v.id !== id));
        setSelectedViolation(null);
      }
    } catch (error) {
      console.error("Error deleting violation:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading violations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  All Violations
                </h1>
                <p className="text-gray-600">
                  {userRole === "user"
                    ? "Your reported violations"
                    : "Manage all violation reports"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">Total Violations</p>
              <p className="text-3xl font-bold text-gray-900">
                {filteredViolations.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-black w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Search by plate number, location, or description..."
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>

                {(statusFilter !== "all" || typeFilter !== "all") && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                    className="text-sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as ViolationStatus | "all"
                        )
                      }
                      className="text-black w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) =>
                        setTypeFilter(e.target.value as ViolationType | "all")
                      }
                      className="text-black w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="speeding">Speeding</option>
                      <option value="red_light">Red Light</option>
                      <option value="illegal_parking">Illegal Parking</option>
                      <option value="reckless_driving">Reckless Driving</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Violations List */}
        {filteredViolations.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Violations Found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No violations have been reported yet"}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredViolations.map((violation) => (
              <Card
                key={violation.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedViolation(violation)}
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900">
                              {violation.vehiclePlate}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                statusColors[violation.status]
                              }`}
                            >
                              {statusLabels[violation.status]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {typeLabels[violation.type]}
                          </p>
                        </div>

                        {(userRole === "admin" || userRole === "sub_admin") && (
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              className="gap-2 p-2 px-3 items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/violations/${violation.id}/edit`);
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            {userRole === "admin" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(violation.id);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{violation.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {new Date(violation.dateTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Car className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {violation.vehicleModel || "Unknown model"}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {violation.description}
                      </p>

                      {/* Evidence Badge */}
                      {violation.evidenceUrls &&
                        violation.evidenceUrls.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                              <ImageIcon className="w-3 h-3" />
                              <span>
                                {violation.evidenceUrls.length} file(s)
                              </span>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 text-black" />
                    </Button> */}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedViolation && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedViolation(null)}
          >
            <Card
              className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardBody className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Violation Details
                  </h2>
                  <button
                    onClick={() => setSelectedViolation(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status and Type */}
                  <div className="flex gap-3">
                    <span
                      className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                        statusColors[selectedViolation.status]
                      }`}
                    >
                      {statusLabels[selectedViolation.status]}
                    </span>
                    <span className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {typeLabels[selectedViolation.type]}
                    </span>
                  </div>

                  {/* Vehicle Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">License Plate</p>
                        <p className="font-semibold text-gray-900">
                          {selectedViolation.vehiclePlate}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Model</p>
                        <p className="font-semibold text-gray-900">
                          {selectedViolation.vehicleModel || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Color</p>
                        <p className="font-semibold text-gray-900">
                          {selectedViolation.vehicleColor || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Time */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location & Time
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-semibold text-gray-900">
                          {selectedViolation.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date & Time</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(
                            selectedViolation.dateTime
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Description
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedViolation.description}
                    </p>
                  </div>

                  {/* Reporter Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Reporter Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-semibold text-gray-900">
                          {selectedViolation.reporterName}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">
                          {selectedViolation.reporterEmail}
                        </p>
                      </div>
                      {selectedViolation.reporterPhone && (
                        <div>
                          <p className="text-gray-600">Phone</p>
                          <p className="font-semibold text-gray-900">
                            {selectedViolation.reporterPhone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evidence */}
                  {selectedViolation.evidenceUrls &&
                    selectedViolation.evidenceUrls.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Evidence ({selectedViolation.evidenceUrls.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedViolation.evidenceUrls.map((url, index) => {
                            const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                            return (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              >
                                {isVideo ? (
                                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                    <Video className="w-8 h-8 text-gray-400" />
                                  </div>
                                ) : (
                                  <img
                                    src={url}
                                    alt={`Evidence ${index + 1}`}
                                    className="w-full aspect-video object-cover"
                                  />
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Admin Notes */}
                  {selectedViolation.adminNotes && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        Admin Notes
                      </h3>
                      <p className="text-sm text-blue-800">
                        {selectedViolation.adminNotes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {userRole === "admin" && (
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() =>
                          router.push(
                            `/violations/${selectedViolation.id}/edit`
                          )
                        }
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Violation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(selectedViolation.id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
