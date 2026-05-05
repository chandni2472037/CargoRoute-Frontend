import React from 'react';

/**
 * PaginationControls Component
 * Consistent pagination across all tables in the application.
 * Follows HandoverList pagination pattern.
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 4,
  totalItems = 0,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleDirectPage = (page) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) pages.push(1, '...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push('...', totalPages);

    return pages;
  };

  return (
    <div className={`pagination-controls ${className}`}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="pagination-btn pagination-prev"
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <div className="pagination-numbers">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handleDirectPage(page)}
              disabled={page === currentPage}
              className={`pagination-number ${page === currentPage ? 'active' : ''}`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="pagination-btn pagination-next"
        aria-label="Next page"
      >
        Next →
      </button>

      <span className="pagination-info">
        Page {currentPage} of {totalPages}
        {totalItems > 0 && ` (${totalItems} total)`}
      </span>
    </div>
  );
}
