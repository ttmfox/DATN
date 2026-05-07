import React, { useState } from 'react';
import axios from 'axios';
import { showToast } from '../ToastProvider';

const AddImagesModal = ({ isOpen, onClose, productId }) => {
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const totalFiles = files.length + selectedFiles.length;

        if (totalFiles > 4) {
            showToast("You can only upload up to 4 images.", "warning");
            return;
        }

        setFiles(prev => [...prev, ...selectedFiles]);
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const handleUpload = async () => {
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                await axios.post(`http://localhost:8080/tirashop/product/${productId}/images/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
            } catch (err) {
                console.error("Upload failed:", err);
                showToast("Failed to upload one or more images.", "error");
                return;
            }
        }

        showToast("Hình ảnh đã được tải lên thành công!", "success");
        setFiles([]);
        setPreviews([]);
        onClose();
    };

    const handleRemoveImage = (index) => {
        const updatedFiles = [...files];
        const updatedPreviews = [...previews];
        updatedFiles.splice(index, 1);
        updatedPreviews.splice(index, 1);
        setFiles(updatedFiles);
        setPreviews(updatedPreviews);
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
            <div className='bg-white p-6 rounded-xl shadow-lg w-[450px]'>
                <h2 className='text-lg font-semibold mb-4'>Tải lên tối đa 4 hình ảnh sản phẩm</h2>

                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className='mb-4'
                    disabled={files.length >= 4}
                />

                {previews.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={preview}
                                    alt={`Preview ${index}`}
                                    className="w-full h-32 object-cover rounded-lg border"
                                />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-red-600 text-white px-2 rounded-full text-xs hidden group-hover:block"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className='flex justify-end gap-4'>
                    <button
                        onClick={() => {
                            setFiles([]);
                            setPreviews([]);
                            onClose();
                        }}
                        className='px-4 py-2 bg-gray-500 text-white rounded-lg'
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleUpload}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg'
                        disabled={files.length === 0}
                    >
                        Tải lên
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddImagesModal;
