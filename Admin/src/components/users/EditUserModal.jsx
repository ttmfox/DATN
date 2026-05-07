import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [userData, setUserData] = useState({
        id: '',
        username: '',
        password: '',
        birthday: '',
        firstname: '',
        lastname: '',
        email: '',
        address: '',
        avatar: null,
        status: 'Active',
        role: ['ROLE_USER']// Thêm giá trị mặc định
    });
    const [loading, setLoading] = useState(false);
    const [previewAvatar, setPreviewAvatar] = useState(null);

    const role = userData.role && userData.role.length > 0 ? userData.role : ["USER"];



    useEffect(() => {
        if (user) {
            setUserData({
                id: user.id || '',
                username: user.username || '',
                password: '', // Để trống, chỉ update khi nhập mới
                birthday: formatDateToYYYYMMDD(user.birthday) || '',
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                email: user.email || '',
                address: user.address || '',
                avatar: null,
                status: user.status || 'Active',
                role: user.role ? user.role.map(role => role.name) : ['ROLE_USER']
            });

            setPreviewAvatar(user.avatar ? `http://localhost:8080${user.avatar}` : null);
        }
    }, [user]);

    if (!isOpen) return null;

    // Chuyển đổi định dạng ngày từ "dd-MM-yyyy" sang "yyyy-MM-dd" để hiển thị trong input
    const formatDateToYYYYMMDD = (dateStr) => {
        if (!dateStr) return "";
        const [day, month, year] = dateStr.split("-");
        return `${year}-${month}-${day}`; // Format lại thành yyyy-MM-dd để hiển thị trên input
    };

   
    
    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setUserData({ ...userData, avatar: file });
        setPreviewAvatar(URL.createObjectURL(file));
    };

    const formatDateToDDMMYYYY = (isoDate) => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split("-");
        return `${day}-${month}-${year}`; // Chuyển thành "dd-MM-yyyy"
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // 🔥 Chuyển đổi ngày sinh sang định dạng dd-MM-yyyy
        const formattedBirthday = formatDateToDDMMYYYY(userData.birthday);
    
        // Tạo FormData để gửi thông tin người dùng
        const formData = new FormData();
        formData.append("username", userData.username);
        formData.append("firstname", userData.firstname);
        formData.append("lastname", userData.lastname);
        formData.append("password", userData.password || ""); // Nếu có mật khẩu
        formData.append("email", userData.email);
        formData.append("phone", userData.phone || "");
        formData.append("address", userData.address || "");
        formData.append("birthday", formattedBirthday);
        formData.append("status", userData.status);
        formData.append("role", userData.role && userData.role.length > 0 ? userData.role.join(",") : "");
    
        // Nếu có avatar, thêm vào FormData
        if (userData.avatar) {
            formData.append("avatar", userData.avatar);
        }
    
        const url = `http://localhost:8080/tirashop/user/update/${userData.id}`;
    
        try {
            const response = await axios.put(url, formData, {
                headers: {
                    "Content-Type": "multipart/form-data", // Đảm bảo Content-Type là multipart/form-data
                },
            });
    
            if (response.status === 200 && response.data?.data) {
                onUserUpdated(response.data.data);
                toast.success("User updated successfully!");
                onClose();
            } else {
                throw new Error(response.data.message || "Invalid response from server");
            }
        } catch (err) {
            console.error("Update Error:", err.response ? err.response.data : err.message);
            toast.error(err.response?.data?.message || "Failed to update user.");
        }
    
        setLoading(false);
    };
    


    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
                <div className='flex justify-between items-center mb-4'>
                    <h2 className='text-lg font-semibold text-gray-900'>Edit User</h2>
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>User ID</label>
                        <input
                            type='text'
                            name='id'
                            value={userData.id}
                            className='w-full px-3 py-2 border rounded-lg bg-gray-100'
                            disabled
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Username</label>
                        <input
                            type='text'
                            name='username'
                            value={userData.username}
                            onChange={handleChange}
                            className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Password (Leave blank to keep current)</label>
                        <input
                            type='password'
                            name='password'
                            onChange={handleChange}
                            className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Birthday</label>
                        <input
                            type='date'
                            name='birthday'
                            value={userData.birthday}
                            onChange={handleChange}
                            className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-1 flex gap-2'>
                        <div className='w-1/2'>
                            <label className='block text-gray-700 text-sm font-medium mb-1'>First Name</label>
                            <input
                                type='text'
                                name='firstname'
                                value={userData.firstname}
                                onChange={handleChange}
                                className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>
                        <div className='w-1/2'>
                            <label className='block text-gray-700 text-sm font-medium mb-1'>Last Name</label>
                            <input
                                type='text'
                                name='lastname'
                                value={userData.lastname}
                                onChange={handleChange}
                                className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Email</label>
                        <input
                            type='email'
                            name='email'
                            value={userData.email}
                            onChange={handleChange}
                            className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                            required
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Address</label>
                        <input
                            type='text'
                            name='address'
                            value={userData.address}
                            onChange={handleChange}
                            className='w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500'
                        />
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Avatar</label>
                        <input type='file' onChange={handleFileChange} className='w-full px-3 py-2 border rounded-lg' />
                        {previewAvatar && <img src={previewAvatar} alt='Avatar Preview' className='mt-2 w-20 h-20 rounded-lg' />}
                    </div>

                    <div className='mb-1'>
                        <label className='block text-gray-700 text-sm font-medium mb-1'>Status</label>
                        <select name='status' value={userData.status} onChange={handleChange} className='w-full px-3 py-2 border rounded-lg'>
                            <option value="Active">Active</option>
                            <option value="Deactive">Deactive</option>
                        </select>
                    </div>

                    <div className='flex justify-end gap-2 mt-4'>
                        <button type='button' onClick={onClose} className='px-4 py-2 bg-gray-500 text-white rounded-lg'>
                            Cancel
                        </button>
                        <button type='submit' disabled={loading} className='px-4 py-2 bg-blue-500 text-white rounded-lg'>
                            {loading ? 'Updating...' : 'Update User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;


