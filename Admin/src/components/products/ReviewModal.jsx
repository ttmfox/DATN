


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

const ReviewModal = ({ isOpen, onClose, product }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            fetchReviews();
        }
    }, [isOpen, product]);

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`http://localhost:8080/tirashop/reviews/product/${product.id}`);
            
            console.log("API Response:", response.data); // Kiểm tra API trả về gì
    
            // Lấy dữ liệu từ đúng key trong JSON
            const fetchedReviews = response.data.data?.elementList || [];
    
            console.log("Fetched Reviews:", fetchedReviews); // Kiểm tra dữ liệu đã lấy đúng chưa
    
            setReviews(Array.isArray(fetchedReviews) ? fetchedReviews : []);
        } catch (err) {
            setError('Failed to load reviews.');
            console.error("API Error:", err);
            toast.error('Failed to load reviews.');
            setReviews([]);
        }
        setLoading(false);
    };
    

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <motion.div 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-lg shadow-lg w-[500px]"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Đánh giá cho {product.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <p>Loading reviews...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : reviews.length === 0 ? (
                    <p>Không có đánh giá nào cho sản phẩm này.</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b pb-3 mb-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Đánh giá của người dùng : </strong> {review.username}
                                </p>
                                <p className="text-sm text-gray-700">
                                    <strong>Đánh giá cho sản phẩm:</strong> {review.rating}⭐
                                </p>
                                <p className="text-sm text-gray-700">
                                    <strong>Nội dung:</strong> {review.reviewText}
                                </p>
                                <p className="text-sm text-gray-900">{review.review}</p>
                                {review.image && (
                                    <img 
                                        src={`http://localhost:8080${review.image}`} 
                                        alt="Review" 
                                        className="w-[150px] h-[150px] object-cover mt-2 rounded" 
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ReviewModal;
