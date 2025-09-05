// Custom date input that respects user's date format preference
// Unlike browser's native date input, this shows dates in the user's chosen format

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForDisplayWithLocale } from "@/lib/utils/billing-dates";

interface CustomDateInputProps {
  id?: string;
  label?: string;
  value: string; // Always in YYYY-MM-DD format
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  dateFormat?: 'US' | 'EU' | 'ISO';
  min?: string;
  max?: string;
}

export function CustomDateInput({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className,
  dateFormat = 'US',
  min,
  max
}: CustomDateInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [localError, setLocalError] = useState<string>("");

  // Convert YYYY-MM-DD to display format
  const formatForDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    
    try {
      const date = new Date(isoDate + 'T00:00:00'); // Prevent timezone issues
      
      switch (dateFormat) {
        case 'US':
          return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit', 
            year: 'numeric'
          }); // MM/DD/YYYY
        case 'EU':
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }); // DD/MM/YYYY
        case 'ISO':
          return isoDate; // YYYY-MM-DD
        default:
          return isoDate;
      }
    } catch {
      return isoDate;
    }
  };

  // Convert display format back to YYYY-MM-DD
  const parseFromDisplay = (displayValue: string): string => {
    if (!displayValue) return "";
    
    try {
      let day: number, month: number, year: number;
      
      // Remove any non-digit characters except separators
      const cleaned = displayValue.replace(/[^\d\/\-\.]/g, '');
      
      switch (dateFormat) {
        case 'US':
          // MM/DD/YYYY or MM-DD-YYYY
          const usParts = cleaned.split(/[\/\-\.]/);
          if (usParts.length === 3) {
            month = parseInt(usParts[0], 10);
            day = parseInt(usParts[1], 10);
            year = parseInt(usParts[2], 10);
          } else {
            return "";
          }
          break;
          
        case 'EU':
          // DD/MM/YYYY or DD-MM-YYYY
          const euParts = cleaned.split(/[\/\-\.]/);
          if (euParts.length === 3) {
            day = parseInt(euParts[0], 10);
            month = parseInt(euParts[1], 10);
            year = parseInt(euParts[2], 10);
          } else {
            return "";
          }
          break;
          
        case 'ISO':
          // YYYY-MM-DD
          const isoParts = cleaned.split(/[\/\-\.]/);
          if (isoParts.length === 3) {
            year = parseInt(isoParts[0], 10);
            month = parseInt(isoParts[1], 10);
            day = parseInt(isoParts[2], 10);
          } else {
            return "";
          }
          break;
          
        default:
          return "";
      }

      // Validate date parts
      if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        return "";
      }

      // Create ISO date string
      const isoDate = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Validate the date is real
      const testDate = new Date(isoDate + 'T00:00:00');
      if (testDate.getFullYear() !== year || testDate.getMonth() + 1 !== month || testDate.getDate() !== day) {
        return "";
      }
      
      return isoDate;
    } catch {
      return "";
    }
  };

  // Update display value when value prop changes
  useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value, dateFormat]);

  const getPlaceholder = () => {
    switch (dateFormat) {
      case 'US': return "MM/DD/YYYY";
      case 'EU': return "DD/MM/YYYY";
      case 'ISO': return "YYYY-MM-DD";
      default: return "YYYY-MM-DD";
    }
  };

  const getFormatHelper = () => {
    switch (dateFormat) {
      case 'US':
        return "Format: MM/DD/YYYY (e.g., 08/04/2025 for Aug 4, 2025)";
      case 'EU':
        return "Format: DD/MM/YYYY (e.g., 04/08/2025 for 4 Aug 2025)";
      case 'ISO':
        return "Format: YYYY-MM-DD (ISO standard)";
      default:
        return "Format: YYYY-MM-DD";
    }
  };

  const handleChange = (inputValue: string) => {
    setDisplayValue(inputValue);
    
    if (inputValue) {
      const isoDate = parseFromDisplay(inputValue);
      if (isoDate) {
        setLocalError("");
        onChange(isoDate);
      } else {
        setLocalError("Invalid date format");
      }
    } else {
      setLocalError("");
      onChange("");
    }
  };

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
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder={getPlaceholder()}
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
