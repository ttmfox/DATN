import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CategoriesTable = () => {
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        fetchCategories();
    }, [currentPage, searchTerm]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:8080/tirashop/category');
            let fetchedCategories = response.data.data.elementList || [];

            if (searchTerm) {
                fetchedCategories = fetchedCategories.filter(category =>
                    category.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setTotalPages(Math.ceil(fetchedCategories.length / pageSize));
            const paginatedCategories = fetchedCategories.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
            setCategories(paginatedCategories);
        } catch (err) {
            console.error('Error fetching categories:', err);
            toast.error("Failed to load category data.");
        }
    };

    const handleCategoryAdded = (newCategory) => {
        setCategories((prevCategories) => [...prevCategories, newCategory]);
        setTimeout(() => {
            setCurrentPage((prevPage) => Math.ceil((categories.length + 1) / pageSize) - 1);
        }, 100);
        setIsAddModalOpen(false);
    };

    const handleEditClick = (category) => {
        setSelectedCategory(category);
        setIsEditModalOpen(true);
    };

    const handleCategoryUpdated = (updatedCategory) => {
        setCategories((prevCategories) =>
            prevCategories.map((category) => (category.id === updatedCategory.id ? updatedCategory : category))
        );
        setIsEditModalOpen(false);
        setSelectedCategory(null);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(0);
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        try {
            await axios.delete(`http://localhost:8080/tirashop/category/delete/${categoryToDelete.id}`);
            setCategories((prevCategories) => prevCategories.filter((category) => category.id !== categoryToDelete.id));
            toast.success("Category deleted successfully!");
        } catch (err) {
            console.error("Error deleting category:", err);
            toast.error("Có sản phẩm gắn với danh mục, không thể xóa!");
        }

        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className='m-5 p-6 bg-white text-black rounded-xl'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>Danh Sách Danh Mục</h2>
                <div className='flex items-center gap-4'>
                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Tên danh mục...'
                            className='bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            onChange={handleSearchChange}
                            value={searchTerm}
                        />
                        <Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className='bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2'>
                        <Plus size={18} /> Thêm Mới
                    </button>
                </div>
            </div>

            <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300 table-fixed'>
                    <thead>
                        <tr>
                            <th className='pl-16 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>ID</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Tên Danh Mục</th>
                            <th className='px-0 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Mô Tả</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-300'>
                        {categories.map((category) => (
                            <motion.tr key={category.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <td className='pl-16 py-9 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]'>{category.id}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{category.name}</td>
                                <td className='pr-3 py-4 text-sm text-gray-700 min-w-[200px]'>{category.description}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>
                                    <button className='text-indigo-600 hover:text-indigo-500 mr-2' onClick={() => handleEditClick(category)}>
                                        <Edit size={18} />
                                    </button>
                                    <button className='text-red-600 hover:text-red-500' onClick={() => handleDeleteClick(category)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            <AddCategoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onCategoryAdded={handleCategoryAdded} />
            {isEditModalOpen && <EditCategoryModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} category={selectedCategory} onCategoryUpdated={handleCategoryUpdated} />}
            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
                        <h2 className='text-lg font-semibold text-red-500'>Xác Nhận Xóa</h2>
                        <p className='text-gray-700 mt-2'>Bạn có muốn xóa <span className='font-bold text-red-500'>{categoryToDelete?.name}</span>?</p>
                        <div className='flex justify-center gap-4 mt-4'>
                            <button className='px-4 py-2 bg-gray-500 text-white rounded-lg' onClick={() => setIsDeleteModalOpen(false)}>Hủy</button>
                            <button className='px-4 py-2 bg-red-500 text-white rounded-lg' onClick={handleDeleteCategory}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesTable;
