import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { LucideIcon } from "lucide-react";
import React, { memo } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  icon?: LucideIcon;
  className?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const FormField = memo(function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  icon: Icon,
  className = "",
  maxLength,
  onFocus,
  onBlur,
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 flex items-center gap-2"
      >
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        className={
          error
            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500"
            : ""
        }
      />
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span>•</span>
          {error}
        </p>
      )}
    </div>
  );
});
