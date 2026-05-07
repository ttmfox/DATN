import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
        <div className="flex justify-center mt-4 space-x-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="flex items-center px-3 py-1 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md text-sm transition duration-300 ease-in-out transform hover:scale-105 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FaChevronLeft className="mr-1" /> Trước
            </button>
            <span className="px-4 py-1 text-sm font-semibold text-gray-800 bg-gray-200 rounded-full shadow-sm">
                {currentPage + 1} / {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="flex items-center px-3 py-1 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md text-sm transition duration-300 ease-in-out transform hover:scale-105 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Sau <FaChevronRight className="ml-1" />
            </button>
        </div>
    );
};

export default Pagination;
