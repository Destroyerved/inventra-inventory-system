import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "inventory.db");
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      otp TEXT,
      otp_expiry TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      location TEXT,
      manager_name TEXT,
      contact_number TEXT
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER,
      uom TEXT NOT NULL,
      reorder_level INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      description TEXT,
      barcode TEXT,
      supplier TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'income' or 'expense'
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      reference TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      UNIQUE(product_id, location_id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      contact TEXT,
      scheduled_date TEXT,
      type TEXT NOT NULL, -- 'receipt', 'delivery', 'transfer', 'adjustment'
      status TEXT DEFAULT 'draft', -- 'draft', 'done', 'cancelled'
      date TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      source_location_id INTEGER,
      dest_location_id INTEGER,
      notes TEXT,
      tracking_number TEXT,
      shipping_method TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (source_location_id) REFERENCES locations(id),
      FOREIGN KEY (dest_location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS operation_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (operation_id) REFERENCES operations(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS stock_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE,
      operation_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity_change INTEGER NOT NULL,
      source_location_id INTEGER,
      dest_location_id INTEGER,
      timestamp TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (operation_id) REFERENCES operations(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  try { db.exec("ALTER TABLE users ADD COLUMN login_id TEXT UNIQUE"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN otp TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN otp_expiry TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE operations ADD COLUMN reference TEXT UNIQUE"); } catch (e) {}
  try { db.exec("ALTER TABLE operations ADD COLUMN contact TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE operations ADD COLUMN scheduled_date TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE products ADD COLUMN price REAL DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE products ADD COLUMN description TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE products ADD COLUMN barcode TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE products ADD COLUMN supplier TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE operations ADD COLUMN notes TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE operations ADD COLUMN tracking_number TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE operations ADD COLUMN shipping_method TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE warehouses ADD COLUMN manager_name TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE warehouses ADD COLUMN contact_number TEXT"); } catch (e) {}
  try { 
    db.exec("ALTER TABLE stock_ledger ADD COLUMN reference TEXT"); 
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_ledger_reference ON stock_ledger(reference)");
  } catch (e) {}

  // Seed data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    const hashAdmin = bcrypt.hashSync("admin123", 10);
    const hashManager = bcrypt.hashSync("manager123", 10);
    const hashStaff = bcrypt.hashSync("staff123", 10);

    db.prepare("INSERT INTO users (login_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)").run("admin123", "admin@inventra.com", hashAdmin, "Admin User", "admin");
    db.prepare("INSERT INTO users (login_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)").run("manager1", "manager@inventra.com", hashManager, "Manager User", "manager");
    db.prepare("INSERT INTO users (login_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)").run("staff1", "staff@inventra.com", hashStaff, "Staff User", "staff");

    const catStmt = db.prepare("INSERT INTO categories (name) VALUES (?)");
    catStmt.run("Electronics"); // 1
    catStmt.run("Furniture"); // 2
    catStmt.run("Office Supplies"); // 3
    catStmt.run("Peripherals"); // 4

    const whStmt = db.prepare("INSERT INTO warehouses (name, location) VALUES (?, ?)");
    whStmt.run("Main Warehouse", "New York"); // 1
    whStmt.run("Secondary Warehouse", "Los Angeles"); // 2

    const locStmt = db.prepare("INSERT INTO locations (warehouse_id, name) VALUES (?, ?)");
    locStmt.run(1, "Rack A1"); // 1
    locStmt.run(1, "Rack A2"); // 2
    locStmt.run(2, "Rack B1"); // 3
    locStmt.run(2, "Shelf B2"); // 4
    locStmt.run(1, "Receiving Dock"); // 5

    const prodStmt = db.prepare("INSERT INTO products (name, sku, category_id, uom, reorder_level, price, cost) VALUES (?, ?, ?, ?, ?, ?, ?)");
    prodStmt.run("Laptop Pro", "LP-001", 1, "pcs", 10, 1200.00, 800.00); // 1
    prodStmt.run("Office Chair", "OC-001", 2, "pcs", 20, 150.00, 75.00); // 2
    prodStmt.run("Wireless Mouse", "WM-001", 4, "pcs", 50, 25.00, 10.00); // 3
    prodStmt.run("Mechanical Keyboard", "MK-001", 4, "pcs", 30, 80.00, 40.00); // 4
    prodStmt.run("Printer Paper", "PP-001", 3, "boxes", 100, 5.00, 2.00); // 5
    prodStmt.run("Standing Desk", "SD-001", 2, "pcs", 5, 300.00, 150.00); // 6

    const invStmt = db.prepare("INSERT INTO inventory (product_id, location_id, quantity) VALUES (?, ?, ?)");
    invStmt.run(1, 1, 50);
    invStmt.run(2, 3, 15); // Low stock
    invStmt.run(3, 2, 120);
    invStmt.run(4, 2, 0); // Out of stock
    invStmt.run(5, 4, 500);
    invStmt.run(6, 4, 2); // Low stock

    const opStmt = db.prepare("INSERT INTO operations (reference, contact, scheduled_date, type, status, date, user_id, source_location_id, dest_location_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const opLineStmt = db.prepare("INSERT INTO operation_lines (operation_id, product_id, quantity) VALUES (?, ?, ?)");
    const ledgerStmt = db.prepare("INSERT INTO stock_ledger (reference, operation_id, product_id, quantity_change, source_location_id, dest_location_id, timestamp, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();

    const transStmt = db.prepare("INSERT INTO transactions (type, amount, date, reference, description) VALUES (?, ?, ?, ?, ?)");

    // Op 1: Receipt (Done)
    opStmt.run("WH/IN/0001", "Vendor A", lastWeek, "receipt", "done", lastWeek, 1, null, 1);
    opLineStmt.run(1, 1, 50);
    ledgerStmt.run("SM/00001", 1, 1, 50, null, 1, lastWeek, 1);
    transStmt.run("expense", 50 * 800.00, lastWeek, "WH/IN/0001", "Payment for receipt WH/IN/0001");

    // Op 2: Receipt (Done)
    opStmt.run("WH/IN/0002", "Vendor B", yesterday, "receipt", "done", yesterday, 2, null, 2);
    opLineStmt.run(2, 3, 120);
    ledgerStmt.run("SM/00002", 2, 3, 120, null, 2, yesterday, 2);
    transStmt.run("expense", 120 * 10.00, yesterday, "WH/IN/0002", "Payment for receipt WH/IN/0002");

    // Op 3: Delivery (Done)
    opStmt.run("WH/OUT/0001", "Customer X", now, "delivery", "done", now, 3, 3, null);
    opLineStmt.run(3, 2, 5);
    ledgerStmt.run("SM/00003", 3, 2, -5, 3, null, now, 3);
    transStmt.run("income", 5 * 150.00, now, "WH/OUT/0001", "Revenue from delivery WH/OUT/0001");

    // Op 4: Transfer (Done)
    opStmt.run("WH/INT/0001", null, now, "transfer", "done", now, 2, 4, 3);
    opLineStmt.run(4, 5, 10);
    ledgerStmt.run("SM/00004", 4, 5, 10, 4, 3, now, 2);

    // Op 5: Adjustment (Done)
    opStmt.run("WH/ADJ/0001", null, now, "adjustment", "done", now, 1, 4, 4);
    opLineStmt.run(5, 6, -1);
    ledgerStmt.run("SM/00005", 5, 6, -1, 4, 4, now, 1);

    // Op 6: Pending Receipt
    opStmt.run("WH/IN/0003", "Vendor C", now, "receipt", "draft", now, 1, null, 5);
    opLineStmt.run(6, 4, 30);
    
    // Op 7: Pending Delivery
    opStmt.run("WH/OUT/0002", "Customer Y", now, "delivery", "draft", now, 2, 1, null);
    opLineStmt.run(7, 1, 5);
  }
}

export default db;
