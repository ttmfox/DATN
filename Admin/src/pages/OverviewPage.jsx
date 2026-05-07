import { ShoppingBag, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import BasicInforChart from "../components/overview/BasicInforChart";
import { useState, useEffect } from "react";
import axios from "axios";
import ReviewRatingChart from "../components/overview/ReviewRatingChart";
import { MdOutlineBrandingWatermark } from "react-icons/md";
import { BiCategory } from "react-icons/bi";
import ReviewTrendChart from "../components/overview/ReviewTrendChart";
import FinancialChart from "../components/overview/FinancialChart";

const OverviewPage = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalBrands, setTotalBrands] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await axios.get("http://localhost:8080/tirashop/user/list");
      const productRes = await axios.get("http://localhost:8080/tirashop/product");
      const brandRes = await axios.get("http://localhost:8080/tirashop/brand");
      const categoryRes = await axios.get("http://localhost:8080/tirashop/category");

      setTotalUsers(userRes.data.data.length);
      setTotalProducts(productRes.data.data.elementList.length);
      setTotalBrands(brandRes.data.data.elementList.length);
      setTotalCategories(categoryRes.data.data.elementList.length);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  return (
    <div className='flex-1 overflow-auto relative z-10'>
      <Header title='Tổng Quan' />

      <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>
        {/* STATS */}
        <motion.div
          className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Link to="/users">
            <StatCard name='Tổng Số Người Dùng' icon={Users} value={totalUsers} color='#6366F1' />
          </Link>
          <Link to="/products">
            <StatCard name='Số Lượng Sản Phẩm' icon={ShoppingBag} value={totalProducts} color='#8B5CF6' />
          </Link>
          <Link to="/brands">
            <StatCard name='Số Lượng Thương Hiệu' icon={MdOutlineBrandingWatermark} value={totalBrands} color='#EC4899' />
          </Link>
          <Link to="/categories">
            <StatCard name='Số Lượng Danh Mục' icon={BiCategory} value={totalCategories} color='#10B981' />
          </Link>
        </motion.div>

        {/* DATE FILTERS */}
        <div className='mb-4 flex gap-4'>
          <select
            className='p-2 border rounded text-black'
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>
          <select
            className='p-2 border rounded text-black'
            value={selectedMonth || ''}
            onChange={(e) => handleMonthChange(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value=''>Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* CHARTS */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
		<FinancialChart
            title='Doanh Thu'
            endpoint='revenue'
            year={selectedYear}
            month={selectedMonth}
            color='#10B981'
          />
          <FinancialChart
            title='Lợi Nhuận'
            endpoint='profit'
            year={selectedYear}
            month={selectedMonth}
            color='#3B82F6'
          />
          <FinancialChart
            title='Chi Phí'
            endpoint='cost'
            year={selectedYear}
            month={selectedMonth}
            color='#EF4444'
          />
         
          <ReviewRatingChart />
          <BasicInforChart />
         
        </div>
      </main>
    </div>
  );
};

export default OverviewPage;