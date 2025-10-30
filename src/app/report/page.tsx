"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Car,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  ArrowLeft,
  CheckCircle,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Navigation,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { ViolationType } from "@/types";

const violationTypes: {
  value: ViolationType;
  label: string;
  description: string;
}[] = [
  {
    value: "speeding",
    label: "Speeding",
    description: "Vehicle exceeding speed limit",
  },
  {
    value: "red_light",
    label: "Red Light Violation",
    description: "Running a red traffic light",
  },
  {
    value: "illegal_parking",
    label: "Illegal Parking",
    description: "Parking in restricted area",
  },
  {
    value: "reckless_driving",
    label: "Reckless Driving",
    description: "Dangerous driving behavior",
  },
  { value: "other", label: "Other", description: "Other traffic violation" },
];

export default function ReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [formData, setFormData] = useState({
    type: "speeding" as ViolationType,
    description: "",
    location: "",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleColor: "",
    dateTime: "",
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
  });

  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const email = user.email || "";
        const name = user.user_metadata?.name || "";
        setUserEmail(email);
        setUserName(name);
        setUserId(user.id);
        setFormData((prev) => ({
          ...prev,
          reporterEmail: email,
          reporterName: name,
        }));
      }
    };
    loadUserData();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      // Validate file types and sizes
      const validFiles = newFiles.filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB max

        if (!isImage && !isVideo) {
          setError("Only image and video files are allowed");
          return false;
        }
        if (!isValidSize) {
          setError("File size must be less than 50MB");
          return false;
        }
        return true;
      });

      setUploadedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "TrafficWatch App",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            setFormData((prev) => ({ ...prev, location: address }));
          } else {
            // Fallback to coordinates if geocoding fails
            setFormData((prev) => ({
              ...prev,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            }));
          }
        } catch (err) {
          // Fallback to coordinates if geocoding fails
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const uploadFilesToStorage = async (
    violationId: string
  ): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${violationId}/${Date.now()}-${i}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("violation-evidence")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        throw error;
      }

      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("violation-evidence").getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setUploadProgress(0);

    try {
      let evidenceUrls: string[] = [];

      // Upload files FIRST if any
      if (uploadedFiles.length > 0) {
        // Generate a temporary ID for the folder structure
        const tempViolationId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`;
        evidenceUrls = await uploadFilesToStorage(tempViolationId);
      }

      // Then create the violation with evidence URLs included
      const response = await fetch("/api/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit violation report");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardBody className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/30 mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Report Submitted Successfully
              </h2>
              <p className="text-gray-600 mb-4">
                Your violation report has been submitted and is now under
                review.
              </p>
              <p className="text-sm text-gray-600">
                Redirecting to dashboard...
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4 mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Report Traffic Violation
              </h1>
              <p className="text-gray-600">
                Submit a detailed report of the traffic violation
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    {error.includes("Location permission") && (
                      <p className="text-xs text-red-600 mt-1">
                        Enable location in your browser settings to use this
                        feature.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Violation Type Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Violation Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {violationTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.type === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as ViolationType,
                          })
                        }
                        className="mt-1"
                        required
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {type.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows={4}
                  placeholder="Provide detailed description of the violation..."
                  required
                />
              </div>

              {/* Vehicle Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      value={formData.vehiclePlate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehiclePlate: e.target.value.toUpperCase(),
                        })
                      }
                      className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="ABC-1234"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleModel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicleModel: e.target.value,
                        })
                      }
                      className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Toyota Camry"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Color
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicleColor: e.target.value,
                        })
                      }
                      className="text-black  w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Silver"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Time Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location & Time
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="text-black flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Main St & 5th Ave, City Name"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={isLoadingLocation}
                        className="px-4 py-3 h-auto"
                        title="Use current location"
                      >
                        {isLoadingLocation ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Navigation className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Click the location icon to use your current location
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date & Time *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="datetime-local"
                        value={formData.dateTime}
                        onChange={(e) =>
                          setFormData({ ...formData, dateTime: e.target.value })
                        }
                        className="text-black  w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporter Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Reporter Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.reporterName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reporterName: e.target.value,
                        })
                      }
                      className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.reporterEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reporterEmail: e.target.value,
                          })
                        }
                        className="text-black w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.reporterPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reporterPhone: e.target.value,
                          })
                        }
                        className="text-black w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Upload Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Evidence (Optional)
                </h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Click to upload images or videos
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, MP4, MOV up to 50MB
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* File Preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {uploadedFiles.map((file, index) => {
                        const isVideo = file.type.startsWith("video/");
                        const previewUrl = URL.createObjectURL(file);

                        return (
                          <div
                            key={index}
                            className="relative group border-2 border-gray-200 rounded-lg overflow-hidden"
                          >
                            {isVideo ? (
                              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <Video className="w-8 h-8 text-gray-400" />
                              </div>
                            ) : (
                              <img
                                src={previewUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full aspect-video object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                              {file.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading evidence...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="flex-1"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  isLoading={isLoading}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Submit Report
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
