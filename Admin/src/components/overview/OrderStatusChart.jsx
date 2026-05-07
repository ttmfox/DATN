import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
    PENDING: "#F59E0B",
    SHIPPED: "#6366F1",
    DELIVERED: "#10B981",
    CANCELLED: "#EF4444",
    RETURNED: "#EC4899"
};

const OrderStatusChart = () => {
    const [statusData, setStatusData] = useState([]);

    useEffect(() => {
        fetchOrderData();
    }, []);

    const fetchOrderData = async () => {
        try {
            const response = await axios.get("http://localhost:8080/tirashop/orders");
            const orders = response.data.data?.elementList || [];

            const statusCounts = {};

            orders.forEach(order => {
                const status = order.status || "UNKNOWN";
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            const formattedData = Object.entries(statusCounts).map(([status, count]) => ({
                name: status,
                value: count
            }));

            setStatusData(formattedData);
        } catch (error) {
            console.error("Error fetching order data:", error);
        }
    };

    return (
        <motion.div
            className='bg-white shadow-lg rounded-xl p-6 border border-gray-300'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Link to="/orders">
                <h2 className='text-lg font-medium mb-4 text-gray-900'>Order Status Chart</h2>
                <div className='h-80'>
                    <ResponsiveContainer width={"100%"} height={"100%"}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx={"50%"}
                                cy={"50%"}
                                labelLine={false}
                                outerRadius={90}
                                fill='#8884d8'
                                dataKey='value'
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={STATUS_COLORS[entry.name] || "#A1A1AA"}
                                    />
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

export default OrderStatusChart;
