import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditVoucherModal = ({ isOpen, onClose, voucher, onVoucherUpdated }) => {
    const [voucherData, setVoucherData] = useState({
        code: '',
        discountType: 'PERCENTAGE', // Giá trị mặc định
        discountValue: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE', // Giá trị mặc định
    });
    const [loading, setLoading] = useState(false);

    const formatDateToYYYYMMDD = (isoDate) => {
        if (!isoDate) return '';
        const [day, month, year] = isoDate.split('-');  // Chuyển từ dd-MM-yyyy sang yyyy-MM-dd
        return `${year}-${month}-${day}`;
    };
    

    useEffect(() => {
        if (isOpen && voucher) {
            setVoucherData({
                code: voucher.code || '',
                discountType: voucher.discountType || 'PERCENTAGE',
                discountValue: voucher.discountValue || '',
                startDate: formatDateToYYYYMMDD(voucher.startDate), // Đảm bảo định dạng đúng
                endDate: formatDateToYYYYMMDD(voucher.endDate), // Đảm bảo định dạng đúng
                status: voucher.status || 'ACTIVE',
            });
        }
    }, [isOpen, voucher]);
    

    if (!isOpen) return null;

    const handleChange = (e) => {
        setVoucherData({ ...voucherData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        // Giữ nguyên mã voucher (nếu không thay đổi)
        const formattedVoucher = {
            ...voucherData,
            startDate: formatDateToYYYYMMDD(voucherData.startDate),
            endDate: formatDateToYYYYMMDD(voucherData.endDate),
        };
    
        try {
            const response = await axios.put(
                `http://localhost:8080/tirashop/voucher/update/${voucher.id}`,
                formattedVoucher,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
    
            // Kiểm tra mã trạng thái HTTP để xác định thành công
            if (response.status === 200 && response.data && response.data.data) {
                // Cập nhật danh sách voucher
                onVoucherUpdated();  
    
                // Hiển thị thông báo thành công sau khi cập nhật
                toast.success('Phiếu giảm giá đã được cập nhật thành công!', { autoClose: 2000 });
    
                // Đảm bảo rằng modal sẽ đóng sau khi cập nhật thành công
                onClose();
            } else {
                // Nếu mã trạng thái không phải 200, hiển thị thông báo lỗi
                throw new Error('Failed to update voucher. Please try again.');
            }
        } catch (err) {
            // Hiển thị thông báo lỗi nếu có
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update voucher. Please try again.';
            toast.error(errorMessage);
        }
    
        setLoading(false); // Tắt trạng thái loading
    };
    
    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-5 rounded-lg shadow-lg w-96'>
                <div className='flex justify-between items-center mb-2'>
                    <h2 className='text-lg font-semibold text-gray-900'>Chỉnh sửa Voucher</h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium'>Mã Số</label>
                        <input
                            type='text'
                            name='code'
                            value={voucherData.code}
                            onChange={handleChange}
                            className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-3 flex gap-2'>
                        <div className='w-1/2'>
                            <label className='block text-gray-700 text-sm font-medium'>Loại</label>
                            <select
                                name='discountType'
                                value={voucherData.discountType}
                                onChange={handleChange}
                                className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            >
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED">Fixed Amount</option>
                            </select>
                        </div>

                        <div className='w-1/2'>
                            <label className='block text-gray-700 text-sm font-medium'>Giá Trị</label>
                            <input
                                type='number'
                                name='discountValue'
                                value={voucherData.discountValue}
                                onChange={handleChange}
                                className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>
                    </div>

                    <div className='mb-3 flex gap-2'>
                        <div className='w-1/2'>
                            <label className='block text-gray-700 text-sm font-medium'>Bắt Đầu</label>
                            <input
                                type='date'
                                name='startDate'
                                value={voucherData.startDate}
                                onChange={handleChange}
                                className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>

                        <div className='w-1/2'>
                            <label className='block text-gray-700 text-sm font-medium'>Kết Thúc</label>
                            <input
                                type='date'
                                name='endDate'
                                value={voucherData.endDate}
                                onChange={handleChange}
                                className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>
                    </div>

                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Trạng Thái</label>
                        <select
                            name='status'
                            value={voucherData.status}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="USED">Used</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>

                    <div className='flex justify-end gap-2 mt-4'>
                        <button type='button' onClick={onClose} className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'>
                            Hủy bỏ
                        </button>
                        <button type='submit' disabled={loading} className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>
                            {loading ? 'Updating...' : 'Cập nhật phiếu giảm giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVoucherModal;
