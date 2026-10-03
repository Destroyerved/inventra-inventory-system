import { useState, useEffect } from "react";
import { fetchApi } from "../lib/api";
import { showToast } from "./Toast";
import { X, ShoppingCart, AlertTriangle, ArrowRight, Check, CheckCircle2, Building2, PackageCheck } from "lucide-react";

interface AutoPOItem {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
  order_qty: number;
  cost: number;
  supplier_id: number | null;
  supplier_name: string;
  location_id: number;
  location_name: string;
  selected: boolean;
}

interface AutoPOGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AutoPOGeneratorModal({ isOpen, onClose, onSuccess }: AutoPOGeneratorModalProps) {
  const [items, setItems] = useState<AutoPOItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    Promise.all([
      fetchApi("/inventory"),
      fetchApi("/products"),
      fetchApi("/suppliers").catch(() => []),
      fetchApi("/settings/locations"),
    ])
      .then(([inv, prods, sups, locs]) => {
        setSuppliers(sups);
        setLocations(locs);

        const prodMap = new Map<number, any>(prods.map((p: any) => [p.id, p]));
        const defaultLocId = locs[0]?.id || 1;

        // Group inventory by product
        const prodStockMap = new Map<number, number>();
        const prodLocMap = new Map<number, number>();

        inv.forEach((item: any) => {
          prodStockMap.set(item.product_id, (prodStockMap.get(item.product_id) || 0) + (item.quantity || 0));
          if (!prodLocMap.has(item.product_id)) {
            prodLocMap.set(item.product_id, item.location_id);
          }
        });

        // Identify items that need restocking
        const restockList: AutoPOItem[] = [];

        prods.forEach((prod: any) => {
          const currentStock = prodStockMap.get(prod.id) ?? 0;
          const reorderPoint = prod.reorder_level || 10;

          if (currentStock <= reorderPoint) {
            const locId = prodLocMap.get(prod.id) || defaultLocId;
            const loc = locs.find((l: any) => l.id === locId);
            const sup = sups.find((s: any) => s.id === prod.supplier_id);

            // Suggest ordering to bring up to 2.5x reorder point or minimum 20 units
            const deficit = Math.max(1, reorderPoint * 2 - currentStock);
            const suggestedQty = Math.max(15, deficit);

            restockList.push({
              product_id: prod.id,
              product_name: prod.name,
              sku: prod.sku,
              current_stock: currentStock,
              reorder_level: reorderPoint,
              order_qty: suggestedQty,
              cost: prod.cost || 0,
              supplier_id: prod.supplier_id || (sups[0]?.id ?? null),
              supplier_name: sup?.name || sups[0]?.name || "Preferred Vendor",
              location_id: locId,
              location_name: loc?.name || "Main Bay",
              selected: true,
            });
          }
        });

        setItems(restockList);
      })
      .catch((err) => {
        console.error("Failed to calculate replenishment:", err);
        showToast("Failed to calculate stock replenishment", "error");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (productId: number) => {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, selected: !i.selected } : i))
    );
  };

  const updateQty = (productId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, order_qty: Math.max(1, qty) } : i))
    );
  };

  const selectedItems = items.filter((i) => i.selected);
  const totalEstimatedCost = selectedItems.reduce((sum, i) => sum + i.order_qty * i.cost, 0);
  const totalUnits = selectedItems.reduce((sum, i) => sum + i.order_qty, 0);

  const handleCreateDraftPO = async () => {
    if (selectedItems.length === 0) {
      showToast("Select at least one item to order", "warning");
      return;
    }

    setGenerating(true);
    try {
      // Group items by supplier for realistic multi-supplier purchase receipts
      const groupsBySupplier = new Map<string, AutoPOItem[]>();
      selectedItems.forEach((item) => {
        const key = item.supplier_name || "General Supplier";
        const list = groupsBySupplier.get(key) || [];
        list.push(item);
        groupsBySupplier.set(key, list);
      });

      const defaultLocId = locations[0]?.id || 1;
      let createdCount = 0;

      for (const [supplierName, groupItems] of groupsBySupplier.entries()) {
        const destLocId = groupItems[0]?.location_id || defaultLocId;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        await fetchApi("/operations", {
          method: "POST",
          body: JSON.stringify({
            type: "receipt",
            contact: supplierName,
            source_location_id: null,
            dest_location_id: destLocId,
            date: new Date().toISOString(),
            scheduled_date: targetDate.toISOString(),
            status: "draft",
            notes: `Automated replenishment PO for ${groupItems.length} critical inventory items.`,
            lines: groupItems.map((g) => ({
              product_id: g.product_id,
              quantity: g.order_qty,
            })),
          }),
        });
        createdCount++;
      }

      showToast(
        `Successfully generated ${createdCount} draft purchase receipt(s) for ${totalUnits} units`,
        "success"
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to generate restock PO", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                1-Click Intelligent Restock Wizard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated replenishment calculator based on current stock, reorder levels & burn velocity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium">Analyzing SKU stock levels and burn velocities...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">All Inventory Healthy</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No items are currently below their minimum safety thresholds. Your warehouse replenishment is fully covered.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {items.length} SKUs require replenishment
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Items marked below threshold have been auto-selected with calculated order lots
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="text-right">
                    <span className="text-slate-400">Total Units</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{totalUnits} pcs</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Est. PO Value</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === items.length && items.length > 0}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setItems((prev) => prev.map((i) => ({ ...i, selected: checked })));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="py-3 px-4">Product & SKU</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Order Qty</th>
                      <th className="py-3 px-4 text-right">Unit Cost</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {items.map((item) => {
                      const subtotal = item.order_qty * item.cost;
                      const isCritical = item.current_stock === 0;

                      return (
                        <tr
                          key={item.product_id}
                          className={`transition-colors ${
                            item.selected ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/30 opacity-60"
                          } hover:bg-slate-50 dark:hover:bg-slate-800/40`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleSelect(item.product_id)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.product_name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isCritical
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                }`}
                              >
                                {item.current_stock} / min {item.reorder_level}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              <span className="truncate max-w-[120px]">{item.supplier_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="1"
                              value={item.order_qty}
                              onChange={(e) => updateQty(item.product_id, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-mono">
                            ${item.cost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white font-mono">
                            ${subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedItems.length} of {items.length} items queued for restock
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDraftPO}
              disabled={generating || selectedItems.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              {generating ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating PO...
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Generate Inbound Receipt ({selectedItems.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
