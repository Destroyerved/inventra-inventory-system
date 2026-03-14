import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { initDb } from "./server/db.ts";
import authRoutes from "./server/routes/auth.ts";
import productRoutes from "./server/routes/products.ts";
import inventoryRoutes from "./server/routes/inventory.ts";
import operationRoutes from "./server/routes/operations.ts";
import dashboardRoutes from "./server/routes/dashboard.ts";
import financesRoutes from "./server/routes/finances.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Database
  initDb();

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/operations", operationRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/finances", financesRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
