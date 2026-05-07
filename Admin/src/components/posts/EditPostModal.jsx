import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactMarkdown from 'react-markdown';

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
    const [postData, setPostData] = useState({
        name: '',
        topic: '',
        short_description: '',
        content: '',
        image: null,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (post) {
            setPostData({
                name: post.name,
                topic: post.topic,
                short_description: post.short_description,
                content: post.content,
                image: null,
            });
        }
    }, [post]);

    if (!isOpen || !post) return null;

    const handleChange = (e) => {
        setPostData({ ...postData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setPostData({ ...postData, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('name', postData.name);
        formData.append('topic', postData.topic);
        formData.append('shortDescription', postData.short_description);
        formData.append('content', postData.content);
        if (postData.image) {
            formData.append('image', postData.image);
        }

        try {
            const response = await axios.put(`http://localhost:8080/tirashop/posts/${post.id}/update`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data && response.data.data) {
                onPostUpdated(response.data.data);
                onClose();
                toast.success('Bài viết đã được cập nhật thành công!', { autoClose: 2000 });
            } else {
                throw new Error(response.data.message || 'Invalid response from server');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update post. Please try again.';
            toast.error(errorMessage);
            console.error('Error:', err);
        }

        setLoading(false);
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-auto p-2'>
            <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl max-h-[98vh] overflow-y-auto'>

                <div className='flex justify-between items-center mb-2'>
                    <h2 className='text-lg font-semibold text-gray-900'>Chỉnh sửa bài viết</h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex gap-4 mb-2">
                        {/* Post Name group */}
                        <div className="flex items-center gap-2 w-1/2">
                            <label className="text-gray-700 text-sm font-medium whitespace-nowrap">Tên bài đăng:</label>
                            <input
                                type="text"
                                name="name"
                                value={postData.name}
                                onChange={handleChange}
                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Topic group */}
                        <div className="flex items-center gap-2 w-1/2">
                            <label className="text-gray-700 text-sm font-medium whitespace-nowrap">Chủ đề:</label>
                            <input
                                type="text"
                                name="topic"
                                value={postData.topic}
                                onChange={handleChange}
                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>
                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Mô tả ngắn:</label>
                        <textarea
                            name='shortDescription'
                            value={postData.short_description}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Nội dung:</label>
                        <div className="grid grid-cols-2 gap-2">
                            {/* Left: Markdown Editor */}
                            <textarea
                                name='content'
                                value={postData.content}
                                onChange={handleChange}
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-72 resize-none'

                                required
                            />

                            {/* Right: Live Preview */}
                            <div className="border rounded-lg p-3 bg-gray-50 overflow-auto h-72 prose prose-sm max-w-full text-gray-800">
                                <ReactMarkdown>{postData.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>


                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Hình ảnh:</label>
                        <input
                            type='file'
                            name='image'
                            onChange={handleFileChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            accept='image/*'
                        />
                        {post.imageUrl && !postData.image && (
                            <img
                                src={`http://localhost:8080${post.imageUrl}`}
                                alt='Post Image'
                                className='mt-2 w-20 h-20 object-cover rounded-lg'
                            />
                        )}
                        {postData.image && (
                            <img
                                src={URL.createObjectURL(postData.image)}
                                alt='New Post Image'
                                className='mt-2 w-20 h-20 object-cover rounded-lg'
                            />
                        )}
                    </div>

                    <div className='flex justify-end gap-2'>
                        <button type='button' onClick={onClose} className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'>
                            Hủy
                        </button>
                        <button type='submit' disabled={loading} className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>
                            {loading ? 'Updating...' : 'Cập nhật bài viết'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPostModal;
