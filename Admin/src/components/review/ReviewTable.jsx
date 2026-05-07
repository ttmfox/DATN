import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Trash2, Search } from 'lucide-react';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ToastProvider, { showToast } from "../ToastProvider";

const handleToast = () => {
    showToast("Delete successfully !!!", "success");
}

const ReviewTable = () => {
    const [reviews, setReviews] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await axios.get('http://localhost:8080/tirashop/reviews');
            let fetchedReviews = response.data.data?.elementList || [];

            if (!Array.isArray(fetchedReviews)) {
                console.error("Expected an array but got: ", fetchedReviews);
                fetchedReviews = [];
            }

            setReviews(fetchedReviews);
            setTotalPages(Math.ceil(fetchedReviews.length / pageSize));
        } catch (err) {
            console.error('Error fetching reviews:', err);
            toast.error("Failed to load review data.");
        }
    };

    const filteredReviews = reviews.filter(review =>
        review.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setTotalPages(Math.ceil(filteredReviews.length / pageSize));
        setCurrentPage(0);
    }, [searchTerm]);

    const paginatedReviews = filteredReviews.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleDeleteReview = async () => {
        if (!reviewToDelete) return;
    
        try {
            await axios.delete(`http://localhost:8080/tirashop/reviews/delete`, {
                params: { id: reviewToDelete.id }
            });
            setReviews((prevReviews) => prevReviews.filter((review) => review.id !== reviewToDelete.id));
            toast.success("Đánh giá đã được xóa thành công!");
        } catch (err) {
            console.error("Error deleting review:", err);
            toast.error("Failed to delete review. Please try again.");
        }
    
        setIsDeleteModalOpen(false);
        setReviewToDelete(null);
    };
    
    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className='m-5 p-6 bg-white text-black rounded-xl'>
            <ToastProvider />
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>Danh Sách Đánh Giá</h2>
                <div className='relative'>
                    <input
                        type='text'
                        placeholder='Tìm kiếm theo Tên người dùng hoặc Tên sản phẩm...'
                        className='bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        onChange={handleSearchChange}
                        value={searchTerm}
                    />
                    <Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
                </div>
            </div>

            <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300 table-fixed'>
                    <thead>
                        <tr>
                          <th className='pl-8 py-3 pr-8 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>ID</th>
                        <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Tên người dùng</th>
                        <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Sản phẩm</th>
                        <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Xếp hạng</th>
                        <th className='py-3 pr-8 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Văn bản đánh giá</th>
                        <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hình ảnh</th>
                        <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hành động</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-300'>
                        {paginatedReviews.map((review) => (
                            <motion.tr key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <td className='pl-8 py-3 pr-8 text-sm text-gray-700'>{review.id}</td>
                                <td className='py-3 text-sm text-gray-700 min-w-[150px]'>{review.username}</td>
                                <td className='py-3 text-sm text-gray-700 min-w-[150px]'>{review.productName}</td>
                                <td className='py-3 pl-4 text-sm text-gray-700 min-w-[150px]'>{review.rating}⭐</td>
                                <td className='py-3 text-sm text-gray-700 min-w-[150px]'>{review.reviewText}</td>
                                <td className='py-3 pr-8 text-sm text-gray-700 min-w-[150px]'>
                                    <img src={`http://localhost:8080${review.image}`} alt='Review' className='w-16 h-16 object-cover rounded-lg' />
                                </td>
                                <td className='py-3 text-sm text-gray-700 min-w-[150px]'>
                                    <button
                                        className='ml-4 text-red-600 hover:text-red-500'
                                        onClick={() => {
                                            setIsDeleteModalOpen(true);
                                            setReviewToDelete(review);
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
                       <h2 className='text-lg font-semibold text-red-500'>Xác nhận xóa</h2>
<p className='text-gray-700 mt-2'>Bạn có chắc chắn muốn xóa bài đánh giá này không?</p>
                        <div className='flex justify-center gap-4 mt-4'>
                            <button className='px-4 py-2 bg-gray-500 text-white rounded-lg' onClick={() => setIsDeleteModalOpen(false)}>Hủy</button>
                            <button className='px-4 py-2 bg-red-500 text-white rounded-lg' onClick={handleDeleteReview}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewTable;
