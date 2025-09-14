import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const tenantId = "your-tenant-id"; // replace with actual tenantId
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:4000/metrics/${tenantId}`)
      .then(res => setMetrics(res.data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 Shopify Insights Dashboard</h1>
      <div>
        <h2>Total Customers: {metrics.totalCustomers}</h2>
        <h2>Total Orders: {metrics.totalOrders}</h2>
        <h2>Total Revenue: ₹{metrics.revenue}</h2>
      </div>
    </div>
  );
}
