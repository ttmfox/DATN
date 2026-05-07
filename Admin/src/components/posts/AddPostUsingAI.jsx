import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';

const AddPostUsingAI = ({ isOpen, onClose, onPostAdded }) => {
    const [postData, setPostData] = useState({ name: '', topic: '', shortDescription: '', image: null });
    const [generatedPost, setGeneratedPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('DRAFT');

    if (!isOpen) return null;

    const handleChange = (e) => {
        setPostData({ ...postData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setPostData({ ...postData, image: e.target.files[0] });
    };

    const handleGeneratePost = async (e) => {
        e.preventDefault();

        // Kiểm tra xem tất cả các trường đã được nhập hay chưa
        if (!postData.name || !postData.topic || !postData.shortDescription) {
            toast.error('Please fill in all required fields before generating a post.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('name', postData.name);
        formData.append('topic', postData.topic);
        formData.append('shortDescription', postData.shortDescription);
        if (postData.image) {
            formData.append('image', postData.image);
        }

        try {
            const response = await axios.post('http://localhost:8080/tirashop/posts/createWithAI', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data && response.data.data) {
                setGeneratedPost(response.data.data);
                toast.success('Bài viết đã được tạo thành công! Hãy xem lại trước khi đăng..');
            } else {
                throw new Error(response.data.message || 'Invalid response from server');
            }
        } catch (err) {
            toast.error('Failed to generate post. Please try again.');
            console.error('Error:', err);
        }

        setLoading(false);
    };

    const handlePublishPost = async () => {
        if (!generatedPost || !generatedPost.id) return;

        try {
            await axios.put(`http://localhost:8080/tirashop/posts/${generatedPost.id}/change-status?status=${selectedStatus}`);
            onPostAdded({ ...generatedPost, status: selectedStatus });
            toast.success(`Post status set to ${selectedStatus}!`);

            // Reset và đóng modal
            setPostData({ name: '', topic: '', shortDescription: '', image: null });
            setGeneratedPost(null);
            setSelectedStatus('DRAFT');
            onClose();
        } catch (err) {
            toast.error('Failed to update post status.');
            console.error('Error:', err);
        }
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-lg shadow-lg max-w-[800px] max-h-[95vh] w-full overflow-auto'>

                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-lg font-semibold text-gray-900'>Thêm bài viết bằng AI</h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleGeneratePost}>
                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Tên bài đăng</label>
                        <input
                            type='text'
                            name='name'
                            value={postData.name}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Chủ đề</label>
                        <input
                            type='text'
                            name='topic'
                            value={postData.topic}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Mô tả ngắn</label>
                        <textarea
                            name='shortDescription'
                            value={postData.shortDescription}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Hình ảnh</label>
                        <input
                            type='file'
                            name='image'
                            onChange={handleFileChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            accept='image/*'
                        />
                        {postData.image && (
                            <img
                                src={URL.createObjectURL(postData.image)}
                                alt='Preview'
                                className='mt-2 w-20 h-20 object-cover rounded-lg'
                            />
                        )}
                    </div>

                    <div className='flex justify-end gap-2 mt-4'>
                        <button
                            type='submit'
                            disabled={loading}
                            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Đang tạo...' : 'Tạo bài đăng'}
                        </button>

                    </div>
                </form>

                {generatedPost && (
                    <div className='mt-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>Bản xem trước bài đăng đã tạo</h3>
                        <p><strong>Tên bài đăng:</strong> {generatedPost.name}</p>
                        <p><strong>Chủ đề:</strong> {generatedPost.topic}</p>
                        <p><strong>Mô tả ngắn:</strong> {generatedPost.shortDescription}</p>
                        <div className='mt-2'>
                            <p className='font-semibold text-gray-800'>Nội dung:</p>
                            <div className='prose prose-sm max-w-full'>
                                <ReactMarkdown>{generatedPost.content}</ReactMarkdown>
                            </div>
                        </div>
                        <div className='mt-2'>
                            <label className='block text-gray-700 text-sm font-medium mb-1'>Trạng thái bài đăng</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            >
                                <option value='PUBLISHED'>ĐÃ XUẤT BẢN</option>
                                <option value='DRAFT'>BẢN NHÁP</option>

                            </select>
                        </div>

                        <div className='flex justify-end gap-2 mt-4'>
                            <button onClick={handlePublishPost} className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600'>
                                Lưu bài viết
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddPostUsingAI;
