import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "lucide-react";
import SettingSection from "./SettingSection";
import EditProfileModal from "./EditProfileModal";

const Profile = () => {
	const [profile, setProfile] = useState(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await axios.get("http://localhost:8080/tirashop/user/my-profile", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				setProfile(res.data.data);
			} catch (err) {
				console.error("Lỗi khi lấy thông tin hồ sơ:", err);
			}
		};

		fetchProfile();
	}, []);

	const handleProfileUpdate = (updatedData) => {
		setProfile(updatedData); // Cập nhật lại giao diện với dữ liệu mới
	};

	return (
		<SettingSection icon={User} title={"Hồ sơ"}>
			{profile ? (
				<>
					<div className='flex flex-col sm:flex-row items-center mb-6'>
						<img
							src={`http://localhost:8080${profile.avatar}`}
							alt='Hồ sơ'
							className='rounded-full w-20 h-20 object-cover mr-4'
						/>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								{profile.firstname} {profile.lastname}
							</h3>
							<p className='text-gray-600'><strong>Email: </strong>{profile.email}</p>
							<p className='text-gray-600'><strong>Số điện thoại: </strong>{profile.phone}</p>
							<p className='text-gray-700'><strong>Giới tính: </strong> {profile.gender}</p>
						</div>
					</div>

					<p className='text-gray-700 mb-2'><strong>Địa chỉ:</strong> {profile.address}</p>
					<p className='text-gray-700 mb-4'><strong>Ngày sinh:</strong> {profile.birthday}</p>
					
					<button
						className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto'
						onClick={() => setIsEditModalOpen(true)}
					>
						Chỉnh sửa hồ sơ
					</button>

					<EditProfileModal
						isOpen={isEditModalOpen}
						onClose={() => setIsEditModalOpen(false)}
						profile={profile}
						onProfileUpdated={handleProfileUpdate}
					/>
				</>
			) : (
				<p className="text-gray-500">Đang tải hồ sơ...</p>
			)}
		</SettingSection>
	);
};

export default Profile;