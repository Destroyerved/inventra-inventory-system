import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Scan, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Tag, 
  Package, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Printer, 
  Plus, 
  Minus, 
  ChevronRight, 
  RefreshCw, 
  Building2, 
  ArrowLeft,
  Camera,
  Check
} from "lucide-react";
import { fetchApi } from "../lib/api";
import { showToast } from "../components/Toast";
import BarcodeScanner from "../components/BarcodeScanner";

// Audio & Haptic Feedback Synthesizer (Web Audio API - zero external assets needed)
function playAudioFeedback(type: "success" | "error") {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // High-pitch dual chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
      if ("vibrate" in navigator) navigator.vibrate([40]);
    } else {
      // Low buzz error tone
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
    }
  } catch (e) {
    // Ignore audio errors on un-interacted documents
  }
}

export default function MobileTerminal() {
  const [activeTab, setActiveTab] = useState<"scan" | "receiving" | "picking" | "tagging">("scan");
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string>("");
  const [matchedProduct, setMatchedProduct] = useState<any | null>(null);

  // Receiving state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptScanCounts, setReceiptScanCounts] = useState<{ [productId: number]: number }>({});

  // Picking state
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [pickedCounts, setPickedCounts] = useState<{ [productId: number]: number }>({});

  // Cycle count adjustment state
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("Cycle count discrepancy");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Tagging state
  const [taggingProduct, setTaggingProduct] = useState<any | null>(null);

  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi("/products"),
      fetchApi("/inventory"),
      fetchApi("/settings/locations"),
      fetchApi("/operations"),
    ])
      .then(([prods, inv, locs, ops]) => {
        setProducts(prods);
        setInventory(inv);
        setLocations(locs);
        setOperations(ops);
        if (prods.length > 0 && !taggingProduct) {
          setTaggingProduct(prods[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load terminal data:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Process a scanned barcode string
  const handleBarcodeDecoded = (decoded: string) => {
    setIsScanning(false);
    setScannedResult(decoded);

    const term = decoded.trim().toLowerCase();
    const product = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === term) ||
        p.sku.toLowerCase() === term ||
        p.id.toString() === term ||
        p.name.toLowerCase() === term
    );

    if (product) {
      playAudioFeedback("success");
      setMatchedProduct(product);

      if (activeTab === "receiving" && selectedReceipt) {
        // Increment received line
        const line = selectedReceipt.lines?.find((l: any) => l.product_id === product.id);
        if (line) {
          setReceiptScanCounts((prev) => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1,
          }));
          showToast(`Scanned: ${product.name} (+1)`, "success");
        } else {
          playAudioFeedback("error");
          showToast(`Warning: SKU ${product.sku} not in this PO!`, "error");
        }
      } else if (activeTab === "picking" && selectedDelivery) {
        // Increment picked line
        const line = selectedDelivery.lines?.find((l: any) => l.product_id === product.id);
        if (line) {
          setPickedCounts((prev) => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1,
          }));
          showToast(`Picked: ${product.name} (+1)`, "success");
        } else {
          playAudioFeedback("error");
          showToast(`Error: ${product.sku} is not part of this order!`, "error");
        }
      } else if (activeTab === "tagging") {
        setTaggingProduct(product);
        showToast(`Loaded label for ${product.name}`, "info");
      } else {
        showToast(`Located SKU: ${product.name}`, "success");
      }
    } else {
      playAudioFeedback("error");
      setMatchedProduct(null);
      showToast(`No item found matching barcode: ${decoded}`, "warning");
    }
  };

  // Perform quick inventory cycle count adjustment
  const handleQuickAdjust = async (delta: number) => {
    if (!matchedProduct) return;
    setIsAdjusting(true);

    try {
      const defaultLocId = locations[0]?.id || 1;
      await fetchApi("/operations", {
        method: "POST",
        body: JSON.stringify({
          type: "adjustment",
          source_location_id: defaultLocId,
          date: new Date().toISOString(),
          status: "done",
          notes: `Floor Terminal Spot Audit: ${adjustReason}`,
          lines: [{ product_id: matchedProduct.id, quantity: delta }],
        }),
      });

      playAudioFeedback("success");
      showToast(`Adjusted ${matchedProduct.sku} count by ${delta > 0 ? "+" : ""}${delta}`, "success");
      loadData();
    } catch (err: any) {
      playAudioFeedback("error");
      showToast(err.message || "Failed to adjust inventory", "error");
    } finally {
      setIsAdjusting(false);
    }
  };

  // Post Inbound Receipt as Done
  const handleCompleteReceipt = async () => {
    if (!selectedReceipt) return;
    try {
      await fetchApi(`/operations/${selectedReceipt.id}/validate`, {
        method: "POST",
      });
      playAudioFeedback("success");
      showToast(`Receipt ${selectedReceipt.reference} posted into ledger!`, "success");
      setSelectedReceipt(null);
      loadData();
    } catch (err: any) {
      playAudioFeedback("error");
      showToast(err.message || "Failed to post receipt", "error");
    }
  };

  // Post Outbound Delivery as Done
  const handleCompleteDelivery = async () => {
    if (!selectedDelivery) return;
    try {
      await fetchApi(`/operations/${selectedDelivery.id}/validate`, {
        method: "POST",
      });
      playAudioFeedback("success");
      showToast(`Delivery ${selectedDelivery.reference} marked dispatched!`, "success");
      setSelectedDelivery(null);
      loadData();
    } catch (err: any) {
      playAudioFeedback("error");
      showToast(err.message || "Failed to dispatch order", "error");
    }
  };

  // Trigger thermal label print
  const handlePrintLabel = () => {
    window.print();
  };

  const draftReceipts = operations.filter((op) => op.type === "receipt" && op.status !== "done");
  const draftDeliveries = operations.filter((op) => op.type === "delivery" && op.status !== "done");

  const getProductStock = (prodId: number) => {
    return inventory
      .filter((i) => i.product_id === prodId)
      .reduce((sum, i) => sum + (i.quantity || 0), 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-20">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link to="/" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-sm font-bold tracking-tight text-white">Inventra Floor Terminal</h1>
            </div>
            <p className="text-[10px] text-slate-400">Warehouse Mobile Scanner · Live</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg transition-transform"
          >
            <Camera className="h-4 w-4" /> Scan
          </button>
        </div>
      </header>

      {/* Main Mode Viewport */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* TAB 1: SCAN & AUDIT HUD */}
        {activeTab === "scan" && (
          <div className="space-y-4">
            {/* Camera Trigger Card */}
            <div 
              onClick={() => setIsScanning(true)}
              className="p-5 bg-gradient-to-br from-slate-900 to-slate-900/60 rounded-2xl border-2 border-dashed border-slate-700 active:border-emerald-500 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
            >
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl mb-2">
                <Scan className="h-8 w-8" />
              </div>
              <span className="text-sm font-bold text-white">Tap to Scan SKU or Bin</span>
              <span className="text-xs text-slate-400 mt-0.5">Supports 1D Code 128, EAN, UPC & 2D QR</span>
            </div>

            {/* Quick Barcode Manual Entry */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or type SKU / Barcode..."
                value={scannedResult}
                onChange={(e) => setScannedResult(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBarcodeDecoded(scannedResult);
                }}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                onClick={() => handleBarcodeDecoded(scannedResult)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-semibold rounded-xl border border-slate-700"
              >
                Lookup
              </button>
            </div>

            {/* Active SKU HUD Telemetry Card */}
            {matchedProduct ? (
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      {matchedProduct.category || "General SKU"}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{matchedProduct.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">SKU: {matchedProduct.sku}</p>
                    {matchedProduct.barcode && (
                      <p className="text-[11px] text-slate-500 font-mono">Barcode: {matchedProduct.barcode}</p>
                    )}
                  </div>
                  <span className="text-xl font-bold text-white font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    {getProductStock(matchedProduct.id)} pcs
                  </span>
                </div>

                {/* Stock Health Progress */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Unit Cost</span>
                    <p className="font-bold text-white">${matchedProduct.cost?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Min Safety Stock</span>
                    <p className="font-bold text-amber-400">{matchedProduct.reorder_level || 10} units</p>
                  </div>
                </div>

                {/* Quick Floor Cycle Count Adjuster */}
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    Quick Spot Count / Discrepancy Reconciliation
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleQuickAdjust(-1)}
                      disabled={isAdjusting}
                      className="py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Minus className="h-3 w-3" /> 1
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(-5)}
                      disabled={isAdjusting}
                      className="py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Minus className="h-3 w-3" /> 5
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(1)}
                      disabled={isAdjusting}
                      className="py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Plus className="h-3 w-3" /> 1
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(5)}
                      disabled={isAdjusting}
                      className="py-2.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Plus className="h-3 w-3" /> 5
                    </button>
                  </div>
                </div>

                {/* Instant Print Button */}
                <button
                  onClick={() => {
                    setTaggingProduct(matchedProduct);
                    setActiveTab("tagging");
                  }}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Tag className="h-4 w-4 text-emerald-400" />
                  Print Adhesive Shelf Label
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Scan or enter any product SKU to view live warehouse telemetry.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RECEIVING DOCK (GOODS IN) */}
        {activeTab === "receiving" && (
          <div className="space-y-4">
            {!selectedReceipt ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Pending Inbound POs ({draftReceipts.length})
                  </h3>
                  <button onClick={loadData} className="p-1 text-slate-400 hover:text-white">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {draftReceipts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                    No pending inbound shipments scheduled.
                  </div>
                ) : (
                  draftReceipts.map((rcpt) => (
                    <div
                      key={rcpt.id}
                      onClick={() => {
                        setSelectedReceipt(rcpt);
                        setReceiptScanCounts({});
                      }}
                      className="p-4 bg-slate-900 hover:bg-slate-850 active:scale-[0.99] rounded-2xl border border-slate-800 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{rcpt.reference}</span>
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800/60 font-semibold">
                            {rcpt.lines?.length || 0} line items
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {rcpt.contact || "Standard Supplier"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Active Receiving PO Intake Screen */
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Active Intake Bay
                    </span>
                    <h3 className="font-bold text-white text-base">{selectedReceipt.reference}</h3>
                    <p className="text-xs text-slate-400">{selectedReceipt.contact}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Scan Barcode Button */}
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  Scan Incoming Package Barcode
                </button>

                {/* Line Items Checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Expected Line Items
                  </span>
                  {selectedReceipt.lines?.map((line: any) => {
                    const scanned = receiptScanCounts[line.product_id] || 0;
                    const isFulfilled = scanned >= line.quantity;

                    return (
                      <div
                        key={line.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isFulfilled
                            ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div>
                          <span className="font-bold block text-white text-sm">{line.product_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{line.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold font-mono">
                            {scanned} / {line.quantity}
                          </span>
                          <span className="text-[10px] text-slate-500 block">units</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Complete Intake Action */}
                <button
                  onClick={handleCompleteReceipt}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Validate & Post Goods Receipt
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GUIDED PICK & PACK (GOODS OUT) */}
        {activeTab === "picking" && (
          <div className="space-y-4">
            {!selectedDelivery ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Dispatch Picking Queue ({draftDeliveries.length})
                  </h3>
                  <button onClick={loadData} className="p-1 text-slate-400 hover:text-white">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {draftDeliveries.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="h-8 w-8 text-indigo-500 mx-auto mb-2 opacity-50" />
                    All delivery pick tasks completed.
                  </div>
                ) : (
                  draftDeliveries.map((deliv) => (
                    <div
                      key={deliv.id}
                      onClick={() => {
                        setSelectedDelivery(deliv);
                        setPickedCounts({});
                      }}
                      className="p-4 bg-slate-900 hover:bg-slate-850 active:scale-[0.99] rounded-2xl border border-slate-800 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{deliv.reference}</span>
                          <span className="text-[10px] bg-indigo-950/80 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-800/60 font-semibold">
                            {deliv.lines?.length || 0} items to pick
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Recipient: {deliv.contact || "Customer Dispatch"}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Active Guided Pick Sequence */
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                      Active Pick Task
                    </span>
                    <h3 className="font-bold text-white text-base">{selectedDelivery.reference}</h3>
                    <p className="text-xs text-slate-400">{selectedDelivery.contact}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Scan Barcode To Confirm Pick */}
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  Scan SKU to Confirm Pick
                </button>

                {/* Pick Items List with Suggested Bin */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Pick Sequence (Aisle Sorted)
                  </span>
                  {selectedDelivery.lines?.map((line: any, idx: number) => {
                    const picked = pickedCounts[line.product_id] || 0;
                    const isDone = picked >= line.quantity;

                    return (
                      <div
                        key={line.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                          isDone
                            ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold block text-white text-sm">{line.product_name}</span>
                            <span className="text-[11px] text-indigo-400 font-semibold">
                              Location: Rack A-0{((idx % 3) + 1)} · Shelf 2
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-bold font-mono">
                            {picked} / {line.quantity}
                          </span>
                          <span className="text-[10px] text-slate-500 block">picked</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Finish Dispatch */}
                <button
                  onClick={handleCompleteDelivery}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Confirm All Picked & Dispatch
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MOBILE TAG & LABEL PRINT HUB */}
        {activeTab === "tagging" && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Select Product to Tag
              </label>
              <select
                value={taggingProduct?.id || ""}
                onChange={(e) => {
                  const p = products.find((prod) => prod.id === Number(e.target.value));
                  if (p) setTaggingProduct(p);
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Thermal Sticker Preview (2" x 1" / 3" x 2" standard) */}
            {taggingProduct && (
              <div className="bg-white text-black p-4 rounded-xl shadow-2xl space-y-3 font-mono border-2 border-slate-300">
                <div className="flex items-start justify-between border-b pb-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      INVENTRA WAREHOUSE ASSET TAG
                    </div>
                    <div className="font-bold text-base leading-tight text-black mt-0.5">
                      {taggingProduct.name}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">SKU: {taggingProduct.sku}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">
                      ${taggingProduct.price || "0.00"}
                    </span>
                  </div>
                </div>

                {/* Simulated High-Res Vector Barcode */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="flex items-center justify-center gap-[2px] h-14 w-full px-2">
                    {[...Array(38)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{
                          width: `${(i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5)}px`,
                          opacity: i % 7 === 0 ? 0 : 1,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold tracking-widest mt-1 text-black">
                    *{taggingProduct.barcode || taggingProduct.sku}*
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 border-t pt-1.5">
                  <span>Bin: Zone 01 · Aisle A</span>
                  <span>Origin: Main Facility</span>
                </div>
              </div>
            )}

            <button
              onClick={handlePrintLabel}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Thermal Label (Bluetooth / Network)
            </button>
          </div>
        )}
      </main>

      {/* Floating Barcode Scanner Modal */}
      {isScanning && (
        <BarcodeScanner
          onScan={handleBarcodeDecoded}
          onClose={() => setIsScanning(false)}
        />
      )}

      {/* Bottom Ergonomic Navigation Dock (Designed for thumbs / single-hand grip) */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 flex items-center justify-around py-2 px-3">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === "scan" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scan className="h-5 w-5" />
          <span className="text-[10px]">Scan & Audit</span>
        </button>

        <button
          onClick={() => setActiveTab("receiving")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors relative ${
            activeTab === "receiving" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowDownToLine className="h-5 w-5" />
          <span className="text-[10px]">Receiving</span>
          {draftReceipts.length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("picking")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors relative ${
            activeTab === "picking" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowUpFromLine className="h-5 w-5" />
          <span className="text-[10px]">Picking</span>
          {draftDeliveries.length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-indigo-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("tagging")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === "tagging" ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Tag className="h-5 w-5" />
          <span className="text-[10px]">Tag & Print</span>
        </button>
      </nav>
    </div>
  );
}
