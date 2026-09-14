import { useState, useEffect, type FormEvent } from "react";
import { fetchApi } from "../lib/api";
import { Truck, Plus, Search, Mail, Phone, MapPin, Edit2, Trash2, ArrowUpRight, X, Package } from "lucide-react";
import { showToast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  const loadSuppliers = () => {
    setLoading(true);
    fetchApi("/suppliers")
      .then(setSuppliers)
      .catch((err) => {
        console.error("Failed to load suppliers:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (s: any) => {
    setEditingSupplier(s);
    setName(s.name || "");
    setContactPerson(s.contact_person || "");
    setEmail(s.email || "");
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setNotes(s.notes || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      contact_person: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      if (editingSupplier) {
        await fetchApi(`/suppliers/${editingSupplier.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Supplier updated successfully", "success");
      } else {
        await fetchApi("/suppliers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Supplier added to directory", "success");
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err: any) {
      showToast(err.message || "Failed to save supplier", "error");
    }
  };

  const handleDelete = async (id: number, suppName: string) => {
    if (!window.confirm(`Are you sure you want to remove supplier '${suppName}'?`)) return;

    try {
      await fetchApi(`/suppliers/${id}`, { method: "DELETE" });
      showToast("Supplier removed", "success");
      loadSuppliers();
    } catch (err: any) {
      showToast(err.message || "Failed to delete supplier", "error");
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Supplier & Vendor Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Approved supply chain vendors, contacts, and procurement channels
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        )}
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> active vendors
        </div>
      </div>

      {/* Suppliers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{s.name}</h3>
                    {s.contact_person && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Contact: {s.contact_person}
                      </p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {s.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${s.email}`} className="hover:underline text-indigo-600 dark:text-indigo-400 truncate">
                      {s.email}
                    </a>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start gap-2 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
                {s.notes && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{s.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Package className="h-3.5 w-3.5 text-emerald-500" />
                {s.product_count || 0} catalog SKUs
              </span>
              <button
                onClick={() => navigate("/receipts")}
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Inbound Receipt <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          <Truck className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No suppliers match your search filter.</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Tech Hardware"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Vance"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="orders@supplier.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Facility Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100 Industrial Pkwy, San Jose, CA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Terms & Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Payment terms, lead time, shipment schedules..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
