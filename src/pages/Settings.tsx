import React, { useState, useEffect } from "react";
import { fetchApi } from "../lib/api";
import { Settings as SettingsIcon, Plus, Building2, MapPin, Users, Edit2, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";
import UserModal from "../components/UserModal";

export default function Settings() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newWarehouse, setNewWarehouse] = useState({ name: "", code: "" });
  const [newLocation, setNewLocation] = useState({ name: "", type: "internal", warehouse_id: "" });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const { user } = useAuthStore();
  const canEdit = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (canEdit) {
      loadData();
    }
  }, [canEdit]);

  if (!canEdit) {
    return <Navigate to="/" replace />;
  }

  const loadData = async () => {
    try {
      const promises = [
        fetchApi("/inventory/warehouses"),
        fetchApi("/inventory/locations")
      ];
      
      if (isAdmin) {
        promises.push(fetchApi("/auth/users"));
      }
      
      const results = await Promise.all(promises);
      setWarehouses(results[0]);
      setLocations(results[1]);
      
      if (isAdmin && results[2]) {
        setUsers(results[2]);
      }
      
      if (results[0].length > 0) {
        setNewLocation(prev => ({ ...prev, warehouse_id: results[0][0].id.toString() }));
      }
    } catch (error) {
      console.error("Failed to load settings data", error);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi("/inventory/warehouses", {
        method: "POST",
        body: JSON.stringify(newWarehouse),
      });
      setNewWarehouse({ name: "", code: "" });
      loadData();
    } catch (error) {
      console.error("Failed to add warehouse", error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi("/inventory/locations", {
        method: "POST",
        body: JSON.stringify({
          ...newLocation,
          warehouse_id: parseInt(newLocation.warehouse_id)
        }),
      });
      setNewLocation(prev => ({ ...prev, name: "" }));
      loadData();
    } catch (error) {
      console.error("Failed to add location", error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetchApi(`/auth/users/${id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== id));
    } catch (error: any) {
      alert(error.message || "Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Warehouses</h2>
          </div>

          <form onSubmit={handleAddWarehouse} className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Warehouse Name"
              required
              value={newWarehouse.name}
              onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <input
              type="text"
              placeholder="Code (e.g., WH)"
              required
              value={newWarehouse.code}
              onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
              className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <button type="submit" className="flex items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
              <Plus className="h-5 w-5" />
            </button>
          </form>

          <div className="space-y-3">
            {warehouses.map((wh) => (
              <div key={wh.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-900 dark:text-white">{wh.name}</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">{wh.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Locations</h2>
          </div>

          <form onSubmit={handleAddLocation} className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Location Name (e.g., Stock, Shelf A)"
                required
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <select
                value={newLocation.type}
                onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="internal">Internal</option>
                <option value="supplier">Supplier</option>
                <option value="customer">Customer</option>
                <option value="inventory">Inventory</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div className="flex gap-4">
              <select
                required
                value={newLocation.warehouse_id}
                onChange={(e) => setNewLocation({ ...newLocation, warehouse_id: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="" disabled>Select Warehouse</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
              <button type="submit" className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm font-medium">
                Add Location
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{loc.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{loc.warehouse_name}</div>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md capitalize">{loc.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users (Admin Only) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">User Management</h2>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shrink-0"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Login ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{u.login_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                          u.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setShowUserModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          disabled={u.id === user?.id}
                        >
                          <Trash2 className={`h-4 w-4 ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowUserModal(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
