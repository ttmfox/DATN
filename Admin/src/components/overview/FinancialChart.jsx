import { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FinancialChart = ({ title, endpoint, year, month, color }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    fetchFinancialData();
  }, [year, month]);

  const fetchFinancialData = async () => {
    try {
      const params = { year };
      if (month) params.month = month;

      const response = await axios.get(`http://localhost:8080/tirashop/orders/${endpoint}/monthly`, {
        params,
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = response.data;

      const labels = data.map((item) => `Tháng ${item.month}`);
      const values = data.map((item) => item[endpoint] || 0);

      setChartData({
        labels,
        datasets: [
          {
            label: title,
            data: values,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
          },
        ],
      });
    } catch (err) {
      console.error(`Error fetching ${title} data:`, err);
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `${title} ${month ? `Tháng ${month}/` : ""}${year}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Số tiền (VND)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Tháng",
        },
      },
    },
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default FinancialChart;