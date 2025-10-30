import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ViolationStatus, ViolationType } from "@/types";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "type";
  status?: ViolationStatus;
  type?: ViolationType;
}

export function Badge({ className, variant = "default", status, type, children, ...props }: BadgeProps) {
  const getStatusColor = (status: ViolationStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 ring-yellow-500/20";
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-300 ring-blue-500/20";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-300 ring-green-500/20";
      case "dismissed":
        return "bg-gray-100 text-gray-800 border-gray-300 ring-gray-500/20";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 ring-gray-500/20";
    }
  };

  const getTypeColor = (type: ViolationType) => {
    switch (type) {
      case "speeding":
        return "bg-red-100 text-red-800 border-red-300 ring-red-500/20";
      case "red_light":
        return "bg-orange-100 text-orange-800 border-orange-300 ring-orange-500/20";
      case "illegal_parking":
        return "bg-purple-100 text-purple-800 border-purple-300 ring-purple-500/20";
      case "reckless_driving":
        return "bg-pink-100 text-pink-800 border-pink-300 ring-pink-500/20";
      case "no_seatbelt":
        return "bg-indigo-100 text-indigo-800 border-indigo-300 ring-indigo-500/20";
      case "phone_usage":
        return "bg-cyan-100 text-cyan-800 border-cyan-300 ring-cyan-500/20";
      case "drunk_driving":
        return "bg-rose-100 text-rose-800 border-rose-300 ring-rose-500/20";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 ring-gray-500/20";
    }
  };

  let colorClass = "bg-gray-100 text-gray-800 border-gray-300 ring-gray-500/20";

  if (variant === "status" && status) {
    colorClass = getStatusColor(status);
  } else if (variant === "type" && type) {
    colorClass = getTypeColor(type);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 ring-2",
        colorClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
