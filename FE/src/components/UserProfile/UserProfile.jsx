import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import Footer from "../Footer/Footer";

function UserProfile() {
 const [userProfile, setUserProfile] = useState(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isEditing, setIsEditing] = useState(false);
 const [avatarFile, setAvatarFile] = useState(null);
 const [avatarPreview, setAvatarPreview] = useState(null);
 const fileInputRef = useRef(null);
 const [formData, setFormData] = useState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  gender: "",
  birthday: "",
 });
 const navigate = useNavigate();

 useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
   toast.error("Vui lòng đăng nhập để xem hồ sơ của bạn", {
    position: "top-right",
    autoClose: 3000,
   });
   navigate("/auth");
   return;
  }

  fetchUserProfile(token);
 }, [navigate]);

 const fetchUserProfile = async (token) => {
  try {
   setIsLoading(true);
   const response = await fetch(
    "http://localhost:8080/tirashop/user/my-profile",
    {
     headers: {
      Authorization: `Bearer ${token}`,
     },
    }
   );

   if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/auth");
    return;
   }

   const data = await response.json();
   console.log("API Response:", data);
   if (data.status === "success" && data.data) {
    setUserProfile(data.data);
    console.log("Set userProfile:", data.data);

    let formattedBirthday = data.data.birthday;
    if (
     data.data.birthday &&
     /^\d{2}-\d{2}-\d{4}$/.test(data.data.birthday)
    ) {
     const [day, month, year] = data.data.birthday.split("-");
     formattedBirthday = `${year}-${month}-${day}`;
    }

    setFormData({
     firstName: data.data.firstName || "",
     lastName: data.data.lastName || "",
     email: data.data.email || "",
     phone: data.data.phone || "",
     address: data.data.address || "",
     gender: data.data.gender || "",
     birthday: formattedBirthday || "",
    });
    console.log("Set formData:", {
     firstName: data.data.firstName || "",
     lastName: data.data.lastName || "",
     email: data.data.email || "",
     phone: data.data.phone || "",
     address: data.data.address || "",
     gender: data.data.gender || "",
     birthday: formattedBirthday || "",
    });
   } else {
    toast.error("Không thể tải dữ liệu hồ sơ", {
     position: "top-right",
     autoClose: 3000,
    });
   }
  } catch (error) {
   console.error("Lỗi khi tải hồ sơ:", error);
   toast.error("Lỗi kết nối với máy chủ", {
    position: "top-right",
    autoClose: 3000,
   });
  } finally {
   setIsLoading(false);
  }
 };

 const handleChange = (e) => {
  setFormData({
   ...formData,
   [e.target.name]: e.target.value,
  });
 };

 const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
   setAvatarFile(file);
   const reader = new FileReader();
   reader.onloadend = () => {
    setAvatarPreview(reader.result);
   };
   reader.readAsDataURL(file);
  }
 };

 const handleAvatarClick = () => {
  fileInputRef.current.click();
 };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
   const token = localStorage.getItem("token");
   if (!token) {
    toast.error("Vui lòng đăng nhập để cập nhật hồ sơ của bạn", {
     position: "top-right",
     autoClose: 3000,
    });
    navigate("/auth");
    return;
   }

   const formDataToSend = new FormData();
   const formattedData = { ...formData };

   if (formData.birthday) {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(formData.birthday)) {
     const dateObj = new Date(formData.birthday);
     if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      formattedData.birthday = `${day}-${month}-${year}`;
     }
    }
   }

   const fieldsToSend = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "gender",
    "birthday",
   ];
   fieldsToSend.forEach((key) => {
    if (formattedData[key] !== undefined && formattedData[key] !== "") {
     formDataToSend.append(key, formattedData[key]);
    }
   });

   if (avatarFile) {
    formDataToSend.append("avatar", avatarFile);
   }

   const response = await fetch(
    "http://localhost:8080/tirashop/user/update-profile",
    {
     method: "PUT",
     headers: {
      Authorization: `Bearer ${token}`,
     },
     body: formDataToSend,
    }
   );

   const data = await response.json();

   if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/auth");
    return;
   }

   if (response.ok) {
    setUserProfile((prev) => ({
     ...prev,
     firstName: formData.firstName,
     lastName: formData.lastName,
     email: formData.email,
     phone: formData.phone,
     address: formData.address,
     gender: formData.gender,
     birthday: formData.birthday,
    }));

    await fetchUserProfile(token);

    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    toast.success("Cập nhật hồ sơ thành công",{
     position: "top-right",
     autoClose: 3000,
    });
   } else {
    toast.error(
     `Không thể cập nhật hồ sơ: ${data.message || "Lỗi không xác định"}`,
     {
      position: "top-right",
      autoClose: 3000,
     }
    );
   }
  } catch (error) {
   console.error("Lỗi khi cập nhật hồ sơ:", error);
   toast.error("Lỗi kết nối với máy chủ", {
    position: "top-right",
    autoClose: 3000,
   });
  }
 };

 const formatDate = (dateString) => {
  if (!dateString) return "";

  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
   return dateString;
  }

  try {
   const date = new Date(dateString);
   if (isNaN(date.getTime())) return dateString;

   const day = String(date.getDate()).padStart(2, "0");
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const year = date.getFullYear();
   return `${day}-${month}-${year}`;
  } catch (e) {
   return dateString;
  }
 };

 const handleAvatarError = () => {
  console.error("Không thể tải ảnh đại diện:", `http://localhost:8080${userProfile?.avatar}`);
 };

 if (isLoading) {
  return (
   <div className={styles.profileContainer}>
    <div className={styles.loadingSpinner}>Đang tải hồ sơ...</div>
   </div>
  );
 }

 return (
  <>
   <div className={styles.profileContainer}>
    <div className={styles.profileCard}>
     <h1 className={styles.profileTitle}>Hồ sơ của tôi</h1>

     {!isEditing ? (
      <div className={styles.profileInfo}>
       <div className={styles.profileAvatar}>
        {userProfile?.avatar ? (
         <img
          src={`http://localhost:8080${userProfile.avatar}`}
          alt="Ảnh đại diện"
          className={styles.avatarImage}
          onError={handleAvatarError}
         />
        ) : (
         <div className={styles.avatarPlaceholder}>
          {userProfile?.firstName?.charAt(0) ||
           userProfile?.username?.charAt(0) ||
           "U"}
         </div>
        )}
       </div>

       <div className={styles.profileDetails}>
        <h2 className={styles.username}>
         {userProfile?.firstName} {userProfile?.lastName}
        </h2>

        <div className={styles.infoRow}>
         <div className={styles.infoLabel}>Username:</div>
         <div className={styles.infoValue}>
          {userProfile?.username || "Chưa cung cấp"}
         </div>
        </div>

        <div className={styles.infoRow}>
         <div className={styles.infoLabel}>Email:</div>
         <div className={styles.infoValue}>
          {userProfile?.email || "Chưa cung cấp"}
         </div>
        </div>

        <div className={styles.infoRow}>
         <div className={styles.infoLabel}>Số điện thoại:</div>
         <div className={styles.infoValue}>
          {userProfile?.phone || "Chưa cung cấp"}
         </div>
        </div>

        <div className={styles.infoRow}>
         <div className={styles.infoLabel}>Địa chỉ:</div>
         <div className={styles.infoValue}>
          {userProfile?.address || "Chưa cung cấp"}
         </div>
        </div>

        <div className={styles.infoRow}>
        <div className={styles.infoRow}>
      <div className={styles.infoLabel}>Giới tính:</div>
        <div className={styles.infoValue}>
    {userProfile?.gender || "Chưa cung cấp"}
  </div>
</div>

        </div>

        <div className={styles.infoRow}>
         <div className={styles.infoLabel}>Ngày sinh:</div>
         <div className={styles.infoValue}>
          {formatDate(userProfile?.birthday) || "Chưa cung cấp"}
         </div>
        </div>

        <button
         className={styles.editButton}
         onClick={() => setIsEditing(true)}
        >
         Chỉnh sửa hồ sơ
        </button>
       </div>
      </div>
     ) : (
      <form className={styles.editForm} onSubmit={handleSubmit}>
       <div className={styles.avatarEditSection}>
        <div
         className={styles.avatarContainer}
         onClick={handleAvatarClick}
        >
         {avatarPreview ? (
          <img
           src={avatarPreview}
           alt="Xem trước ảnh đại diện"
           className={styles.avatarImage}
          />
         ) : userProfile?.avatar ? (
          <img
           src={`http://localhost:8080${userProfile.avatar}`}
           alt="Ảnh đại diện"
           className={styles.avatarImage}
           onError={handleAvatarError}
          />
         ) : (
          <div className={styles.avatarPlaceholder}>
           {userProfile?.firstName?.charAt(0) ||
            userProfile?.username?.charAt(0) ||
            "U"}
          </div>
         )}
         <div className={styles.avatarOverlay}>
          <span>Thay đổi ảnh</span>
         </div>
        </div>
        <input
         type="file"
         ref={fileInputRef}
         style={{ display: "none" }}
         onChange={handleAvatarChange}
         accept="image/*"
        />
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="firstName">Tên</label>
        <input
         type="text"
         id="firstName"
         name="firstName"
         value={formData.firstName}
         onChange={handleChange}
         required
        />
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="lastName">Họ</label>
        <input
         type="text"
         id="lastName"
         name="lastName"
         value={formData.lastName}
         onChange={handleChange}
         required
        />
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="email">Email</label>
        <input
         type="email"
         id="email"
         name="email"
         value={formData.email}
         onChange={handleChange}
         required
        />
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="phone">Số điện thoại</label>
        <input
         type="text"
         id="phone"
         name="phone"
         value={formData.phone}
         onChange={handleChange}
         required
        />
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="address">Địa chỉ</label>
        <input
         type="text"
         id="address"
         name="address"
         value={formData.address}
         onChange={handleChange}
        />
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="gender">Giới tính</label>
        <select
         id="gender"
         name="gender"
         value={formData.gender}
         onChange={handleChange}
        >
         <option value="">Chọn giới tính</option>
         <option value="Nam">Nam</option>
         <option value="Nữ">Nữ</option>
        </select>
       </div>

       <div className={styles.formGroup}>
        <label htmlFor="birthday">Ngày sinh</label>
        <input
         type="date"
         id="birthday"
         name="birthday"
         value={formData.birthday}
         onChange={handleChange}
        />
       </div>

       <div className={styles.formButtons}>
        <button type="submit" className={styles.saveButton}>
         Lưu thay đổi
        </button>
        <button
         type="button"
         className={styles.cancelButton}
         onClick={() => {
          setIsEditing(false);
          setAvatarPreview(null);
          setAvatarFile(null);
         }}
        >
         Hủy
        </button>
       </div>
      </form>
     )}
    </div>
   </div>
   <Footer />
  </>
 );
}

export default UserProfile;