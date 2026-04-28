import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 0) return null;

  return (
    <div className="pagination-container">
      {/* Previous */}
      <button
        className="pagination-nav"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ◀ Prev
      </button>

      {/* Dots before active page */}
      {currentPage > 1 && (
        <span className="pagination-ellipsis">...</span>
      )}

      {/* Active page only */}
      <button className="pagination-button active">
        {currentPage}
      </button>

      {/* Dots after active page */}
      {currentPage < totalPages && (
        <span className="pagination-ellipsis">...</span>
      )}

      {/* Next */}
      <button
        className="pagination-nav"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next ▶
      </button>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;