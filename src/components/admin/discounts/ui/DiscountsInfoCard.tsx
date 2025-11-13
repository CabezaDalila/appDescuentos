import { Gift } from "lucide-react";

interface DiscountsInfoCardProps {
  icon?: React.ReactNode;
  message: string;
}

export function DiscountsInfoCard({
  icon = <Gift className="h-5 w-5" />,
  message,
}: DiscountsInfoCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
}
