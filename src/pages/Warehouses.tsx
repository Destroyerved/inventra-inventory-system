import { useState, useEffect, type FormEvent } from "react";
import { fetchApi } from "../lib/api";
import { Warehouse as WarehouseIcon, MapPin, Plus, User, Phone, Layers, Package, X, Check } from "lucide-react";
import { showToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWh, setShowAddWh] = useState(false);
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [selectedWhId, setSelectedWhId] = useState<number | null>(null);

  // Form states
  const [whName, setWhName] = useState("");
  const [whLocation, setWhLocation] = useState("");
  const [whManager, setWhManager] = useState("");
  const [whContact, setWhContact] = useState("");

  const [locName, setLocName] = useState("");
  const [locWhId, setLocWhId] = useState<number | string>("");

  const { user } = useAuthStore();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi("/settings/warehouses"),
      fetchApi("/settings/locations"),
      fetchApi("/inventory"),
    ])
      .then(([whs, locs, inv]) => {
        setWarehouses(whs);
        setLocations(locs);
        setInventory(inv);
        if (whs.length > 0 && selectedWhId === null) {
          setSelectedWhId(whs[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load warehouse data:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWarehouse = async (e: FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) return;

    try {
      await fetchApi("/settings/warehouses", {
        method: "POST",
        body: JSON.stringify({
          name: whName.trim(),
          location: whLocation.trim() || null,
          manager_name: whManager.trim() || null,
          contact_number: whContact.trim() || null,
        }),
      });
      showToast("Warehouse created successfully", "success");
      setWhName("");
      setWhLocation("");
      setWhManager("");
      setWhContact("");
      setShowAddWh(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to create warehouse", "error");
    }
  };

  const handleAddLocation = async (e: FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locWhId) return;

    try {
      await fetchApi("/settings/locations", {
        method: "POST",
        body: JSON.stringify({
          warehouse_id: Number(locWhId),
          name: locName.trim(),
        }),
      });
      showToast("Storage location added", "success");
      setLocName("");
      setShowAddLoc(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to add location", "error");
    }
  };

  const activeWarehouse = warehouses.find((w) => w.id === selectedWhId);
  const activeLocations = locations.filter((l) => l.warehouse_id === selectedWhId);

  // Compute total stock in each warehouse
  const getWarehouseStock = (whId: number) => {
    const whLocIds = new Set(locations.filter((l) => l.warehouse_id === whId).map((l) => l.id));
    return inventory
      .filter((item) => whLocIds.has(item.location_id))
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <WarehouseIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Warehouses & Storage Hubs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Multi-facility inventory mapping, bin locations, and site capacity
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLocWhId(selectedWhId || (warehouses[0]?.id ?? ""));
                setShowAddLoc(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Bin / Rack
            </button>
            <button
              onClick={() => setShowAddWh(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> New Warehouse
            </button>
          </div>
        )}
      </div>

      {/* Warehouse Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => {
          const isSelected = wh.id === selectedWhId;
          const totalUnits = getWarehouseStock(wh.id);
          const locCount = locations.filter((l) => l.warehouse_id === wh.id).length;

          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWhId(wh.id)}
              className={`p-5 rounded-2xl cursor-pointer border transition-all duration-200 ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isSelected
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <WarehouseIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{wh.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {wh.location || "Unspecified Location"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Capacity / Units</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 text-sm flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-indigo-500" /> {totalUnits.toLocaleString()} pcs
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Storage Bins</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 text-sm flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-emerald-500" /> {locCount} locations
                  </div>
                </div>
              </div>

              {(wh.manager_name || wh.contact_number) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  {wh.manager_name && (
                    <span className="flex items-center gap-1 truncate">
                      <User className="h-3 w-3" /> {wh.manager_name}
                    </span>
                  )}
                  {wh.contact_number && (
                    <span className="flex items-center gap-1 truncate font-mono">
                      <Phone className="h-3 w-3" /> {wh.contact_number}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Warehouse Details & Bin Mapping */}
      {activeWarehouse && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeWarehouse.name}</span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeLocations.length} Storage Bins
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed inventory allotment by rack, shelf, and zone
              </p>
            </div>
          </div>

          <div className="p-6">
            {activeLocations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No storage locations defined for this warehouse.</p>
                {canEdit && (
                  <button
                    onClick={() => {
                      setLocWhId(activeWarehouse.id);
                      setShowAddLoc(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add First Bin
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLocations.map((loc) => {
                  const itemsInLoc = inventory.filter((i) => i.location_id === loc.id);
                  const totalLocUnits = itemsInLoc.reduce((s, i) => s + (i.quantity || 0), 0);

                  return (
                    <div
                      key={loc.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-emerald-500" />
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{loc.name}</h4>
                        </div>
                        <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          {totalLocUnits} units
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {itemsInLoc.slice(0, 4).map((item) => (
                          <div
                            key={item.product_id}
                            className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
                          >
                            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                              {item.product_name}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {item.quantity} pcs
                            </span>
                          </div>
                        ))}
                        {itemsInLoc.length > 4 && (
                          <div className="text-[11px] text-slate-400 text-center pt-1 font-medium">
                            +{itemsInLoc.length - 4} more items
                          </div>
                        )}
                        {itemsInLoc.length === 0 && (
                          <p className="text-xs text-slate-400 italic py-2 text-center">Empty location bin</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showAddWh && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Add New Warehouse</h3>
              <button onClick={() => setShowAddWh(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddWarehouse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Distribution Hub"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dallas, TX"
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={whManager}
                  onChange={(e) => setWhManager(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={whContact}
                  onChange={(e) => setWhContact(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddWh(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Add Storage Location</h3>
              <button onClick={() => setShowAddLoc(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse *
                </label>
                <select
                  required
                  value={locWhId}
                  onChange={(e) => setLocWhId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Bin Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rack C3, Shelf 4, Pallet Zone B"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddLoc(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
