import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

dotenv.config();
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// Sync customers from Shopify
app.post("/sync/customers/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const response = await axios.get(
      `https://${tenant.shopName}/admin/api/2025-07/customers.json`,
      { headers: { "X-Shopify-Access-Token": tenant.accessToken } }
    );

    for (let c of response.data.customers) {
      await prisma.customer.upsert({
        where: { shopifyId: c.id.toString() },
        update: {
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          totalSpend: parseFloat(c.total_spent || 0),
        },
        create: {
          tenantId,
          shopifyId: c.id.toString(),
          email: c.email,
          firstName: c.first_name,
          lastName: c.last_name,
          totalSpend: parseFloat(c.total_spent || 0),
        },
      });
    }

    res.json({ message: "Customers synced successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Sync failed" });
  }
});

// Metrics API
app.get("/metrics/:tenantId", async (req, res) => {
  const { tenantId } = req.params;
  const totalCustomers = await prisma.customer.count({ where: { tenantId } });
  const totalOrders = await prisma.order.count({ where: { tenantId } });
  const revenue = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { tenantId },
  });

  res.json({
    totalCustomers,
    totalOrders,
    revenue: revenue._sum.totalPrice || 0,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
