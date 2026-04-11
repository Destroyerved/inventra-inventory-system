import { useState, useEffect } from "react";
import { fetchApi } from "../lib/api";
import { Package, Search, Filter } from "lucide-react";

export default function Stock() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchApi("/inventory").then(setInventory).catch(console.error);
  }, []);

  const filteredInventory = inventory.filter(
    (item) =>
      item.product_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.location_name.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Stock Levels
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by product, SKU, location, or warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors duration-200"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 w-full sm:w-auto shrink-0">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">SKU</th>
                <th className="px-6 py-4 font-medium">Warehouse</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredInventory.map((item) => (
                <tr key={`${item.product_id}-${item.location_id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {item.warehouse_name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {item.location_name}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                    {item.quantity}
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No stock found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
