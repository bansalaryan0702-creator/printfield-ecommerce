import React from "react";
import { Button } from "@/src/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pageWindow(page: number, totalPages: number, size = 5): number[] {
  if (totalPages <= size) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const start = Math.min(Math.max(page - Math.floor(size / 2), 1), totalPages - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages = pageWindow(page, totalPages);
  const showStartEllipsis = pages[0] > 1;
  const showEndEllipsis = pages[pages.length - 1] < totalPages;

  return (
    <div className="flex justify-center items-center gap-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </Button>

      {showStartEllipsis && (
        <Button variant="outline" onClick={() => onPageChange(1)}>
          1
        </Button>
      )}
      {showStartEllipsis && <span className="text-sm text-gray-500">...</span>}

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          onClick={() => onPageChange(p)}
          className="min-w-10"
        >
          {p}
        </Button>
      ))}

      {showEndEllipsis && <span className="text-sm text-gray-500">...</span>}
      {showEndEllipsis && (
        <Button variant="outline" onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </Button>
      )}

      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  );
}
