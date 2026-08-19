import express from "express";
import db from "../db.ts";
import { authenticateToken } from "./auth.ts";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// Helper to compute inventory metrics
function getInventoryMetrics() {
  const products = db.prepare(`
    SELECT 
      p.id, p.name, p.sku, p.uom, p.reorder_level, p.price, p.cost, p.supplier,
      c.name as category_name,
      COALESCE(SUM(i.quantity), 0) as current_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory i ON p.id = i.product_id
    GROUP BY p.id
  `).all() as any[];

  // 30 days movement velocity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const ledgerVelocity = db.prepare(`
    SELECT product_id, 
      SUM(CASE WHEN quantity_change < 0 THEN -quantity_change ELSE 0 END) as outbound_units,
      COUNT(DISTINCT operation_id) as total_moves
    FROM stock_ledger
    WHERE timestamp >= ?
    GROUP BY product_id
  `).all(thirtyDaysAgo) as any[];

  const velocityMap = new Map(ledgerVelocity.map(v => [v.product_id, v]));

  const enriched = products.map(p => {
    const v = velocityMap.get(p.id) || { outbound_units: 0, total_moves: 0 };
    const dailyBurnRate = Math.max(0.1, v.outbound_units / 30);
    const daysRemaining = p.current_stock > 0 
      ? Math.round(p.current_stock / dailyBurnRate) 
      : 0;

    let status = "healthy";
    if (p.current_stock === 0) {
      status = "out_of_stock";
    } else if (p.current_stock <= p.reorder_level || daysRemaining <= 7) {
      status = "critical";
    } else if (daysRemaining <= 14) {
      status = "warning";
    } else if (daysRemaining > 60 && p.current_stock > 50) {
      status = "overstocked";
    }

    const recommendedReorder = Math.max(
      (p.reorder_level * 2) - p.current_stock,
      Math.ceil(dailyBurnRate * 30)
    );

    return {
      ...p,
      outbound_30d: v.outbound_units,
      daily_burn_rate: Number(dailyBurnRate.toFixed(1)),
      days_remaining: daysRemaining,
      status,
      recommended_reorder: Math.max(0, recommendedReorder),
      stock_value: Number((p.current_stock * (p.cost || 0)).toFixed(2)),
    };
  });

  const totalValuation = enriched.reduce((sum, p) => sum + p.stock_value, 0);
  const criticalCount = enriched.filter(p => p.status === "critical" || p.status === "out_of_stock").length;
  const warningCount = enriched.filter(p => p.status === "warning").length;

  return {
    products: enriched,
    totalValuation: Number(totalValuation.toFixed(2)),
    criticalCount,
    warningCount,
  };
}

// GET /api/ai/forecast - Comprehensive forecast & risk metrics
router.get("/forecast", authenticateToken, (req, res) => {
  try {
    const metrics = getInventoryMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error("AI forecast error:", error);
    res.status(500).json({ error: "Failed to generate inventory forecast" });
  }
});

// GET /api/ai/insights - AI Executive Briefing
router.get("/insights", authenticateToken, async (req, res) => {
  try {
    const metrics = getInventoryMetrics();
    const criticalItems = metrics.products.filter(p => p.status === "critical" || p.status === "out_of_stock");
    const overstockedItems = metrics.products.filter(p => p.status === "overstocked");

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_api_key_here" && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are Inventra's AI Chief Inventory Strategist.
Here is the current warehouse telemetry:
- Total Stock Valuation: $${metrics.totalValuation}
- Critical / Stockout Items (${criticalItems.length}): ${criticalItems.map(p => `${p.name} (Stock: ${p.current_stock}, Reorder Level: ${p.reorder_level}, Days left: ${p.days_remaining})`).join("; ") || "None"}
- Overstocked Items (${overstockedItems.length}): ${overstockedItems.map(p => `${p.name} (Stock: ${p.current_stock}, Days left: ${p.days_remaining})`).join("; ") || "None"}

Generate a high-impact, 3-bullet executive operational briefing (under 120 words total):
1. Immediate stockout risks and reorder priorities.
2. Capital efficiency advice (holding cost / overstock).
3. Recommended warehouse action this week.
Keep tone professional, crisp, and actionable.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        if (response.text) {
          return res.json({
            aiPowered: true,
            summary: response.text.trim(),
            criticalCount: metrics.criticalCount,
            totalValuation: metrics.totalValuation,
            recommendations: criticalItems.slice(0, 5),
          });
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to deterministic insight:", geminiError);
      }
    }

    // High quality deterministic fallback briefing
    let fallbackSummary = "";
    if (criticalItems.length > 0) {
      const names = criticalItems.map(p => p.name).slice(0, 3).join(", ");
      fallbackSummary = `• Alert: ${criticalItems.length} product(s) (${names}) have fallen below reorder levels or face depletion within 7 days.\n`;
      fallbackSummary += `• Capital Optimization: Total active warehouse inventory is valued at $${metrics.totalValuation.toLocaleString()} across healthy SKUs.\n`;
      fallbackSummary += `• Priority Action: Dispatch purchase orders to primary suppliers to replenish high-velocity items immediately.`;
    } else {
      fallbackSummary = `• All warehouse catalog items maintain healthy buffer stocks above safety thresholds.\n`;
      fallbackSummary += `• Total active inventory is optimized at $${metrics.totalValuation.toLocaleString()}.\n`;
      fallbackSummary += `• Continue routine cycle counting and monitor upcoming customer deliveries.`;
    }

    res.json({
      aiPowered: false,
      summary: fallbackSummary,
      criticalCount: metrics.criticalCount,
      totalValuation: metrics.totalValuation,
      recommendations: criticalItems.slice(0, 5),
    });
  } catch (error: any) {
    console.error("AI insights error:", error);
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

// POST /api/ai/query - Ask Copilot natural language queries
router.post("/query", authenticateToken, async (req: any, res) => {
  const { question } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const metrics = getInventoryMetrics();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== "your_api_key_here" && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const context = `Warehouse Data:
Valuation: $${metrics.totalValuation}
Products: ${JSON.stringify(metrics.products.map(p => ({
  name: p.name,
  sku: p.sku,
  stock: p.current_stock,
  reorder: p.reorder_level,
  status: p.status,
  days_remaining: p.days_remaining,
  supplier: p.supplier
})))}

User Question: ${question}
Answer concisely, accurately, and politely in 2-3 sentences based strictly on the warehouse data.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: context,
        });

        if (response.text) {
          return res.json({ answer: response.text.trim() });
        }
      } catch (err) {
        console.warn("Gemini query error:", err);
      }
    }

    // Heuristic natural language response
    const q = question.toLowerCase();
    let answer = "";
    if (q.includes("low") || q.includes("reorder") || q.includes("critical") || q.includes("out of stock")) {
      const crit = metrics.products.filter(p => p.status === "critical" || p.status === "out_of_stock");
      answer = crit.length > 0 
        ? `There are currently ${crit.length} item(s) requiring attention: ${crit.map(p => `${p.name} (stock: ${p.current_stock})`).join(", ")}.`
        : "All products currently maintain healthy inventory levels above their reorder thresholds.";
    } else if (q.includes("valuation") || q.includes("worth") || q.includes("cost") || q.includes("total value")) {
      answer = `The total active inventory valuation across all warehouses is currently $${metrics.totalValuation.toLocaleString()}.`;
    } else if (q.includes("warehouse") || q.includes("location")) {
      answer = `Inventra tracks multi-warehouse inventory across Main Warehouse (New York) and Secondary Warehouse (Los Angeles) with dedicated location bins.`;
    } else {
      answer = `Inventra Copilot Telemetry: ${metrics.products.length} catalog products monitored, $${metrics.totalValuation.toLocaleString()} inventory valuation, ${metrics.criticalCount} restock alerts.`;
    }

    res.json({ answer });
  } catch (error: any) {
    console.error("Copilot query error:", error);
    res.status(500).json({ error: "Failed to process Copilot query" });
  }
});

export default router;
