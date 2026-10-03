import { useState } from "react";
import { 
  Layers, 
  Package, 
  ArrowRightLeft, 
  Settings2, 
  MapPin, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Link } from "react-router-dom";

interface WarehouseVisualMapProps {
  warehouse: any;
  locations: any[];
  inventory: any[];
}

export default function WarehouseVisualMap({
  warehouse,
  locations,
  inventory,
}: WarehouseVisualMapProps) {
  const [selectedBin, setSelectedBin] = useState<any | null>(null);
  const [zoomExpanded, setZoomExpanded] = useState(false);

  // Group inventory by location
  const locStockMap = new Map<number, any[]>();
  inventory.forEach((item) => {
    const list = locStockMap.get(item.location_id) || [];
    list.push(item);
    locStockMap.set(item.location_id, list);
  });

  // Calculate stats for a location
  const getBinStats = (locId: number) => {
    const items = locStockMap.get(locId) || [];
    const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const hasZeroStock = items.some((i) => i.quantity === 0);
    const skuCount = items.length;

    // Define capacity state
    let status: "empty" | "healthy" | "dense" | "warning" = "empty";
    if (items.length > 0) {
      if (hasZeroStock) {
        status = "warning";
      } else if (totalUnits > 40) {
        status = "dense";
      } else {
        status = "healthy";
      }
    }

    return { totalUnits, skuCount, items, status };
  };

  // Assign locations into simulated logical zones
  // Zone 1: Racks A & B
  // Zone 2: Racks C & D
  // Zone 3: Bulk & Receiving
  const half = Math.ceil(locations.length / 2);
  const zoneAisleA = locations.slice(0, Math.ceil(locations.length / 3));
  const zoneAisleB = locations.slice(Math.ceil(locations.length / 3), Math.ceil((locations.length * 2) / 3));
  const zoneAisleC = locations.slice(Math.ceil((locations.length * 2) / 3));

  const getHeatmapColor = (status: string) => {
    switch (status) {
      case "warning":
        return "bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 text-rose-700 dark:text-rose-400";
      case "dense":
        return "bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400";
      case "healthy":
        return "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400";
      default:
        return "bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 text-slate-500 dark:text-slate-400";
    }
  };

  return (
    <div className={`space-y-4 ${zoomExpanded ? "fixed inset-4 z-50 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-y-auto" : ""}`}>
      {/* Visual Map Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Floor Plan & Bin Occupancy Heatmap
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {warehouse?.name || "Facility"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any rack or bin to inspect product stock, slot utilization, and trigger transfers
          </p>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span className="text-slate-500">Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-500">High Density</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-500">Stockout Risk</span>
          </div>

          <button
            onClick={() => setZoomExpanded(!zoomExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            title={zoomExpanded ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {zoomExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Warehouse Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive 2D Architecture */}
        <div className="lg:col-span-2 space-y-5 bg-slate-100/60 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          {/* Dock Inbound Strip */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Dock 1 & Inbound Staging Zone (Receiving)
            </div>
            <span className="text-[10px] text-slate-400 font-mono">NORTH GATE</span>
          </div>

          {/* Aisles Layout */}
          <div className="space-y-4">
            {/* Aisle A */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Aisle A · High-Velocity Storage</span>
                <span className="text-[10px] text-slate-400 font-normal">Zone 01</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {zoneAisleA.map((loc) => {
                  const stats = getBinStats(loc.id);
                  const isSelected = selectedBin?.id === loc.id;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedBin({ ...loc, ...stats })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 relative ${getHeatmapColor(
                        stats.status
                      )} ${
                        isSelected
                          ? "ring-2 ring-emerald-500 shadow-md scale-[1.02]"
                          : "hover:shadow-sm hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="truncate">{loc.name}</span>
                        <span className="font-mono text-[10px] opacity-80">{stats.totalUnits}u</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] opacity-75">
                        <span>{stats.skuCount} SKUs</span>
                        <span className="capitalize font-semibold">{stats.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aisle B */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Aisle B · Standard Inventory Racks</span>
                <span className="text-[10px] text-slate-400 font-normal">Zone 02</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {zoneAisleB.map((loc) => {
                  const stats = getBinStats(loc.id);
                  const isSelected = selectedBin?.id === loc.id;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedBin({ ...loc, ...stats })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 relative ${getHeatmapColor(
                        stats.status
                      )} ${
                        isSelected
                          ? "ring-2 ring-emerald-500 shadow-md scale-[1.02]"
                          : "hover:shadow-sm hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="truncate">{loc.name}</span>
                        <span className="font-mono text-[10px] opacity-80">{stats.totalUnits}u</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] opacity-75">
                        <span>{stats.skuCount} SKUs</span>
                        <span className="capitalize font-semibold">{stats.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aisle C or Bulk */}
            {zoneAisleC.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Aisle C · Bulk Pallet Reserve & Overflow</span>
                  <span className="text-[10px] text-slate-400 font-normal">Zone 03</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {zoneAisleC.map((loc) => {
                    const stats = getBinStats(loc.id);
                    const isSelected = selectedBin?.id === loc.id;

                    return (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedBin({ ...loc, ...stats })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 relative ${getHeatmapColor(
                          stats.status
                        )} ${
                          isSelected
                            ? "ring-2 ring-emerald-500 shadow-md scale-[1.02]"
                            : "hover:shadow-sm hover:scale-[1.01]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-xs">
                          <span className="truncate">{loc.name}</span>
                          <span className="font-mono text-[10px] opacity-80">{stats.totalUnits}u</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] opacity-75">
                          <span>{stats.skuCount} SKUs</span>
                          <span className="capitalize font-semibold">{stats.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dock Outbound Strip */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Packing Stations & Outbound Dispatch (Shipping)
            </div>
            <span className="text-[10px] text-slate-400 font-mono">SOUTH GATE</span>
          </div>
        </div>

        {/* Right Col: Real-time Bin Inspector Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Bin Telemetry Inspector
                </h4>
              </div>
              {selectedBin && (
                <button
                  onClick={() => setSelectedBin(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {selectedBin ? (
              <div className="mt-4 space-y-4">
                {/* Bin Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedBin.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selectedBin.status === "warning"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                          : selectedBin.status === "dense"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
                          : selectedBin.status === "healthy"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {selectedBin.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Total Stored</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {selectedBin.totalUnits} units
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">SKU Variety</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {selectedBin.skuCount} distinct
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stored SKUs List */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Stored SKU Allocation
                  </h5>
                  {selectedBin.items.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      This bin location is currently vacant.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedBin.items.map((item: any) => (
                        <div
                          key={item.product_id}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {item.product_name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {item.sku}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {item.quantity} pcs
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/transfers"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer From Bin
                  </Link>
                  <Link
                    to="/adjustments"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Cycle Count / Adjust
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Info className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-medium">Select any rack or shelf in the floor plan to view contents</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            Inventra WMS Real-Time Digital Twin · Updated live
          </div>
        </div>
      </div>
    </div>
  );
}
