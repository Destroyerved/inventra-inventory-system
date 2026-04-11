import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { Plus, Search, LayoutGrid, List as ListIcon, CheckCircle, FileText, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../components/Layout";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BarcodeScanner from "../components/BarcodeScanner";

export default function Operations({ type }: { type: "receipt" | "delivery" | "transfer" | "adjustment" }) {
  const [operations, setOperations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const fetchOperations = () => {
    fetchApi("/operations").then((data) => {
      setOperations(data.filter((op: any) => op.type === type));
    }).catch(console.error);
  };

  useEffect(() => {
    fetchOperations();
  }, [type]);

  const handleValidate = async (id: number) => {
    try {
      await fetchApi(`/operations/${id}/validate`, { method: "POST" });
      fetchOperations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const generatePDF = (op: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`Packing Slip: ${op.reference}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Type: ${op.type.toUpperCase()}`, 14, 32);
    doc.text(`Status: ${op.status.toUpperCase()}`, 14, 38);
    doc.text(`Date: ${format(new Date(op.date), "PPP p")}`, 14, 44);
    
    if (op.contact) doc.text(`Contact: ${op.contact}`, 14, 50);
    if (op.source_location_name) doc.text(`Source: ${op.source_location_name}`, 14, 56);
    if (op.dest_location_name) doc.text(`Destination: ${op.dest_location_name}`, 14, 62);
    if (op.shipping_method) doc.text(`Shipping: ${op.shipping_method}`, 14, 68);
    if (op.tracking_number) doc.text(`Tracking: ${op.tracking_number}`, 14, 74);

    const tableData = op.lines.map((l: any) => [
      l.product_name,
      l.sku,
      l.quantity.toString()
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Product', 'SKU', 'Quantity']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`${op.reference}.pdf`);
  };

  const title = type === 'delivery' ? 'Deliveries' : type.charAt(0).toUpperCase() + type.slice(1) + "s";

  const filteredOps = operations.filter((op: any) => {
    const term = search.toLowerCase();
    return (
      (op.reference || "").toLowerCase().includes(term) ||
      (op.contact || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn("p-1.5 rounded-md transition-colors", viewMode === "kanban" ? "bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shrink-0"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  {type !== "receipt" && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source</th>}
                  {type !== "delivery" && type !== "adjustment" && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {filteredOps.map((op: any) => (
                  <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{op.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{op.contact || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{op.scheduled_date ? format(new Date(op.scheduled_date), "MMM d, yyyy") : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("px-2 inline-flex text-xs leading-5 font-semibold rounded-full", op.status === 'done' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400")}>
                        {op.status}
                      </span>
                    </td>
                    {type !== "receipt" && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{op.source_location_name}</td>}
                    {type !== "delivery" && type !== "adjustment" && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{op.dest_location_name}</td>}
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {op.lines.map((l: any) => (
                        <div key={l.id}>{l.product_name} x {l.quantity}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col items-end gap-2">
                        {op.status === 'draft' && (
                          <button onClick={() => handleValidate(op.id)} className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Validate
                          </button>
                        )}
                        <button onClick={() => generatePDF(op)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center">
                          <FileText className="h-4 w-4 mr-1" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {['draft', 'done'].map(status => (
            <div key={status} className="flex-none w-80 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 capitalize flex items-center justify-between">
                {status}
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-0.5 px-2 rounded-full text-xs">
                  {filteredOps.filter((o: any) => o.status === status).length}
                </span>
              </h3>
              <div className="space-y-3">
                {filteredOps.filter((o: any) => o.status === status).map((op: any) => (
                  <div key={op.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-slate-900 dark:text-white">{op.reference}</span>
                      <div className="flex gap-2">
                        {op.status === 'draft' && (
                          <button onClick={() => handleValidate(op.id)} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Validate</button>
                        )}
                        <button onClick={() => generatePDF(op)} className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded flex items-center">
                          <FileText className="h-3 w-3 mr-1" /> PDF
                        </button>
                      </div>
                    </div>
                    {op.contact && <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">{op.contact}</div>}
                    <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                      {op.scheduled_date ? format(new Date(op.scheduled_date), "MMM d, yyyy") : "No date"}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {op.lines.length} items
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewOperationModal type={type} onClose={() => setShowModal(false)} onAdd={() => { setShowModal(false); fetchOperations(); }} />}
    </div>
  );
}

function NewOperationModal({ type, onClose, onAdd }: any) {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [contact, setContact] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: 1 }]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchApi("/inventory/locations").then(setLocations).catch(console.error);
    fetchApi("/products").then(setProducts).catch(console.error);
  }, []);

  const handleScan = (sku: string) => {
    setShowScanner(false);
    const product = products.find((p: any) => p.sku === sku);
    if (product) {
      const existingLineIndex = lines.findIndex(l => l.product_id === product.id.toString());
      if (existingLineIndex >= 0) {
        const newLines = [...lines];
        newLines[existingLineIndex].quantity += 1;
        setLines(newLines);
      } else {
        if (lines.length === 1 && !lines[0].product_id) {
          setLines([{ product_id: product.id.toString(), quantity: 1 }]);
        } else {
          setLines([...lines, { product_id: product.id.toString(), quantity: 1 }]);
        }
      }
    } else {
      alert(`Product not found with SKU: ${sku}`);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        type,
        date: new Date().toISOString(),
        scheduled_date: scheduledDate || null,
        contact: contact || null,
        source_location_id: sourceId || null,
        dest_location_id: destId || null,
        notes: notes || null,
        tracking_number: trackingNumber || null,
        shipping_method: shippingMethod || null,
        status: 'draft',
        lines: lines.map(l => ({ ...l, quantity: Number(l.quantity) }))
      };
      await fetchApi("/operations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onAdd();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto mx-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">New {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact (Supplier/Customer)</label>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled Date</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
            {type !== "receipt" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Source Location</label>
                <select required value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  <option value="">Select location</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.warehouse_name} - {l.name}</option>)}
                </select>
              </div>
            )}
            {type !== "delivery" && type !== "adjustment" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Destination Location</label>
                <select required value={destId} onChange={(e) => setDestId(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  <option value="">Select location</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.warehouse_name} - {l.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shipping Method</label>
              <input type="text" value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="e.g., FedEx, UPS, Local Courier" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tracking Number</label>
              <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes / Remarks</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 block w-full border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Products</label>
                <button type="button" onClick={() => setShowScanner(true)} className="text-sm flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md transition-colors">
                  <ScanLine className="h-4 w-4 mr-1" /> Scan Barcode
                </button>
              </div>
              <button type="button" onClick={() => setLines([...lines, { product_id: "", quantity: 1 }])} className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium">Add Line</button>
            </div>
            {lines.map((line, index) => (
              <div key={index} className="flex gap-4 mb-2">
                <select required value={line.product_id} onChange={(e) => {
                  const newLines = [...lines];
                  newLines[index].product_id = e.target.value;
                  setLines(newLines);
                }} className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  <option value="">Select product</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
                <input required type="number" value={line.quantity} onChange={(e) => {
                  const newLines = [...lines];
                  newLines[index].quantity = Number(e.target.value);
                  setLines(newLines);
                }} className="w-32 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Qty" />
                <button type="button" onClick={() => setLines(lines.filter((_, i) => i !== index))} className="text-red-500 dark:text-red-400 hover:text-red-700">Remove</button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white dark:bg-slate-800 py-2 px-4 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">Save as Draft</button>
          </div>
        </form>
        {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      </div>
    </div>
  );
}
