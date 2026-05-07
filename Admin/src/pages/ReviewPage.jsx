import Header from "../components/common/Header";
import ReviewPages from "../components/review/ReviewTable";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReviewPage = () => {
	return (
		<div className='flex-1 overflow-auto relative z-10 bg-gray-100'>
			<Header title={"Quản Lí Đánh Giá"} />

			<main className='bg-gray-200 max-w-7xl mx-auto py-6 px-4 lg:px-8'>
			<ToastContainer position="top-right" autoClose={2000} />
				<ReviewPages/>
			</main>
		</div>
	);
};
export default ReviewPage;
