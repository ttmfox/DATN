import Header from "../components/common/Header";
import ConnectedAccounts from "../components/settings/ConnectedAccounts";
import Logout from "../components/settings/Logout";
import Notifications from "../components/settings/Notifications";
import Profile from "../components/settings/Profile";
import Security from "../components/settings/Security";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SettingsPage = () => {
	return (
		<div className='flex-1 overflow-auto relative z-10 bg-gray-100'>
			<Header title='Cài Đặt' />
			<main className='max-w-4xl mx-auto py-6 px-4 lg:px-8'>
				<Profile />
				<Notifications />
				<Security />
				<ConnectedAccounts />
				<Logout/>		
				<ToastContainer position="top-right" autoClose={2000} />	
			</main>
		</div>
	);
};
export default SettingsPage;
