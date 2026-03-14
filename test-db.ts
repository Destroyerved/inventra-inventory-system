import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "inventory.db");
const db = new Database(dbPath);

try {
  db.exec("ALTER TABLE stock_ledger ADD COLUMN reference TEXT");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_ledger_reference ON stock_ledger(reference)");
  console.log("Success");
} catch (e) {
  console.error(e);
}
