import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { user } = useAuthStore();
  const canEdit = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    fetchApi("/products").then(setProducts).catch(console.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetchApi(`/products/${id}`, { method: "DELETE" });
      setProducts(products.filter(p => p.id !== id));
    } catch (error: any) {
      alert(error.message || "Failed to delete product");
    }
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Product
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">UOM</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      {product.description && <span className="text-xs text-slate-500 font-normal">{product.description}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.barcode || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.category_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${(product.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${(product.cost || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-semibold">
                    <span className={product.total_stock <= product.reorder_level ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {product.total_stock || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{product.uom}</td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSave={loadProducts}
        />
      )}
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (product) {
        await fetchApi(`/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify({ name, sku, uom, reorder_level: reorderLevel, price, cost, description, barcode, supplier }),
        });
      } else {
        await fetchApi("/products", {
          method: "POST",
          body: JSON.stringify({ name, sku, uom, reorder_level: reorderLevel, price, cost, description, barcode, supplier }),
        });
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 mx-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
          {product ? "Edit Product" : "Add New Product"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">SKU</label>
              <input required type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Barcode</label>
              <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Supplier</label>
            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Price ($)</label>
              <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cost ($)</label>
              <input required type="number" step="0.01" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">UOM</label>
              <input required type="text" value={uom} onChange={(e) => setUom(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reorder Level</label>
              <input required type="number" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value))} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white dark:bg-slate-800 py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
