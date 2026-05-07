import { useState } from "react";
import SettingSection from "./SettingSection";
import { HelpCircle, Plus } from "lucide-react";

const ConnectedAccounts = () => {
	const [connectedAccounts, setConnectedAccounts] = useState([
		{
			id: 1,
			name: "Google",
			connected: true,
			icon: "/google.png",
		},
		{
			id: 2,
			name: "Facebook",
			connected: false,
			icon: "/facebook.svg",
		},
		{
			id: 3,
			name: "Twitter",
			connected: true,
			icon: "/x.png",
		},
	]);
	return (
		<SettingSection icon={HelpCircle} title={"Tài khoản liên kết"}>
			{connectedAccounts.map((account) => (
				<div key={account.id} className='flex items-center justify-between py-3'>
					<div className='flex gap-1'>
						<img src={account.icon} alt='Hình ảnh mạng xã hội' className='size-6 object-cover rounded-full mr-2' />
						<span className='text-gray-900'>{account.name}</span>
					</div>
					<button
						className={`px-3 py-1 rounded ${
							account.connected ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"
						} transition duration-200`}
						onClick={() => {
							setConnectedAccounts(
								connectedAccounts.map((acc) => {
									if (acc.id === account.id) {
										return {
											...acc,
											connected: !acc.connected,
										};
									}
									return acc;
								})
							);
						}}
					>
						{account.connected ? "Đã liên kết" : "Liên kết"}
					</button>
				</div>
			))}
			<button className='mt-4 flex items-center text-indigo-600 hover:text-indigo-500 transition duration-200'>
				<Plus size={18} className='mr-2' /> Thêm tài khoản
			</button>
		</SettingSection>
	);
};

export default ConnectedAccounts;