import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { cn } from "@/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  isLoading?: boolean;
  isError?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading = false,
  isError = false,
  emptyTitle = "No records found",
  emptyDescription = "There is currently no data to display in this table.",
  onRetry,
  className,
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message="Loading records..." />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load table data"
        message="Please check your connection and retry."
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200/80 bg-white", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const key = keyExtractor
              ? keyExtractor(item, index)
              : "id" in item && typeof (item as { id: unknown }).id === "string"
              ? (item as { id: string }).id
              : String(index);
            return (
              <TableRow key={key}>
                {columns.map((column) => (
                  <TableCell
                    key={`${key}-${column.key}`}
                    className={cn(
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(item, index)
                      : String(
                          column.key in item
                            ? (item as Record<string, unknown>)[column.key] ?? "—"
                            : "—"
                        )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
