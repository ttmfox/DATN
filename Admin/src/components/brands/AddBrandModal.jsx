import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddBrandModal = ({ isOpen, onClose, onBrandAdded }) => {
    const [brandData, setBrandData] = useState({ name: '', description: '', logo: null });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setBrandData({ ...brandData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setBrandData({ ...brandData, logo: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        const formData = new FormData();
        formData.append('name', brandData.name);
        formData.append('description', brandData.description);
        if (brandData.logo) {
            formData.append('logo', brandData.logo);
        }
    
        try {
            const response = await axios.post('http://localhost:8080/tirashop/brand/add', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (response.data && response.data.data) {
                const newBrand = response.data.data;
                onBrandAdded(newBrand);
    
                // Reset dữ liệu form
                setBrandData({ name: '', description: '', logo: null });
    
                // Đóng modal
                onClose();
    
                // Hiển thị thông báo
                toast.success('Thêm mới thành công!', { autoClose: 2000 });
            } else {
                throw new Error(response.data.message || 'Invalid response from server');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to add brand. Please try again.';
            toast.error(errorMessage);
            console.error('Error:', err);
        }
    
        setLoading(false);
    };
    

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-lg font-semibold text-gray-900'>Thêm thương hiệu mới</h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Tên thương hiệu</label>
                        <input
                            type='text'
                            name='name'
                            value={brandData.name}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Miêu tả</label>
                        <textarea
                            name='description'
                            value={brandData.description}
                            onChange={handleChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    <div className='mb-3'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Logo</label>
                        <input
                            type='file'
                            name='logo'
                            onChange={handleFileChange}
                            className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            accept='image/*'
                        />
                        {brandData.logo && (
                            <img
                                src={URL.createObjectURL(brandData.logo)}
                                alt='Brand Preview'
                                className='mt-2 w-20 h-20 object-cover rounded-lg'
                            />
                        )}
                    </div>

                    <div className='flex justify-end gap-2 mt-4'>
                        <button type='button' onClick={onClose} className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600'>
                            Hủy
                        </button>
                        <button type='submit' disabled={loading} className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600'>
                            {loading ? 'Adding...' : 'Thêm Mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBrandModal;