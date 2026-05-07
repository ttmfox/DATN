import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddVoucherModal = ({ isOpen, onClose, onVoucherAdded }) => {
    const [voucherData, setVoucherData] = useState({
        code: '',
        discountType: 'PERCENTAGE', // Giá trị mặc định
        discountValue: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE', // Giá trị mặc định
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setVoucherData({ ...voucherData, [e.target.name]: e.target.value });
    };

    const formatDateToDDMMYYYY = (isoDate) => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        return `${day}-${month}-${year}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        const formattedVoucher = {
            ...voucherData,
            startDate: formatDateToDDMMYYYY(voucherData.startDate),
            endDate: formatDateToDDMMYYYY(voucherData.endDate),
        };
    
        try {
            const response = await axios.post('http://localhost:8080/tirashop/voucher/add', formattedVoucher, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.data && response.data.data) {
                // Gọi lại danh sách voucher sau khi thêm thành công
                onVoucherAdded();
    
                // Reset form trước khi đóng modal
                setVoucherData({
                    code: '',
                    discountType: 'PERCENTAGE',
                    discountValue: '',
                    startDate: '',
                    endDate: '',
                    status: 'ACTIVE',
                });
    
                // Đóng modal
                onClose();
    
                // Hiển thị thông báo thành công
                setTimeout(() => {
                    toast.success('Phiếu giảm giá đã được thêm thành công!', { autoClose: 2000 });
                }, 300);
    
            } else {
                throw new Error(response.data.message || 'Invalid response from server');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to add voucher. Please try again.';
            toast.error(errorMessage);
            console.error('Error:', err);
        }
    
        setLoading(false);
    };
    
    

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-5 rounded-lg shadow-lg w-96'>
                <div className='flex justify-between items-center mb-2'>
                    <h2 className='text-lg font-semibold text-gray-900'>Thêm Voucher</h2>
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
                            <label className='block text-gray-700 text-sm font-medium'>Giá trị</label>
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
                            <option value="EXPIRE">Expired</option>
                        </select>
                    </div>

                    <div className='flex justify-end gap-2 mt-4'>
                        <button type='button' onClick={onClose} className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'>
                            Cancel
                        </button>
                        <button type='submit' disabled={loading} className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>
                            {loading ? 'Adding...' : 'Add Voucher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVoucherModal;
