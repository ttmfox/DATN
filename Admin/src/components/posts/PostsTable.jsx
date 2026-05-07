import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, Plus, Sparkles } from 'lucide-react';
import AddPostUsingAI from './AddPostUsingAI';
import AddPostModal from './AddPostModal';
import EditPostModal from './EditPostModal';
import Pagination from '../common/Pagination';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewContentModal from './ViewContentModal';
import ReactMarkdown from 'react-markdown';


const PostsTable = () => {
    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddAIModalOpen, setIsAddAIModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    const [viewPost, setViewPost] = useState(null);
    const [editPost, setEditPost] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const pageSize = 5;

    useEffect(() => {
        fetchPosts();
    }, [currentPage, searchTerm]);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:8080/tirashop/posts');
            let fetchedPosts = response.data.data.elementList || [];

            if (searchTerm) {
                fetchedPosts = fetchedPosts.filter(post =>
                    post.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setTotalPages(Math.ceil(fetchedPosts.length / pageSize));
            const paginatedPosts = fetchedPosts.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
            setPosts(paginatedPosts);

        } catch (err) {
            console.error('Error fetching posts:', err);
            toast.error("Failed to load post data.");
        }
    };

    const handlePostAdded = (newPost) => {
        setPosts((prevPosts) => {
            const updatedPosts = [...prevPosts, newPost];
            return updatedPosts;
        });

        setTimeout(() => {
            setCurrentPage(Math.ceil((posts.length + 1) / pageSize) - 1);
        }, 100);

        setIsAddModalOpen(false);
        setIsAddAIModalOpen(false);
    };


    const handleEditClick = (post) => {
        setEditPost(post);
        setIsEditModalOpen(true);
    };

    const handleViewClick = (post) => {
        setViewPost(post);
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts((prevPosts) =>
            prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
        setIsEditModalOpen(false);
        setSelectedPost(null);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(0);
    };

    const handleDeleteClick = (post) => {
        setPostToDelete(post);
        setIsDeleteModalOpen(true);
    };

    const handleDeletePost = async () => {
        if (!postToDelete) return;

        try {
            await axios.delete(`http://localhost:8080/tirashop/posts/${postToDelete.id}/delete`);
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postToDelete.id));
            toast.success("Bài viết đã xóa thành công!");
        } catch (err) {
            console.error("Error deleting post:", err);
            toast.error("Failed to delete post. Please try again.");
        }

        setIsDeleteModalOpen(false);
        setPostToDelete(null);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const truncateContent = (content, wordLimit = 30) => {
        const words = content.split(' ');
        return words.length > wordLimit ? words.slice(0, wordLimit).join(' ') + '...' : content;
    };

    return (
        <div className='m-5 p-6 bg-white text-black rounded-xl'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>Danh Sách Bài Viết</h2>
                <div className='flex items-center gap-4'>
                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Tìm kiếm tên bài viết...'
                            className='bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            onChange={handleSearchChange}
                            value={searchTerm}
                        />
                        <Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
                    </div>
                    {/* NEW: Manual Add Button */}
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className='bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors'
                    >
                        <Plus size={18} /> Thêm bài viết
                    </button>
                    {/* AI Add Button */}
                    <button 
                        onClick={() => setIsAddAIModalOpen(true)} 
                        className='bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors'
                    >
                        <Sparkles size={18} /> Thêm bằng AI
                    </button>
                </div>
            </div>

            <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300'>
                    <thead>
                      <tr>
                        <th className='pl-6 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[80px]'>ID</th>
                        <th className='py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[100px]'>Hình ảnh</th>
                        <th className='py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[150px]'>Tên</th>
                        <th className='py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[150px]'>Chủ đề</th>
                        <th className='px-0 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[200px]'>Mô tả ngắn</th>
                        <th className='py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider flex-grow'>Nội dung</th>
                        <th className='py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[120px]'>Hành động</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-300'>
                        {posts.map((post) => (
                            <motion.tr key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <td className='pl-6 py-2 text-xs text-gray-700 w-[80px]'>{post.id}</td>
                                <td className='pl-3 pr-6 py-2 text-xs text-gray-700 w-[100px]'>
                                    <img src={`http://localhost:8080${post.imageUrl}`} alt={post.name} className='w-full h-[65px] rounded-full' />
                                </td>
                                <td className='py-2 text-sm text-gray-700 w-[150px]'>{post.name}</td>
                                <td className='py-2 text-sm text-gray-700 w-[150px]'>{post.topic}</td>
                                <td className='px-0 py-2 text-sm text-gray-700 w-[200px]'>{post.short_description}</td>
                                <td className='py-2 text-sm text-gray-700'>
                                    <div className="prose prose-sm max-w-full">
                                            {truncateContent(post.content)}                                  
                                    </div>
                                    {post.content.split(' ').length > 30 && (
                                        <button
                                            className='text-blue-500 hover:underline ml-2'
                                            onClick={() => handleViewClick(post)}
                                        >
                                            Xem thêm
                                        </button>
                                    )}
                                </td>

                                <td className='py-2 text-sm text-gray-700 w-[120px]'>
                                    <button className='text-indigo-600 hover:text-indigo-500 mr-2' onClick={() => handleEditClick(post)}>
                                        <Edit size={18} />
                                    </button>
                                    <button className='text-red-600 hover:text-red-500' onClick={() => handleDeleteClick(post)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

            </div>
            
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            
            {/* NEW: Manual Add Modal */}
            <AddPostModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onPostAdded={handlePostAdded} 
            />
            
            {/* AI Add Modal */}
            <AddPostUsingAI 
                isOpen={isAddAIModalOpen} 
                onClose={() => setIsAddAIModalOpen(false)} 
                onPostAdded={handlePostAdded} 
            />
            
            <ViewContentModal post={viewPost} onClose={() => setViewPost(null)} />

            {isEditModalOpen && (
                <EditPostModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} post={editPost} onPostUpdated={handlePostUpdated} />
            )}

            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
                        <h2 className='text-lg font-semibold text-red-500'>Xác nhận xóa</h2>
                        <p className='text-gray-700 mt-2'>Bạn có chắc chắn muốn xóa không? <span className='font-bold text-red-500'>{postToDelete?.name}</span>?</p>
                        <div className='flex justify-center gap-4 mt-4'>
                            <button className='px-4 py-2 bg-gray-500 text-white rounded-lg' onClick={() => setIsDeleteModalOpen(false)}>Hủy bỏ</button>
                            <button className='px-4 py-2 bg-red-500 text-white rounded-lg' onClick={handleDeletePost}>Xóa bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PostsTable;