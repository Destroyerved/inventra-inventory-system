import express from "express";
import db from "../db.ts";
import { authenticateToken } from "./auth.ts";

const router = express.Router();

// Helper to generate reference
function generateReference(type: string) {
  const prefix = type === "receipt" ? "WH/IN/" : type === "delivery" ? "WH/OUT/" : type === "transfer" ? "WH/INT/" : "WH/ADJ/";
  const count = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = ?").get(type) as { count: number };
  return `${prefix}${(count.count + 1).toString().padStart(4, '0')}`;
}

router.get("/", authenticateToken, (req, res) => {
  const operations = db.prepare(`
    SELECT o.*, u.name as user_name, sl.name as source_location_name, dl.name as dest_location_name
    FROM operations o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN locations sl ON o.source_location_id = sl.id
    LEFT JOIN locations dl ON o.dest_location_id = dl.id
    ORDER BY o.date DESC
  `).all();

  const lines = db.prepare(`
    SELECT ol.*, p.name as product_name, p.sku
    FROM operation_lines ol
    JOIN products p ON ol.product_id = p.id
  `).all();

  const opsWithLines = operations.map((op: any) => ({
    ...op,
    lines: lines.filter((l: any) => l.operation_id === op.id),
  }));

  res.json(opsWithLines);
});

router.post("/", authenticateToken, (req: any, res) => {
  const { type, date, source_location_id, dest_location_id, lines, contact, scheduled_date, status = 'draft', notes, tracking_number, shipping_method } = req.body;
  const user_id = req.user.id;
  const reference = generateReference(type);

  try {
    const insertOp = db.prepare(`
      INSERT INTO operations (reference, contact, scheduled_date, type, status, date, user_id, source_location_id, dest_location_id, notes, tracking_number, shipping_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertLine = db.prepare(`
      INSERT INTO operation_lines (operation_id, product_id, quantity)
      VALUES (?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const opInfo = insertOp.run(reference, contact || null, scheduled_date || null, type, status, date, user_id, source_location_id, dest_location_id, notes || null, tracking_number || null, shipping_method || null);
      const opId = opInfo.lastInsertRowid;

      for (const line of lines) {
        insertLine.run(opId, line.product_id, line.quantity);
      }
      return opId;
    });

    const opId = transaction();
    
    // If status is done, validate immediately
    if (status === 'done') {
      validateOperation(opId, user_id);
    }

    res.status(201).json({ id: opId, reference });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to process operation" });
  }
});

function validateOperation(opId: number | bigint, userId: number) {
  const op = db.prepare("SELECT * FROM operations WHERE id = ?").get(opId) as any;
  if (!op || op.status === 'done') return;

  const lines = db.prepare("SELECT * FROM operation_lines WHERE operation_id = ?").all(opId) as any[];

  const updateInv = db.prepare(`
    INSERT INTO inventory (product_id, location_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id, location_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `);
  const insertLedger = db.prepare(`
    INSERT INTO stock_ledger (reference, operation_id, product_id, quantity_change, source_location_id, dest_location_id, timestamp, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (type, amount, date, reference, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    let totalAmount = 0;

    let currentMoveCount = (db.prepare("SELECT COUNT(*) as count FROM stock_ledger").get() as { count: number }).count;

    for (const line of lines) {
      currentMoveCount++;
      const moveRef = `SM/${currentMoveCount.toString().padStart(5, '0')}`;
      const product = db.prepare("SELECT price, cost FROM products WHERE id = ?").get(line.product_id) as any;
      
      if (op.type === "receipt") {
        updateInv.run(line.product_id, op.dest_location_id, line.quantity);
        insertLedger.run(moveRef, opId, line.product_id, line.quantity, null, op.dest_location_id, new Date().toISOString(), userId);
        totalAmount += line.quantity * (product?.cost || 0);
      } else if (op.type === "delivery") {
        updateInv.run(line.product_id, op.source_location_id, -line.quantity);
        insertLedger.run(moveRef, opId, line.product_id, -line.quantity, op.source_location_id, null, new Date().toISOString(), userId);
        totalAmount += line.quantity * (product?.price || 0);
      } else if (op.type === "transfer") {
        updateInv.run(line.product_id, op.source_location_id, -line.quantity);
        updateInv.run(line.product_id, op.dest_location_id, line.quantity);
        insertLedger.run(moveRef, opId, line.product_id, line.quantity, op.source_location_id, op.dest_location_id, new Date().toISOString(), userId);
      } else if (op.type === "adjustment") {
        updateInv.run(line.product_id, op.source_location_id, line.quantity);
        insertLedger.run(moveRef, opId, line.product_id, line.quantity, op.source_location_id, op.source_location_id, new Date().toISOString(), userId);
      }
    }

    if (totalAmount > 0) {
      if (op.type === "receipt") {
        insertTransaction.run("expense", totalAmount, new Date().toISOString(), op.reference, `Payment for receipt ${op.reference}`);
      } else if (op.type === "delivery") {
        insertTransaction.run("income", totalAmount, new Date().toISOString(), op.reference, `Revenue from delivery ${op.reference}`);
      }
    }

    db.prepare("UPDATE operations SET status = 'done' WHERE id = ?").run(opId);
  });

  transaction();
}

router.post("/:id/validate", authenticateToken, (req: any, res) => {
  try {
    validateOperation(req.params.id, req.user.id);
    res.json({ message: "Operation validated successfully" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Failed to validate operation" });
  }
});

router.get("/ledger", authenticateToken, (req, res) => {
  const ledger = db.prepare(`
    SELECT sl.*, p.name as product_name, p.sku, u.name as user_name, 
           sloc.name as source_location_name, dloc.name as dest_location_name,
           o.type as operation_type, o.reference as operation_reference
    FROM stock_ledger sl
    JOIN products p ON sl.product_id = p.id
    JOIN users u ON sl.user_id = u.id
    JOIN operations o ON sl.operation_id = o.id
    LEFT JOIN locations sloc ON sl.source_location_id = sloc.id
    LEFT JOIN locations dloc ON sl.dest_location_id = dloc.id
    ORDER BY sl.timestamp DESC
  `).all();
  res.json(ledger);
});

export default router;
