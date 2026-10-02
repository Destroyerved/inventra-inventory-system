import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { Plus, Search, Edit2, Trash2, Download, Barcode as BarcodeIcon, Truck, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import BarcodeGeneratorModal from "../components/BarcodeGeneratorModal";
import { showToast } from "../components/Toast";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<any>(null);

  const { user } = useAuthStore();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    fetchApi("/products")
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load products:", err);
      });
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (!window.confirm(`Are you sure you want to delete product '${prodName}'?`)) return;
    try {
      await fetchApi(`/products/${id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p.id !== id));
      showToast("Product deleted successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to delete product", "error");
    }
  };

  const handleExportCsv = () => {
    if (products.length === 0) {
      showToast("No products to export", "warning");
      return;
    }

    const headers = "Name,SKU,Barcode,Category,Price,Cost,Stock,UOM,Supplier\n";
    const rows = products.map((p) => 
      `"${p.name}","${p.sku}","${p.barcode || ''}","${p.category_name || ''}",${p.price || 0},${p.cost || 0},${p.total_stock || 0},"${p.uom || 'pcs'}","${p.supplier || ''}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventra_catalog_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Product catalog exported to CSV", "success");
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
    (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Product Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Master SKU directory, inventory cost accounting, and supplier routing
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> New Product
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="block w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
              placeholder="Search products by name, SKU, barcode, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {filteredProducts.length} Products Found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">SKU</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Supplier</th>
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4 text-center">Total Stock</th>
                <th className="px-6 py-4 text-center">Barcode</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      {product.description && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal truncate max-w-xs">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {product.category_name || "General"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                    {product.supplier || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-900 dark:text-white">
                    ${(product.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-500 dark:text-slate-400">
                    ${(product.cost || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        product.total_stock <= 0
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                          : product.total_stock <= product.reorder_level
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {product.total_stock || 0} {product.uom || "pcs"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedBarcodeProduct({
                        name: product.name,
                        sku: product.sku,
                        barcode: product.barcode || product.sku,
                        price: product.price,
                        uom: product.uom,
                      })}
                      title="Print Barcode Tag"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <BarcodeIcon className="h-4 w-4" />
                    </button>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 p-1 rounded"
                        title="Edit Product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 p-1 rounded"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSave={loadProducts}
        />
      )}

      {/* Barcode & Label Modal */}
      <BarcodeGeneratorModal
        product={selectedBarcodeProduct}
        isOpen={!!selectedBarcodeProduct}
        onClose={() => setSelectedBarcodeProduct(null)}
      />
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: any) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [uom, setUom] = useState(product?.uom || "pcs");
  const [reorderLevel, setReorderLevel] = useState(product?.reorder_level || 0);
  const [price, setPrice] = useState(product?.price || 0);
  const [cost, setCost] = useState(product?.cost || 0);
  const [description, setDescription] = useState(product?.description || "");
  const [barcode, setBarcode] = useState(product?.barcode || "");
  const [supplier, setSupplier] = useState(product?.supplier || "");
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  useEffect(() => {
    fetchApi("/suppliers")
      .then(setSuppliersList)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        sku,
        uom,
        reorder_level: reorderLevel,
        price,
        cost,
        description,
        barcode: barcode || sku,
        supplier,
      };

      if (product) {
        await fetchApi(`/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Product updated successfully", "success");
      } else {
        await fetchApi("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("New product created", "success");
      }
      onSave();
      onClose();
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 mx-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {product ? "Edit Product" : "Add New Product"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
              <input
                required
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Barcode</label>
              <input
                type="text"
                placeholder="Optional (defaults to SKU)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier / Vendor</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Apex Tech Hardware"
                list="suppliers-datalist"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <datalist id="suppliers-datalist">
                {suppliersList.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Selling Price ($)</label>
              <input
                required
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Cost ($)</label>
              <input
                required
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure (UOM)</label>
              <input
                required
                type="text"
                placeholder="pcs, boxes, kg"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reorder Safety Level</label>
              <input
                required
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
