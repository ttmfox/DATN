import { BarChart2, DollarSign, Menu, Settings, ShoppingBag, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { MdOutlineRateReview } from "react-icons/md";
import { MdOutlineBrandingWatermark } from "react-icons/md";
import { BiCategory } from "react-icons/bi";
import logo from "../assets/2.png";
import { FaTicketAlt, FaRegNewspaper } from "react-icons/fa";
import { FaShoppingCart } from "react-icons/fa";


const SIDEBAR_ITEMS = [
	{
		name: "Tổng Quan",
		icon: BarChart2,
		color: "#6366f1",
		href: "/",
	},
	{ name: "Quản Lí Sản Phẩm", icon: ShoppingBag, color: "#8B5CF6", href: "/products" },
	{ name: "Quản Lí Người Dùng", icon: Users, color: "#EC4899", href: "/users" },
	{ name: "Quản Lí Đánh Giá", icon: MdOutlineRateReview, color: "#10B981", href: "/reviews" },
	{ name: "Quản Lí Đơn Hàng", icon: ShoppingCart, color: "#F59E0B", href: "/orders" },
	{ name: "Quản Lí Thương Hiệu", icon: MdOutlineBrandingWatermark, color: "#3B82F6", href: "/brands" },
	{ name: "Quản Lí Danh Mục", icon: BiCategory, color: "#8B5CF6", href: "/categories" },
	{ name: "Quản Lí Voucher", icon: FaTicketAlt, color: "#EC4899", href: "/vouchers" },
	{ name: "Quản Lí Bài Đăng", icon: FaRegNewspaper, color: "#6EE7B7", href: "/posts" },
	{ name: "Bán Hàng", icon: FaShoppingCart, color: "#6EE7B7", href: "/pos" }
];

const Sidebar = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const location = useLocation();

	return (
		<motion.div
			className={`relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 ${isSidebarOpen ? "w-64" : "w-20"
				}`}
			animate={{ width: isSidebarOpen ? 256 : 80 }}
		>
			<div className='h-full bg-gray-800 text-white p-4 flex flex-col border-r border-gray-800'>
				<div className="flex items-center space-x-[40px]">
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						className='p-2 rounded-full hover:bg-gray-700 transition-colors max-w-fit'
					>

						<Menu size={24} />
					</motion.button>
					<Link to="/">
						<img src={logo} className="h-12 w-auto max-w-[180px] rounded-lg transition-transform duration-300 hover:scale-110"></img>
					</Link>
				</div>

				<nav className='mt-8 flex-grow'>
					{SIDEBAR_ITEMS.map((item) => (
						<Link key={item.href} to={item.href}>
							<motion.div
								className={`flex items-center p-4 text-sm font-medium rounded-lg transition-colors mb-2 ${location.pathname === item.href ? "bg-gray-700" : "hover:bg-gray-700"
									}`}
							>
								<item.icon size={20} style={{ color: item.color, minWidth: "20px" }} />
								<AnimatePresence>
									{isSidebarOpen && (
										<motion.span
											className='ml-4 whitespace-nowrap'
											initial={{ opacity: 0, width: 0 }}
											animate={{ opacity: 1, width: "auto" }}
											exit={{ opacity: 0, width: 0 }}
											transition={{ duration: 0.2, delay: 0.3 }}
										>
											{item.name}
										</motion.span>
									)}
								</AnimatePresence>
							</motion.div>
						</Link>
					))}
				</nav>
			</div>
		</motion.div>
	);
};
export default Sidebar;
