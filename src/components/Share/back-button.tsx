import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import { Button } from "./button";

interface BackButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  onClick?: () => void;
}

export function BackButton({
  className = "",
  variant = "ghost",
  size = "sm",
  children,
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`text-gray-700 hover:text-gray-900 ${className}`}
    >
      <ArrowLeft className="h-5 w-5" />
      {children}
    </Button>
  );
}
