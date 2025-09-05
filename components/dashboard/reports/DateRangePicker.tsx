// Updated 2024-12-19: DateRangePicker component for custom date filtering

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

const PRESET_RANGES = [
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
  {
    label: "This Quarter",
    getValue: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), quarter * 3, 1),
        end: new Date(now.getFullYear(), quarter * 3 + 3, 0),
      };
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    },
  },
  {
    label: "Last 30 Days",
    getValue: () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return {
        start: thirtyDaysAgo,
        end: now,
      };
    },
  },
  {
    label: "Last 90 Days",
    getValue: () => {
      const now = new Date();
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return {
        start: ninetyDaysAgo,
        end: now,
      };
    },
  },
];

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    const newRange = preset.getValue();
    setTempDateRange(newRange);
    onDateRangeChange(newRange);
    setIsOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!tempDateRange.start || (tempDateRange.start && tempDateRange.end)) {
      // Start new selection
      setTempDateRange({ start: date, end: date });
    } else if (date < tempDateRange.start) {
      // Selected date is before start, make it the new start
      setTempDateRange({ start: date, end: tempDateRange.start });
    } else {
      // Selected date is after start, make it the end
      setTempDateRange({ start: tempDateRange.start, end: date });
    }
  };

  const handleApplyCustomRange = () => {
    if (tempDateRange.start && tempDateRange.end) {
      onDateRangeChange(tempDateRange);
      setIsOpen(false);
    }
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.start || !range.end) return "Select date range";
    
    const startStr = format(range.start, "MMM dd, yyyy");
    const endStr = format(range.end, "MMM dd, yyyy");
    
    if (startStr === endStr) {
      return startStr;
    }
    
    return `${startStr} - ${endStr}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[280px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(dateRange)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset Ranges */}
          <div className="border-r border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Select</h4>
            <div className="space-y-2">
              {PRESET_RANGES.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Range</h4>
            <Calendar
              mode="range"
              selected={{
                from: tempDateRange.start,
                to: tempDateRange.end,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setTempDateRange({ start: range.from, end: range.to });
                } else if (range?.from) {
                  setTempDateRange({ start: range.from, end: range.from });
                }
              }}
              numberOfMonths={2}
              className="rounded-md border-0"
            />
            
            {tempDateRange.start && tempDateRange.end && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {formatDateRange(tempDateRange)}
                </div>
                <Button
                  size="sm"
                  onClick={handleApplyCustomRange}
                  className="ml-2"
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
