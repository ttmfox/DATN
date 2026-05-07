import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, Edit, Trash, Mail, Plus } from 'lucide-react';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ToastProvider, { showToast } from "../ToastProvider";
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import SendEmailModal from './SendEmailModal'; 

const UsersTable = () => {
	const [users, setUsers] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
	const [selectedUserEmail, setSelectedUserEmail] = useState('');
	const pageSize = 5;

	useEffect(() => {
		fetchUsers();
	}, [currentPage, searchTerm]);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	const handleEditClick = (user) => {
		setSelectedUser(user);
		setIsEditModalOpen(true);
	};

	const handleUserUpdated = (updatedUser) => {
		setUsers((prevUsers) =>
			prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
		);
		setIsEditModalOpen(false);
		setSelectedUser(null);
	};
	
	const handleOpenSendEmailModal = (email) => {
		setSelectedUserEmail(email);
		setIsSendEmailModalOpen(true);
	};

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const handleUserAdded = (newUser) => {
		setUsers((prevUsers) => [...prevUsers, newUser]);
		setIsAddModalOpen(false);
	};

	const fetchUsers = async (maintainPage = false) => {
		try {
			const response = await axios.get(`http://localhost:8080/tirashop/user/list`);
			let fetchedUsers = response.data.data || [];

			if (searchTerm) {
				fetchedUsers = fetchedUsers.filter(user =>
					user.username.toLowerCase().includes(searchTerm.toLowerCase())
				);
			}

			const totalPagesCount = Math.ceil(fetchedUsers.length / pageSize);
			setTotalPages(totalPagesCount);
			
			// Nếu không maintain page, reset về trang 0 khi search
			const pageToUse = maintainPage ? currentPage : (searchTerm ? 0 : currentPage);
			
			const paginatedUsers = fetchedUsers.slice(pageToUse * pageSize, (pageToUse + 1) * pageSize);
			setUsers(paginatedUsers);
		} catch (err) {
			console.error('Error fetching users:', err);
			toast.error("Không thể tải dữ liệu người dùng.");
		}
	};

	// NEW: Handle status change - GIỮ NGUYÊN VỊ TRÍ
	const handleStatusChange = async (userId, newStatus) => {
		try {
			const token = localStorage.getItem('token');
			await axios.patch(
				`http://localhost:8080/tirashop/user/status/${userId}?status=${newStatus}`,
				{},
				{
					headers: {
						'Authorization': `Bearer ${token}`
					}
				}
			);
			
			toast.success(`Đã cập nhật trạng thái thành ${newStatus}!`);
			// Giữ nguyên trang hiện tại
			fetchUsers(true);
		} catch (err) {
			console.error("Error updating user status:", err);
			toast.error("Không thể cập nhật trạng thái người dùng.");
		}
	};

	return (
		<div className='my-5 p-6 bg-white text-black rounded-xl shadow-lg'>
			<ToastProvider />
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-xl font-semibold text-gray-900'>Danh Sách Người Dùng</h2>
				<div className='flex items-center space-x-3'>
					<div className='relative'>
						<input
							type='text'
							placeholder='Tìm kiếm theo tên người dùng...'
							className='bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
							onChange={(e) => setSearchTerm(e.target.value)}
							value={searchTerm}
						/>
						<Search className='absolute left-3 top-2.5 text-gray-500' size={18} />
					</div>
					<button onClick={() => setIsAddModalOpen(true)} className='bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2'>
						<Plus size={18} /> Thêm Người Dùng Mới
					</button>
				</div>
			</div>
			
			<div className='overflow-x-auto w-full'>
				<table className='min-w-max w-full divide-y divide-gray-300'>
					<thead>
						<tr>
							<th className='w-20 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>ID</th>
							<th className='w-40 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Tên người dùng</th>
							<th className='w-32 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Ảnh đại diện</th>
							<th className='w-36 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Sinh nhật</th>
							<th className='w-36 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Tên</th>
							<th className='w-36 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Họ</th>
							<th className='w-36 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Email</th>
							<th className='w-48 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Địa chỉ</th>
							<th className='w-32 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Trạng thái</th>
							<th className='w-40 py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase'>Hành động</th>
						</tr>
					</thead>
					<tbody className='divide-y divide-gray-300'>
						{users.map((user) => (
							<motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.id}</td>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.username}</td>
								<td className='py-3 px-4 text-sm text-gray-700'>
									<img src={`http://localhost:8080${user.avatar}`} alt="Avatar" className='w-[65px] h-[65px] rounded-full' />
								</td>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.birthday}</td>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.firstname}</td>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.lastname}</td>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.email}</td>
								<td className='py-3 px-4 text-sm text-gray-700'>{user.address}</td>
								<td className='py-3 px-4 text-sm'>
									{/* NEW: Status Dropdown */}
									<select
										value={user.status}
										onChange={(e) => handleStatusChange(user.id, e.target.value)}
										className={`px-3 py-1 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 ${
											user.status?.toLowerCase() === 'active'
												? 'bg-green-100 text-green-700 focus:ring-green-500'
												: 'bg-red-100 text-red-700 focus:ring-red-500'
										}`}
									>
										<option value="Active">Active</option>
										<option value="Deactive">Deactive</option>
									</select>
								</td>
								<td className='pt-9 px-4 text-sm text-gray-700 flex space-x-4'>
									<button className='text-green-600 hover:text-green-500' onClick={() => handleOpenSendEmailModal(user.email)}>
										<Mail size={18} />
									</button>
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
			<AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onUserAdded={handleUserAdded} />
			<EditUserModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				user={selectedUser}
				onUserUpdated={handleUserUpdated}
			/>
			<SendEmailModal 
				isOpen={isSendEmailModalOpen} 
				onClose={() => setIsSendEmailModalOpen(false)}
				recipientEmail={selectedUserEmail}
			/>
			<ToastContainer />
		</div>
	);
};

export default UsersTable;