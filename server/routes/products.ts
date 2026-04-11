import express from "express";
import db from "../db.ts";
import { authenticateToken, authorizeRole } from "./auth.ts";

const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, SUM(i.quantity) as total_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory i ON p.id = i.product_id
    GROUP BY p.id
  `).all();
  res.json(products);
});

router.post("/", authenticateToken, authorizeRole(["admin", "manager"]), (req, res) => {
  const { name, sku, category_id, uom, reorder_level, price, cost, description, barcode, supplier } = req.body;
  try {
    const stmt = db.prepare("INSERT INTO products (name, sku, category_id, uom, reorder_level, price, cost, description, barcode, supplier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, sku, category_id, uom, reorder_level || 0, price || 0, cost || 0, description || null, barcode || null, supplier || null);
    res.status(201).json({ id: info.lastInsertRowid, name, sku, category_id, uom, reorder_level, price, cost, description, barcode, supplier });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "SKU already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.put("/:id", authenticateToken, authorizeRole(["admin", "manager"]), (req, res) => {
  const { id } = req.params;
  const { name, sku, category_id, uom, reorder_level, price, cost, description, barcode, supplier } = req.body;
  try {
    const stmt = db.prepare("UPDATE products SET name = ?, sku = ?, category_id = ?, uom = ?, reorder_level = ?, price = ?, cost = ?, description = ?, barcode = ?, supplier = ? WHERE id = ?");
    stmt.run(name, sku, category_id, uom, reorder_level || 0, price || 0, cost || 0, description || null, barcode || null, supplier || null, id);
    res.json({ id, name, sku, category_id, uom, reorder_level, price, cost, description, barcode, supplier });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "SKU already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.delete("/:id", authenticateToken, authorizeRole(["admin", "manager"]), (req, res) => {
  const { id } = req.params;
  try {
    // Check if product is used in inventory
    const inventoryCount = db.prepare("SELECT COUNT(*) as count FROM inventory WHERE product_id = ?").get(id) as { count: number };
    if (inventoryCount.count > 0) {
      return res.status(400).json({ error: "Cannot delete product with existing inventory" });
    }
    
    // Check if product is used in operations
    const opsCount = db.prepare("SELECT COUNT(*) as count FROM operation_lines WHERE product_id = ?").get(id) as { count: number };
    if (opsCount.count > 0) {
      return res.status(400).json({ error: "Cannot delete product used in operations" });
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories", authenticateToken, (req, res) => {
  const categories = db.prepare("SELECT * FROM categories").all();
  res.json(categories);
});

export default router;
