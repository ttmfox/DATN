import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const shipmentStatusOptions = ['PENDING', 'SHIPPED', 'DELIVERED', 'FAILED'];


const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("orderId received in modal:", orderId); // thêm dòng này

  useEffect(() => {
    if (isOpen && orderId) {
      fetchShipment(orderId);
    }
  }, [isOpen, orderId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    const token = localStorage.getItem("token"); // Nếu API yêu cầu xác thực

    if (!shipment?.shipmentId) {
      toast.error("Shipment ID not found.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:8080/tirashop/orders/shipments/${shipment.shipmentId}/status`,
        {}, // PUT không có body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            status: newStatus,
          },
        }
      );

      toast.success("Status updated successfully!");
      setShipment({ ...shipment, status: newStatus });
      if (typeof onShipmentUpdated === 'function') onShipmentUpdated(); // 👈 thêm dòng này
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Cannot update status");
    }
  };

  const fetchShipment = async (orderId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8080/tirashop/orders/${orderId}/shipments`);
      console.log("Shipment fetched:", res.data.data[0]); // 👈
      setShipment(res.data.data[0]); // giả sử có nhiều shipment
      if (typeof onShipmentUpdated === 'function') onShipmentUpdated(); // 👈 thêm dòng này
    } catch (err) {
      toast.error('Failed to load shipping information');
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-2xl w-[90%] max-w-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
              Chi tiết đơn hàng
            </h2>

            {loading ? (
              <p className="text-center text-gray-500">Đang tải...</p>
            ) : shipment ? (
              <div className="space-y-3 text-gray-700">
                <p><strong>Mã số theo dõi:</strong> {shipment.trackingNumber}</p>
                <p><strong>Phương thức vận chuyển:</strong> {shipment.shippingMethod}</p>
                <p><strong>Thời gian tạo:</strong> {shipment.createdAt}</p>
                <div className="mt-4">
                  <label className="block mb-1 font-medium">Trạng thái vận chuyển:</label>
                  <select
                    className="w-full border px-3 py-2 rounded"
                    value={shipment.status}
                    onChange={handleStatusChange}
                  >
                    {['PENDING', 'SHIPPED', 'DELIVERED', 'FAILED'].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

              </div>
            ) : (
              <p className="text-center text-red-500">No shipment information available for this order.</p>
            )}

            <div className="mt-8 text-right">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-colors font-medium text-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailModal;
