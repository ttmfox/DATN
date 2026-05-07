import Header from "../components/common/Header";
import OrdersTable from "../components/orders/OrdersTable";
import { ToastContainer } from "react-toastify";

const OrdersPage = () => {
	return (
		<div className='flex-1 relative z-10 overflow-auto'>
			<Header title={"Quản Lí Đơn Hàng"} />

			<main className='bg-gray-200 max-w-7xl mx-auto py-6 px-4 lg:px-8'>
				<OrdersTable />
				<ToastContainer position="top-right" autoClose={2000} />
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
				</div>				
			</main>
		</div>
	);
};
export default OrdersPage;
