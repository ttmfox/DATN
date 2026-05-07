import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditCategoryModal = ({ isOpen, onClose, category, onCategoryUpdated }) => {
    const [categoryData, setCategoryData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category) {
            setCategoryData({ name: category.name, description: category.description });
        }
    }, [category]);

    if (!isOpen || !category) return null;

    const handleChange = (e) => {
        setCategoryData({ ...categoryData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.put(`http://localhost:8080/tirashop/category/update/${category.id}`, categoryData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data && response.data.data) {
                onCategoryUpdated(response.data.data);

                // Đóng modal ngay lập tức
                onClose();

                // Hiển thị Toast sau khi modal đóng
                toast.success('Sửa thành công!', { autoClose: 2000 });
            } else {
                throw new Error(response.data.message || 'Invalid response from server');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update category. Please try again.';
            toast.error(errorMessage);
            console.error('Error:', err);
        }

        setLoading(false);
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-lg font-semibold text-gray-900'>Sửa Danh Mục</h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Tên danh mục</label>
                        <input
                            type='text'
                            name='name'
                            value={categoryData.name}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Mô tả</label>
                        <textarea
                            name='description'
                            value={categoryData.description}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    <div className='flex justify-end gap-2 mt-4'>
                        <button type='button' onClick={onClose} className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'>
                            Hủy
                        </button>
                        <button type='submit' disabled={loading} className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>
                            {loading ? 'Updating...' : 'Sửa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategoryModal;
