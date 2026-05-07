import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

const AddPostModal = ({ isOpen, onClose, onPostAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        topic: '',
        shortDescription: '',
        content: ''
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name || !formData.topic || !formData.shortDescription || !formData.content) {
            toast.error('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        if (!image) {
            toast.error('Vui lòng chọn hình ảnh!');
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // Tạo FormData để gửi multipart/form-data
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('topic', formData.topic);
            submitData.append('shortDescription', formData.shortDescription);
            submitData.append('content', formData.content);
            submitData.append('image', image);

            const response = await axios.post(
                'http://localhost:8080/tirashop/posts/create',
                submitData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.status === 'success') {
                toast.success('Thêm bài viết thành công!');
                onPostAdded(response.data.data);
                handleClose();
            }
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo bài viết. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            topic: '',
            shortDescription: '',
            content: ''
        });
        setImage(null);
        setImagePreview(null);
        onClose();
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-xl font-semibold text-gray-900'>Thêm Bài Viết Mới</h2>
                    <button onClick={handleClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Tên bài viết */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Tên bài viết <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Nhập tên bài viết'
                            required
                        />
                    </div>

                    {/* Chủ đề */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Chủ đề <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='text'
                            name='topic'
                            value={formData.topic}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Nhập chủ đề'
                            required
                        />
                    </div>

                    {/* Mô tả ngắn */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Mô tả ngắn <span className='text-red-500'>*</span>
                        </label>
                        <textarea
                            name='shortDescription'
                            value={formData.shortDescription}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Nhập mô tả ngắn'
                            rows='3'
                            required
                        />
                    </div>

                    {/* Nội dung */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Nội dung <span className='text-red-500'>*</span>
                        </label>
                        <textarea
                            name='content'
                            value={formData.content}
                            onChange={handleInputChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Nhập nội dung bài viết'
                            rows='6'
                            required
                        />
                    </div>

                    {/* Hình ảnh */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Hình ảnh <span className='text-red-500'>*</span>
                        </label>
                        <input
                            type='file'
                            accept='image/*'
                            onChange={handleImageChange}
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                            required
                        />
                        {imagePreview && (
                            <div className='mt-3'>
                                <img 
                                    src={imagePreview} 
                                    alt='Preview' 
                                    className='w-full h-48 object-cover rounded-lg border border-gray-300'
                                />
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className='flex justify-end gap-3 mt-6'>
                        <button
                            type='button'
                            onClick={handleClose}
                            className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <button
                            type='submit'
                            className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang tạo...' : 'Thêm bài viết'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPostModal;