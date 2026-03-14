import express from "express";
import db from "../db.ts";
import { authenticateToken, authorizeRole } from "./auth.ts";

const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
  const inventory = db.prepare(`
    SELECT i.*, p.name as product_name, p.sku, l.name as location_name, w.name as warehouse_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN locations l ON i.location_id = l.id
    JOIN warehouses w ON l.warehouse_id = w.id
  `).all();
  res.json(inventory);
});

router.get("/warehouses", authenticateToken, (req, res) => {
  const warehouses = db.prepare("SELECT * FROM warehouses").all();
  res.json(warehouses);
});

router.post("/warehouses", authenticateToken, authorizeRole(["admin", "manager"]), (req, res) => {
  const { name, code } = req.body;
  try {
    const result = db.prepare("INSERT INTO warehouses (name, code) VALUES (?, ?)").run(name, code);
    res.status(201).json({ id: result.lastInsertRowid, name, code });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/locations", authenticateToken, (req, res) => {
  const locations = db.prepare(`
    SELECT l.*, w.name as warehouse_name 
    FROM locations l 
    JOIN warehouses w ON l.warehouse_id = w.id
  `).all();
  res.json(locations);
});

router.post("/locations", authenticateToken, authorizeRole(["admin", "manager"]), (req, res) => {
  const { name, type, warehouse_id } = req.body;
  try {
    const result = db.prepare("INSERT INTO locations (name, type, warehouse_id) VALUES (?, ?, ?)").run(name, type, warehouse_id);
    res.status(201).json({ id: result.lastInsertRowid, name, type, warehouse_id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
