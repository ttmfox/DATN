// import { useState, useEffect } from "react";
// import axios from "axios";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// import { motion } from "framer-motion";

// const ReviewTrendChart = () => {
//     const [reviewData, setReviewData] = useState([]);

//     useEffect(() => {
//         fetchReviewData();
//     }, []);

//     const fetchReviewData = async () => {
//         try {
//             const response = await axios.get("http://localhost:8080/tirashop/reviews");
//             const reviews = response.data.data?.elementList || [];

//             // Nhóm số lượng đánh giá theo ngày
//             const reviewCounts = {};
//             reviews.forEach(review => {
//                 const date = review.created_at; // Lấy ngày tạo đánh giá
//                 reviewCounts[date] = (reviewCounts[date] || 0) + 1;
//             });

//             // Chuyển đổi dữ liệu sang dạng phù hợp cho LineChart
//             const formattedData = Object.keys(reviewCounts).map(date => ({
//                 name: date,
//                 reviews: reviewCounts[date],
//             }));

//             // Sắp xếp theo ngày tăng dần
//             formattedData.sort((a, b) => new Date(a.name) - new Date(b.name));

//             setReviewData(formattedData);
//         } catch (error) {
//             console.error("Error fetching review data:", error);
//         }
//     };

//     return (
//         <motion.div
//             className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//         >
//             <h2 className='text-lg font-medium mb-4 text-gray-900'>Review Trends Over Time</h2>

//             <div className='h-80'>
//                 <ResponsiveContainer width={"100%"} height={"100%"}>
//                     <LineChart data={reviewData}>
//                         <CartesianGrid strokeDasharray='3 3' stroke='#D1D5DB' />
//                         <XAxis dataKey={"name"} stroke='#374151' />
//                         <YAxis stroke='#374151' />
//                         <Tooltip
//                             contentStyle={{
//                                 backgroundColor: "rgba(255, 255, 255, 0.9)",
//                                 borderColor: "#D1D5DB",
//                             }}
//                             itemStyle={{ color: "#111827" }}
//                         />
//                         <Line
//                             type='monotone'
//                             dataKey='reviews'
//                             stroke='#EC4899'
//                             strokeWidth={3}
//                             dot={{ fill: "#EC4899", strokeWidth: 2, r: 6 }}
//                             activeDot={{ r: 8, strokeWidth: 2 }}
//                         />
//                     </LineChart>
//                 </ResponsiveContainer>
//             </div>
//         </motion.div>
//     );
// };

// export default ReviewTrendChart;


import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const ReviewTrendChart = () => {
    // Dữ liệu mẫu hard-code
    const reviewData = [
        { name: "2025-03-01", reviews: 2 },
        { name: "2025-03-02", reviews: 5 },
        { name: "2025-03-03", reviews: 3 },
        { name: "2025-03-04", reviews: 8 },
        { name: "2025-03-05", reviews: 6 },
        { name: "2025-03-06", reviews: 10 },
        { name: "2025-03-07", reviews: 4 },
    ];

    return (
        <motion.div
            className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <h2 className='text-lg font-medium mb-4 text-gray-900'>Xem lại xu hướng theo thời gian</h2>

            <div className='h-80'>
                <ResponsiveContainer width={"100%"} height={"100%"}>
                    <LineChart data={reviewData}>
                        <CartesianGrid strokeDasharray='3 3' stroke='#D1D5DB' />
                        <XAxis dataKey={"name"} stroke='#374151' />
                        <YAxis stroke='#374151' />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                borderColor: "#D1D5DB",
                            }}
                            itemStyle={{ color: "#111827" }}
                        />
                        <Line
                            type='monotone'
                            dataKey='reviews'
                            stroke='#EC4899'
                            strokeWidth={3}
                            dot={{ fill: "#EC4899", strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default ReviewTrendChart;
