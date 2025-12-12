import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface BookingStatusProps {
  status: "PENDING" | "CONFIRMED" | "FAILED";
  message?: string;
}
export function BookingStatus({ status, message }: BookingStatusProps) {
  const config = {
    PENDING: {
      icon: Loader2,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "Processing booking...",
      animate: "animate-spin",
    },
    CONFIRMED: {
      icon: CheckCircle,
      color: "text-sage-700",
      bg: "bg-sage-50",
      border: "border-sage-200",
      text: "Booking Confirmed",
      animate: "",
    },
    FAILED: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "Booking Failed",
      animate: "",
    },
  };
  const current = config[status];
  const Icon = current.icon;
  return (
    <div
      className={`flex items-center p-4 rounded-lg border ${current.bg} ${current.border} animate-fade-in`}
    >
      <Icon className={`w-5 h-5 ${current.color} ${current.animate} mr-3`} />
      <div>
        <h4 className={`font-medium ${current.color}`}>{current.text}</h4>
        {message && (
          <p className={`text-sm ${current.color} opacity-80 mt-1`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
