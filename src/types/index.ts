export type UserRole = "admin" | "sub_admin" | "user";
export enum UserRoles {
  ADMIN = "admin",
  SUB_ADMIN = "sub_admin",
  USER = "user",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type ViolationType =
  | "speeding"
  | "red_light"
  | "illegal_parking"
  | "reckless_driving"
  | "no_seatbelt"
  | "phone_usage"
  | "drunk_driving"
  | "other";

export type ViolationStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "dismissed";

export interface Violation {
  id: string;
  userId: string;
  type: ViolationType;
  description: string;
  location: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleColor?: string;
  dateTime: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  status: ViolationStatus;
  evidenceUrls?: string[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateViolationInput {
  type: ViolationType;
  description: string;
  location: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleColor?: string;
  dateTime: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  evidenceUrls?: string[];
}

export interface ViolationFilters {
  status?: ViolationStatus;
  type?: ViolationType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
