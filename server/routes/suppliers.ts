import express from "express";
import db from "../db.ts";
import { authenticateToken } from "./auth.ts";

const router = express.Router();

// List all suppliers
router.get("/", authenticateToken, (req, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM products p WHERE p.supplier = s.name) as product_count
      FROM suppliers s
      ORDER BY s.name ASC
    `).all();
    res.json(suppliers);
  } catch (error: any) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// Create supplier
router.post("/", authenticateToken, (req: any, res) => {
  const { name, contact_person, email, phone, address, notes } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name.trim(),
      contact_person?.trim() || null,
      email?.trim() || null,
      phone?.trim() || null,
      address?.trim() || null,
      notes?.trim() || null
    );
    res.status(201).json({ id: info.lastInsertRowid, message: "Supplier created successfully" });
  } catch (error: any) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

// Update supplier
router.put("/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { name, contact_person, email, phone, address, notes } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  try {
    const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const stmt = db.prepare(`
      UPDATE suppliers 
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(
      name.trim(),
      contact_person?.trim() || null,
      email?.trim() || null,
      phone?.trim() || null,
      address?.trim() || null,
      notes?.trim() || null,
      id
    );
    res.json({ message: "Supplier updated successfully" });
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

// Delete supplier
router.delete("/:id", authenticateToken, (req: any, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare("DELETE FROM suppliers WHERE id = ?");
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json({ message: "Supplier deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

export default router;
