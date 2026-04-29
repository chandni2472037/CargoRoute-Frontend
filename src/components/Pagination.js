import React from 'react';

/**
 * Builds the array of page items to display.
 * Rules:
 *  - Always show page 1 and last page
 *  - Always show currentPage ± 1
 *  - Insert an 'ellipsis' marker wherever there is a gap > 1
 */
function getPaginationPages(totalPages, currentPage) {
  if (totalPages <= 1) return [1];

  const pagesSet = new Set();
  pagesSet.add(1);
  pagesSet.add(totalPages);
  pagesSet.add(currentPage);
  if (currentPage - 1 >= 1) pagesSet.add(currentPage - 1);
  if (currentPage + 1 <= totalPages) pagesSet.add(currentPage + 1);

  const sorted = Array.from(pagesSet).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      result.push('ellipsis');
    }
  }
  return result;
}

/**
 * Condensed pagination with ellipsis.
 *
 * Props:
 *   currentPage  {number}
 *   totalPages   {number}
 *   onPageChange {(page: number) => void}
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = getPaginationPages(totalPages, currentPage);

  return (
    <div className="pagination pagination-right">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        ‹ Prev
      </button>

      {pages.map((p, idx) => {
        if (p === 'ellipsis') {
          return (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
              …
            </span>
          );
        }
        return (
          <button
            key={p}
            className={`pagination-btn${currentPage === p ? ' pagination-btn-active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        );
      })}

      <button
        className="pagination-btn"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next ›
      </button>
    </div>
  );
}
