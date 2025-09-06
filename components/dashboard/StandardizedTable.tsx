// Updated 2024-12-20: Standardized table component for consistent layouts across dashboard
// Implements unified styling: 48px row height, 12px padding, 14px body text, right-aligned actions

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// Standardized styling constants
export const STANDARDIZED_STYLES = {
  // Row specifications
  ROW_HEIGHT: "h-12", // 48px minimum row height
  
  // Text specifications  
  BODY_TEXT: "text-sm", // 14px body text
  SECONDARY_TEXT: "text-xs text-muted-foreground", // 12px secondary text
  
  // Padding specifications
  CELL_PADDING: "px-3", // 12px horizontal padding
  
  // Column width specifications
  CHECKBOX_WIDTH: "w-12",
  ACTION_WIDTH: "w-16", 
  SMALL_COLUMN: "min-w-[100px]",
  MEDIUM_COLUMN: "min-w-[140px]", 
  LARGE_COLUMN: "min-w-[180px]",
  
  // Action button specifications
  ACTION_BUTTON: "h-8 w-8 p-0",
} as const;

// Standardized table header with consistent styling
interface StandardizedTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const StandardizedTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  StandardizedTableHeaderProps
>(({ children, className, ...props }, ref) => (
  <TableHeader 
    ref={ref} 
    className={cn(
      "bg-muted/30", // Subtle background for headers
      className
    )} 
    {...props}
  >
    {children}
  </TableHeader>
));
StandardizedTableHeader.displayName = "StandardizedTableHeader";

// Standardized table row with consistent height and hover states
interface StandardizedTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export const StandardizedTableRow = React.forwardRef<
  HTMLTableRowElement,
  StandardizedTableRowProps
>(({ children, selected = false, className, ...props }, ref) => (
  <TableRow
    ref={ref}
    className={cn(
      STANDARDIZED_STYLES.ROW_HEIGHT,
      "transition-colors hover:bg-muted/50",
      selected && "bg-violet-50 hover:bg-violet-100",
      className
    )}
    {...props}
  >
    {children}
  </TableRow>
));
StandardizedTableRow.displayName = "StandardizedTableRow";

// Standardized table head cell with consistent styling
interface StandardizedTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  width?: 'checkbox' | 'action' | 'small' | 'medium' | 'large';
}

export const StandardizedTableHead = React.forwardRef<
  HTMLTableCellElement,
  StandardizedTableHeadProps
>(({ 
  children, 
  sortable = false, 
  sortDirection = null, 
  onSort, 
  width,
  className, 
  ...props 
}, ref) => {
  const widthClass = width ? {
    checkbox: STANDARDIZED_STYLES.CHECKBOX_WIDTH,
    action: STANDARDIZED_STYLES.ACTION_WIDTH,
    small: STANDARDIZED_STYLES.SMALL_COLUMN,
    medium: STANDARDIZED_STYLES.MEDIUM_COLUMN,
    large: STANDARDIZED_STYLES.LARGE_COLUMN,
  }[width] : '';

  const SortIcon = sortDirection === null ? ArrowUpDown : 
                   sortDirection === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead
      ref={ref}
      className={cn(
        STANDARDIZED_STYLES.CELL_PADDING,
        "font-semibold text-foreground", // Darker text for headers
        widthClass,
        sortable && "cursor-pointer hover:bg-muted/50",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-2">
          {children}
          <SortIcon className={cn(
            "h-4 w-4",
            sortDirection ? "text-violet-600" : "text-muted-foreground"
          )} />
        </div>
      ) : (
        children
      )}
    </TableHead>
  );
});
StandardizedTableHead.displayName = "StandardizedTableHead";

// Standardized table cell with consistent styling
interface StandardizedTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  variant?: 'default' | 'secondary' | 'numeric';
}

export const StandardizedTableCell = React.forwardRef<
  HTMLTableCellElement,
  StandardizedTableCellProps
>(({ children, variant = 'default', className, ...props }, ref) => {
  const variantStyles = {
    default: STANDARDIZED_STYLES.BODY_TEXT,
    secondary: STANDARDIZED_STYLES.SECONDARY_TEXT,
    numeric: cn(STANDARDIZED_STYLES.BODY_TEXT, "text-right font-mono"),
  };

  return (
    <TableCell
      ref={ref}
      className={cn(
        STANDARDIZED_STYLES.CELL_PADDING,
        "align-middle",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </TableCell>
  );
});
StandardizedTableCell.displayName = "StandardizedTableCell";

// Standardized checkbox cell
interface StandardizedCheckboxCellProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const StandardizedCheckboxCell: React.FC<StandardizedCheckboxCellProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
}) => (
  <StandardizedTableCell className={STANDARDIZED_STYLES.CHECKBOX_WIDTH}>
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="mx-auto"
    />
  </StandardizedTableCell>
);

// Standardized action cell with consistent button placement
interface StandardizedActionCellProps {
  children: React.ReactNode;
}

export const StandardizedActionCell: React.FC<StandardizedActionCellProps> = ({
  children,
}) => (
  <StandardizedTableCell className={cn(
    STANDARDIZED_STYLES.ACTION_WIDTH,
    "text-right"
  )}>
    <div className="flex justify-end">
      {children}
    </div>
  </StandardizedTableCell>
);

// Main standardized table wrapper
interface StandardizedTableProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const StandardizedTable: React.FC<StandardizedTableProps> = ({
  children,
  className,
  containerClassName,
}) => (
  <Card className={cn("overflow-hidden", containerClassName)}>
    <div className="overflow-x-auto">
      <Table className={cn("w-full", className)}>
        {children}
      </Table>
    </div>
  </Card>
);

// Bulk selection toolbar with standardized styling
interface StandardizedBulkToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  children: React.ReactNode;
  className?: string;
}

export const StandardizedBulkToolbar: React.FC<StandardizedBulkToolbarProps> = ({
  selectedCount,
  onClearSelection,
  children,
  className,
}) => (
  <div className={cn(
    "flex items-center justify-between p-4 bg-violet-50 border border-violet-200 rounded-lg mb-4",
    className
  )}>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Checkbox checked={true} />
        <span className={STANDARDIZED_STYLES.BODY_TEXT}>
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClearSelection}
        className="h-6 w-6 p-0"
      >
        ×
      </Button>
    </div>
    
    <div className="flex items-center gap-2">
      {children}
    </div>
  </div>
);

// Loading skeleton with standardized dimensions
interface StandardizedTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const StandardizedTableSkeleton: React.FC<StandardizedTableSkeletonProps> = ({
  rows = 5,
  columns = 4,
}) => (
  <StandardizedTable>
    <StandardizedTableHeader>
      <StandardizedTableRow>
        {Array.from({ length: columns }).map((_, i) => (
          <StandardizedTableHead key={i}>
            <div className="h-4 bg-muted animate-pulse rounded" />
          </StandardizedTableHead>
        ))}
      </StandardizedTableRow>
    </StandardizedTableHeader>
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <StandardizedTableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <StandardizedTableCell key={colIndex}>
              <div className="h-4 bg-muted animate-pulse rounded" />
            </StandardizedTableCell>
          ))}
        </StandardizedTableRow>
      ))}
    </TableBody>
  </StandardizedTable>
);

// Empty state with standardized styling
interface StandardizedTableEmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  columns: number;
}

export const StandardizedTableEmptyState: React.FC<StandardizedTableEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  columns,
}) => (
  <TableRow>
    <TableCell colSpan={columns} className="text-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground max-w-sm">{description}</p>
        </div>
        {action && action}
      </div>
    </TableCell>
  </TableRow>
);
