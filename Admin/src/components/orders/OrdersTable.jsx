
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import OrderDetailModal from './OrderDetailModal';
import Pagination from '../common/Pagination';

const STATUS_OPTIONS = ['PENDING', 'COMPLETED', 'CANCELLED'];

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);


  const token = localStorage.getItem('token');
  console.log(JSON.parse(atob(token.split('.')[1])));

  const isAdmin = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));

      const scope = payload.scope || '';
      return scope.toUpperCase().includes('ROLE_ADMIN');
    } catch { return false; }
  })();

  const pageSize = 5;
  const getToken = () => localStorage.getItem('token');

  useEffect(() => { fetchOrders(); }, [currentPage]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:8080/tirashop/orders', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const fetched = response.data?.data?.elementList || [];
      setTotalPages(Math.ceil(fetched.length / pageSize));
      const paginated = fetched
        .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        .map(o => ({ ...o, id: o.orderId }));
      setOrders(paginated);
    } catch (err) {
      console.error('❌ Lỗi khi fetchOrders:', err);
      toast.error('Không thể tải danh sách đơn hàng.');
    }
  };

  const handleShipmentStatusUpdated = () => fetchOrders();

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;

    if (newStatus === 'CANCELLED') {
      const ok = window.confirm('Huỷ đơn hàng này? Tồn kho sẽ được hoàn lại tự động.');
      if (!ok) return;
    }

    // Optimistic update
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o)
    );
    setUpdatingId(orderId);

    try {
      await axios.put(
        `http://localhost:8080/tirashop/orders/${orderId}/admin-status?status=${newStatus}`,
        null,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(`Cập nhật trạng thái → ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Cập nhật thất bại, đang rollback...');
      // Rollback
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, orderStatus: currentStatus } : o)
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="m-5 p-6 bg-white text-black rounded-xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh Sách Đơn Hàng</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Khách hàng</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Kích thước</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Số lượng</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Giá</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phương thức thanh toán</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ngày và giờ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hình ảnh</th>
              <th className="pl-12 pr-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Trạng thái</th>
              <th className="px-1 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {orders.map((item, idx) => {
              const isUpdating = updatingId === item.id;
              return (
                <tr key={idx} style={{ opacity: isUpdating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <td className="px-4 py-4 min-w-[150px]">{item.username}</td>
                  <td className="px-4 py-4 min-w-[200px]">{item.productName}</td>
                  <td className="px-4 py-4 min-w-[60px]">{item.size}</td>
                  <td className="px-4 py-4 min-w-[80px]">{item.quantity}</td>
                  <td className="px-4 py-4 min-w-[120px]">{item.price?.toLocaleString()} VND</td>
                  <td className="px-4 py-4 min-w-[120px]">{item.paymentMethod}</td>
                  <td className="px-4 py-4 min-w-[180px]">{item.createdAt}</td>
                  <td className="px-4 py-4 min-w-[80px]">
                    <img
                      src={`http://localhost:8080${item.productImage}`}
                      alt={item.productName}
                      className="w-20 h-auto object-cover rounded"
                    />
                  </td>

                  {/* ✅ Cột trạng thái: admin → select gọi admin-status, user → badge */}
                  <td className="px-4 py-4 min-w-[160px]">
                    {isAdmin ? (
                      <select
                        disabled={isUpdating}
                        className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-50"
                        value={item.orderStatus}
                        onChange={(e) => handleStatusChange(item.id, e.target.value, item.orderStatus)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`w-[120px] inline-block text-center px-3 py-1 rounded-full text-white text-xs font-semibold
                          ${item.orderStatus === 'COMPLETED' ? 'bg-green-500' : ''}
                          ${item.orderStatus === 'PENDING' ? 'bg-yellow-500' : ''}
                          ${item.orderStatus === 'CANCELLED' ? 'bg-red-500' : ''}
                        `}
                      >
                        {item.orderStatus}
                      </span>
                    )}
                  </td>

                  {/* Cột hành động — giữ nguyên logic cũ */}
                  <td className="px-4 py-4 min-w-[80px]">
                    {item.orderStatus === 'COMPLETED' ? (
                      <div className="flex gap-2 items-center">
                        <button
                          className="text-indigo-600 hover:text-indigo-500"
                          onClick={() => handleViewDetail(item)}
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    ) : (
                      <Eye size={18} className="text-gray-400 cursor-not-allowed" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      <OrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        orderId={selectedOrder?.id}
        onShipmentUpdated={handleShipmentStatusUpdated}
      />
    </div>
  );
};

export default OrdersTable;