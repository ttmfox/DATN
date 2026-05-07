import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const SendEmailModal = ({ isOpen, onClose, recipientEmail }) => {
    const [subject, setSubject] = useState("");
    const [htmlContent, setHtmlContent] = useState("");

    const handleSendEmail = async () => {
        if (!subject || !htmlContent) {
            toast.error("Please fill in all fields.");
            return;
        }

        try {
            await axios.post("http://localhost:8080/api/email/send", {
                to: recipientEmail,
                subject,
                htmlContent
            });

            toast.success("Email đã được gửi thành công!");
            onClose();
        } catch (err) {
            console.error("Error sending email:", err);
            toast.error("Failed to send email.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                <h2 className="text-xl font-semibold mb-4">Gửi Mail</h2>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Đến:</label>
                    <input type="text" value={recipientEmail} readOnly className="w-full border px-3 py-2 rounded-md bg-gray-100" />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Tiêu đề:</label>
                    <input 
                        type="text" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)} 
                        className="w-full border px-3 py-2 rounded-md"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Nội dung:</label>
                    <textarea 
                        value={htmlContent} 
                        onChange={(e) => setHtmlContent(e.target.value)} 
                        className="w-full border px-3 py-2 rounded-md h-28"
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <button className="bg-gray-500 text-white px-4 py-2 rounded-md" onClick={onClose}>
                        Hủy
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={handleSendEmail}>
                        Gửi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendEmailModal;
