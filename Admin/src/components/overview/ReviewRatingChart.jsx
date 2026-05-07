import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "react-router-dom";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];

const ReviewRatingChart = () => {
    const [ratingData, setRatingData] = useState([]);

    useEffect(() => {
        fetchReviewData();
    }, []);

    const fetchReviewData = async () => {
        try {
            const response = await axios.get("http://localhost:8080/tirashop/reviews");
            const reviews = response.data.data?.elementList || [];

            // Đếm số lượng đánh giá theo từng mức sao
            const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 -> 1 ⭐, Index 4 -> 5 ⭐

            reviews.forEach(review => {
                if (review.rating >= 1 && review.rating <= 5) {
                    ratingCounts[review.rating - 1]++;
                }
            });

            // Chuẩn hóa dữ liệu cho PieChart
            const formattedData = ratingCounts.map((count, index) => ({
                name: `${index + 1} ⭐`,
                value: count
            }));

            setRatingData(formattedData);
        } catch (error) {
            console.error("Error fetching review data:", error);
        }
    };

    return (
        <motion.div
            className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
         <Link to="/reviews">
            <h2 className='text-lg font-medium mb-4 text-gray-900'>Biểu đồ xếp hạng đánh giá</h2>
            <div className='h-80'>
                <ResponsiveContainer width={"100%"} height={"100%"}> 
                        <PieChart>                      
                            <Pie
                                data={ratingData}
                                cx={"50%"}
                                cy={"50%"}
                                labelLine={false}
                                outerRadius={90}
                                fill='#8884d8'
                                dataKey='value'
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {ratingData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                    borderColor: "#D1D5DB",
                                }}
                                itemStyle={{ color: "#111827" }}
                            />
                            <Legend />
                        </PieChart>
                   
                </ResponsiveContainer>
            </div>

            </Link>
        </motion.div>
    );
};

export default ReviewRatingChart;
