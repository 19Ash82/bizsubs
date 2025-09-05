// Updated 2024-12-20: Enhanced date input component with unambiguous format indicators
// Prevents date ambiguity issues by clearly showing expected format

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateDateFormat, formatDateForDisplayWithLocale } from "@/lib/utils/billing-dates";

interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  dateFormat?: 'US' | 'EU' | 'ISO';
  min?: string;
  max?: string;
}

export function DateInput({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className,
  placeholder,
  dateFormat = 'US',
  min,
  max
}: DateInputProps) {
  const [localError, setLocalError] = useState<string>("");
  const [displayValue, setDisplayValue] = useState(value);

  // Format helper text based on date format preference
  const getFormatHelper = () => {
    switch (dateFormat) {
      case 'US':
        return "Format: YYYY-MM-DD (e.g., 2025-08-04 for Aug 4, 2025)";
      case 'EU':
        return "Format: YYYY-MM-DD (e.g., 2025-08-04 for 4 Aug 2025)";
      case 'ISO':
        return "Format: YYYY-MM-DD (ISO standard)";
      default:
        return "Format: YYYY-MM-DD";
    }
  };

  // Get example date in the preferred format
  const getExampleDate = () => {
    const exampleDate = new Date('2025-08-04');
    return formatDateForDisplayWithLocale(exampleDate, 'en-US', dateFormat);
  };

  // Validate input on change
  const handleChange = (inputValue: string) => {
    setDisplayValue(inputValue);
    
    if (inputValue) {
      const validation = validateDateFormat(inputValue);
      if (!validation.isValid) {
        setLocalError(validation.error || "Invalid date format");
      } else {
        setLocalError("");
      }
    } else {
      setLocalError("");
    }
    
    onChange(inputValue);
  };

  // Update display value when prop changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const hasError = error || localError;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="space-y-1">
        <Input
          id={id}
          type="date"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          min={min}
          max={max}
          placeholder={placeholder || "YYYY-MM-DD"}
          className={cn(
            hasError && "border-red-500 focus:border-red-500",
            "font-mono" // Monospace font for better date readability
          )}
        />
        
        {/* Format helper text */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {getFormatHelper()}
        </p>
        
        {/* Preview of how the date will be displayed */}
        {displayValue && !hasError && (
          <p className="text-xs text-green-600">
            Will display as: {formatDateForDisplayWithLocale(displayValue, 'en-US', dateFormat)}
          </p>
        )}
        
        {/* Error message */}
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {error || localError}
          </p>
        )}
      </div>
    </div>
  );
}

// Export a simple wrapper for backward compatibility
export function SimpleDateInput({
  value,
  onChange,
  ...props
}: Omit<DateInputProps, 'label'> & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "font-mono", // Monospace for better date readability
        props.className
      )}
      {...props}
    />
  );
}
