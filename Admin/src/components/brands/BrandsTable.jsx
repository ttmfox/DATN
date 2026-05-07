import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import AddBrandModal from './AddBrandModal';
import EditBrandModal from './EditBrandModal';
import Pagination from '../common/Pagination';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BrandsTable = () => {
    const [brands, setBrands] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);


    //so trang
    const pageSize = 5;

    useEffect(() => {
        fetchBrands();

    }, [currentPage, searchTerm]);

    const fetchBrands = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/tirashop/brand`);
            let fetchedBrands = response.data.data.elementList || [];
    
            if (searchTerm) {
                fetchedBrands = fetchedBrands.filter(brand =>
                    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
    
            setTotalPages(Math.ceil(fetchedBrands.length / pageSize)); // Đảm bảo cập nhật số trang chính xác
            const paginatedBrands = fetchedBrands.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
            setBrands(paginatedBrands);
            
        } catch (err) {
            console.error('Error fetching brands:', err);
            toast.error("Failed to load brand data.");
        }
    };


    const handleBrandAdded = (newBrand) => {
        setBrands((prevBrands) => {
            const updatedBrands = [...prevBrands, newBrand]; // Thêm sản phẩm mới vào cuối danh sách
            return updatedBrands;
        });
    
        // Chờ danh sách cập nhật rồi chuyển đến trang cuối
        setTimeout(() => {
            setCurrentPage((prevPage) => {
                return Math.ceil((brands.length + 1) / pageSize) - 1;
            });
        }, 100);
        
        setIsAddModalOpen(false);
    };

    const handleEditClick = (brand) => {
        setSelectedBrand(brand);
        setIsEditModalOpen(true);
    };

    const handleBrandUpdated = (updatedBrand) => {
        setBrands((prevBrands) =>
            prevBrands.map((brand) => (brand.id === updatedBrand.id ? updatedBrand : brand))
        );
        setIsEditModalOpen(false);
        setSelectedBrand(null);

    };
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(0);
    };

    const handleDeleteClick = (brand) => {
        setBrandToDelete(brand);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteBrand = async () => {
        if (!brandToDelete) return;

        try {
            await axios.delete(`http://localhost:8080/tirashop/brand/delete/${brandToDelete.id}`);
            setBrands((prevBrands) => prevBrands.filter((brand) => brand.id !== brandToDelete.id));
            toast.success("Xóa thành công!");
        } catch (err) {
            console.error("Error deleting brand:", err);
            toast.error("Có sản phẩm gắn với thương hiệu, không thể xóa!");
        }

        setIsDeleteModalOpen(false);
        setBrandToDelete(null);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className='m-5 p-6 bg-white text-black rounded-xl'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>Danh Sách Thương Hiệu</h2>
                <div className='flex items-center gap-4'>
                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Tên thương hiệu...'
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
                <table className='min-w-full divide-y divide-gray-300'>
                    <thead>
                        <tr>
                            <th className='pl-16 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>ID</th>
                            <th className='pl-9 pr-14 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Logo</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Tên Thương Hiệu</th>
                            <th className='pl-0 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Mô Tả</th>
                            <th className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-300'>
                        {brands.map((brand) => (
                            <motion.tr key={brand.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <td className='pl-16 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]'>{brand.id}</td>
                                <td className='pl-5 pr-14 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]'>
                                    <img src={`http://localhost:8080${brand.logo}`} alt={brand.name} className='w-[65px] h-[65px] rounded-full' />
                                </td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>{brand.name}</td>
                                <td className='px-0 py-4 pr-4 text-sm text-gray-700 min-w-[200px]'>{brand.description}</td>
                                <td className='py-4 text-sm text-gray-700 min-w-[200px]'>
                                    <button className='text-indigo-600 hover:text-indigo-500 mr-2' onClick={() => handleEditClick(brand)}>
                                        <Edit size={18} />
                                    </button>
                                    <button className='text-red-600 hover:text-red-500' onClick={() => handleDeleteClick(brand)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Phân trang*/}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            <AddBrandModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onBrandAdded={handleBrandAdded} />
            {isEditModalOpen && <EditBrandModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} brand={selectedBrand} onBrandUpdated={handleBrandUpdated} />}
            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
                        <h2 className='text-lg font-semibold text-red-500'>Xác Nhận Xóa</h2>
                        <p className='text-gray-700 mt-2'>Bạn có muốn xóa <span className='font-bold text-red-500'>{brandToDelete?.name}</span>?</p>
                        <div className='flex justify-center gap-4 mt-4'>
                            <button className='px-4 py-2 bg-gray-500 text-white rounded-lg' onClick={() => setIsDeleteModalOpen(false)}>Hủy</button>
                            <button className='px-4 py-2 bg-red-500 text-white rounded-lg' onClick={handleDeleteBrand}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandsTable;



