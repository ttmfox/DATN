import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import AddVoucherModal from './AddVoucherModal';
import EditVoucherModal from './EditVoucherModal';
import Pagination from '../common/Pagination';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VouchersTable = () => {
    const [vouchers, setVouchers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [voucherToDelete, setVoucherToDelete] = useState(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        fetchVouchers();
    }, [currentPage, searchTerm]);

    const fetchVouchers = async () => {
        try {
            const response = await axios.get('http://localhost:8080/tirashop/voucher', {
                params: {
                    page: currentPage,  // Gửi tham số phân trang
                    size: pageSize,     // Kích thước trang
                }
            });

            let fetchedVouchers = response.data.data?.elementList || [];
            const total = response.data.data?.totalPages || 1;

            if (!Array.isArray(fetchedVouchers)) {
                console.error('Expected an array but got:', fetchedVouchers);
                fetchedVouchers = [];
            }

            if (searchTerm) {
                fetchedVouchers = fetchedVouchers.filter(voucher =>
                    voucher.code.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setTotalPages(total); // Cập nhật tổng số trang từ API
            setVouchers(fetchedVouchers); // Cập nhật lại danh sách voucher
        } catch (err) {
            console.error('Error fetching vouchers:', err);
            toast.error("Failed to load voucher data.");
        }
    };


    const handleEditClick = (voucher) => {
        setSelectedVoucher(voucher);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (voucher) => {
        setVoucherToDelete(voucher);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteVoucher = async () => {
        if (!voucherToDelete) return;

        try {
            await axios.delete(`http://localhost:8080/tirashop/voucher/delete/${voucherToDelete.id}`);
            setVouchers(prev => prev.filter(v => v.id !== voucherToDelete.id)); // Remove voucher from state
            toast.success("Voucher đã được xóa thành công!");
        } catch (err) {
            console.error("Error deleting voucher:", err);
            toast.error("Failed to delete voucher. Please try again.");
        }

        setIsDeleteModalOpen(false);  // Close the modal after deletion
        setVoucherToDelete(null);     // Reset the voucher to delete
    };

    return (
        <div className='m-5 p-6 bg-white text-black rounded-xl'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>Danh Sách Voucher</h2>
                <div className='flex items-center gap-4'>
                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Tìm kiếm mã phiếu giảm giá...'
                            className='bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            onChange={(e) => setSearchTerm(e.target.value)}
                            value={searchTerm}
                        />
                        <Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className='bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2'>
                        <Plus size={18} /> Thêm Voucher
                    </button>
                </div>
            </div>

            <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300 table-fixed'>
                    <thead>
                        <tr>
                            {['ID', 'Mã Giảm Giá', 'Loại', 'Giá Trị', 'Bắt Đầu', 'Kết Thúc', 'Trạng Thái', 'Hành Động'].map(header => (
                                <th key={header} className='py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider'>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-300'>
                        {vouchers.map(voucher => (
                            <motion.tr key={voucher.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                <td className='py-7 text-sm text-gray-700'>{voucher.id}</td>
                                <td className='py-7 text-sm text-gray-700'>{voucher.code}</td>
                                <td className='py-7 text-sm text-gray-700'>{voucher.discountType}</td>
                                <td className='py-7 pl-10 text-sm text-gray-700'>{voucher.discountValue}%</td>
                                <td className='py-7 text-sm text-gray-700'>{voucher.startDate}</td>
                                <td className='py-7 text-sm text-gray-700'>{voucher.endDate}</td>
                                <td className='py-7 text-sm text-gray-700'>{voucher.status}</td>
                                <td className='py-7 text-sm text-gray-700'>
                                    <button className='text-indigo-600 hover:text-indigo-500 mr-2' onClick={() => handleEditClick(voucher)}>
                                        <Edit size={18} />
                                    </button>
                                    <button className='text-red-600 hover:text-red-500' onClick={() => handleDeleteClick(voucher)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
            <AddVoucherModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onVoucherAdded={fetchVouchers} />
            <EditVoucherModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                voucher={selectedVoucher}
                onVoucherUpdated={fetchVouchers} // Make sure this is passed correctly
            />
            {isDeleteModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg w-96 text-center'>
                        <h2 className='text-lg font-semibold text-red-500'>Xác nhận xóa</h2>
                        <p className='text-gray-700 mt-2'>
                            Bạn có chắc chắn muốn xóa phiếu giảm giá có mã không? <span className='font-bold text-red-500'>{voucherToDelete?.code}</span>?
                        </p>
                        <div className='flex justify-center gap-4 mt-4'>
                            <button className='px-4 py-2 bg-gray-500 text-white rounded-lg' onClick={() => setIsDeleteModalOpen(false)}>Hủy bỏ</button>
                            <button className='px-4 py-2 bg-red-500 text-white rounded-lg' onClick={handleDeleteVoucher}>Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VouchersTable;
