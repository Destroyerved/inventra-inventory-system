import { useState, useEffect } from "react";
import { fetchApi } from "../lib/api";
import { Package, Search, Download, Barcode as BarcodeIcon, AlertTriangle, Layers, CheckCircle2, Zap } from "lucide-react";
import BarcodeGeneratorModal from "../components/BarcodeGeneratorModal";
import AutoPOGeneratorModal from "../components/AutoPOGeneratorModal";
import { showToast } from "../components/Toast";

export default function Stock() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "low" | "out">("all");
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<any>(null);
  const [showAutoPO, setShowAutoPO] = useState(false);

  const loadInventory = () => {
    fetchApi("/inventory")
      .then(setInventory)
      .catch((err) => {
        console.error("Failed to load inventory:", err);
      });
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleExportCsv = () => {
    if (inventory.length === 0) {
      showToast("No inventory records to export", "warning");
      return;
    }

    const headers = "Product Name,SKU,Warehouse,Location Bin,Quantity,Reorder Level\n";
    const rows = inventory.map((i) => 
      `"${i.product_name}","${i.sku}","${i.warehouse_name}","${i.location_name}",${i.quantity},${i.reorder_level || 0}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventra_stock_levels_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Stock report exported to CSV", "success");
  };

  const filteredInventory = inventory.filter((item) => {
    const term = search.toLowerCase();
    const matchesSearch =
      item.product_name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.location_name.toLowerCase().includes(term) ||
      item.warehouse_name.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (statusFilter === "out") return item.quantity === 0;
    if (statusFilter === "low") return item.quantity > 0 && item.quantity <= (item.reorder_level || 10);
    if (statusFilter === "healthy") return item.quantity > (item.reorder_level || 10);
    return true;
  });

  const totalStockUnits = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;
  const lowStockCount = inventory.filter((i) => i.quantity > 0 && i.quantity <= (i.reorder_level || 10)).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Stock Levels & Locations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time physical inventory across warehouses and storage bins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAutoPO(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Zap className="h-4 w-4" /> 1-Click Auto-Restock
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Tracked Units</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{totalStockUnits.toLocaleString()} pcs</div>
          </div>
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Low Stock Alerts</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{lowStockCount} items</div>
          </div>
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Depleted Bins</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400">{outOfStockCount} out of stock</div>
          </div>
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU, warehouse, or bin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All ({inventory.length})
            </button>
            <button
              onClick={() => setStatusFilter("healthy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "healthy"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Healthy
            </button>
            <button
              onClick={() => setStatusFilter("low")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "low"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setStatusFilter("out")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === "out"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Warehouse Facility</th>
                <th className="px-6 py-4">Location Bin</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Quantity</th>
                <th className="px-6 py-4 text-center">Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredInventory.map((item) => {
                const isOutOfStock = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= (item.reorder_level || 10);

                return (
                  <tr
                    key={`${item.product_id}-${item.location_id}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {item.warehouse_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                        {item.location_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isOutOfStock
                            ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
                            : isLow
                            ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                            : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {isOutOfStock ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      {item.quantity.toLocaleString()} pcs
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedBarcodeProduct({
                          name: item.product_name,
                          sku: item.sku,
                          barcode: item.barcode || item.sku,
                        })}
                        title="Generate Barcode Tag"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <BarcodeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No inventory records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode & Printable Label Modal */}
      <BarcodeGeneratorModal
        product={selectedBarcodeProduct}
        isOpen={!!selectedBarcodeProduct}
        onClose={() => setSelectedBarcodeProduct(null)}
      />

      {/* 1-Click Auto-Restock Modal */}
      <AutoPOGeneratorModal
        isOpen={showAutoPO}
        onClose={() => setShowAutoPO(false)}
        onSuccess={loadInventory}
      />
    </div>
  );
}
