import express from "express";
import db from "../db.ts";
import { authenticateToken } from "./auth.ts";

const router = express.Router();

router.get("/stats", authenticateToken, (req, res) => {
  const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  const totalStock = db.prepare("SELECT SUM(quantity) as count FROM inventory").get() as { count: number };
  
  const lowStockItems = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT p.id, SUM(i.quantity) as total_qty, p.reorder_level
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      GROUP BY p.id
      HAVING total_qty <= p.reorder_level AND total_qty > 0
    )
  `).get() as { count: number };

  const outOfStockItems = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT p.id, SUM(i.quantity) as total_qty
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      GROUP BY p.id
      HAVING total_qty IS NULL OR total_qty = 0
    )
  `).get() as { count: number };

  const pendingReceipts = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = 'receipt' AND status != 'done'").get() as { count: number };
  const pendingDeliveries = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = 'delivery' AND status != 'done'").get() as { count: number };

  const recentOperations = db.prepare(`
    SELECT o.id, o.reference, o.type, o.status, o.date, u.name as user_name
    FROM operations o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.date DESC
    LIMIT 5
  `).all();

  const inventoryByCategory = db.prepare(`
    SELECT c.name as category, COALESCE(SUM(i.quantity), 0) as count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    LEFT JOIN inventory i ON p.id = i.product_id
    GROUP BY c.id
  `).all();

  res.json({
    totalProducts: totalProducts.count,
    totalStock: totalStock.count || 0,
    lowStockItems: lowStockItems.count,
    outOfStockItems: outOfStockItems.count,
    pendingReceipts: pendingReceipts.count,
    pendingDeliveries: pendingDeliveries.count,
    recentOperations,
    inventoryByCategory,
  });
});

router.get("/operations-summary", authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const getStats = (type: string) => {
    const total = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = ?").get(type) as { count: number };
    const pending = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = ? AND status NOT IN ('done', 'cancelled')").get(type) as { count: number };
    const late = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = ? AND status NOT IN ('done', 'cancelled') AND date(scheduled_date) < date(?)").get(type, today) as { count: number };
    const waiting = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = ? AND status IN ('draft', 'waiting')").get(type) as { count: number };
    
    return {
      total: total.count,
      pending: pending.count,
      late: late.count,
      waiting: waiting.count
    };
  };

  const receipts = getStats('receipt');
  const deliveries = getStats('delivery');

  res.json({
    receipts: {
      to_receive: receipts.pending,
      late: receipts.late,
      waiting: receipts.waiting,
      total: receipts.total
    },
    deliveries: {
      to_deliver: deliveries.pending,
      late: deliveries.late,
      waiting: deliveries.waiting,
      total: deliveries.total
    }
  });
});

export default router;
