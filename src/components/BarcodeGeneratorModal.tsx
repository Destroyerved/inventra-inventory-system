import { useState, useRef } from "react";
import { X, Printer, Download, Copy, Check, Barcode as BarcodeIcon } from "lucide-react";
import { showToast } from "./Toast";

interface BarcodeProduct {
  name: string;
  sku: string;
  barcode?: string;
  price?: number;
  uom?: string;
}

interface BarcodeGeneratorModalProps {
  product: BarcodeProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

// Deterministic pseudo-barcode SVG pattern generator from text
function renderSvgBarcode(code: string) {
  // Generate a pattern of varying bar widths based on char codes
  const bars: { width: number; isSpace: boolean }[] = [];
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed += code.charCodeAt(i) * (i + 1);
  }

  // Start guard
  bars.push({ width: 3, isSpace: false });
  bars.push({ width: 2, isSpace: true });
  bars.push({ width: 2, isSpace: false });

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = (charCode % 3) + 1;
    const s1 = ((charCode >> 1) % 3) + 1;
    const w2 = ((charCode >> 2) % 3) + 1;
    const s2 = ((charCode >> 3) % 2) + 1;
    bars.push({ width: w1, isSpace: false });
    bars.push({ width: s1, isSpace: true });
    bars.push({ width: w2, isSpace: false });
    bars.push({ width: s2, isSpace: true });
  }

  // End guard
  bars.push({ width: 3, isSpace: false });
  bars.push({ width: 2, isSpace: true });
  bars.push({ width: 3, isSpace: false });

  const totalWidth = bars.reduce((sum, b) => sum + b.width * 2, 0);

  let currentX = 10;
  return (
    <svg viewBox={`0 0 ${totalWidth + 20} 80`} className="w-full h-24 max-w-sm mx-auto">
      <rect width="100%" height="100%" fill="white" />
      {bars.map((bar, idx) => {
        const x = currentX;
        currentX += bar.width * 2;
        if (bar.isSpace) return null;
        return (
          <rect
            key={idx}
            x={x}
            y={8}
            width={bar.width * 2}
            height={55}
            fill="#0f172a"
          />
        );
      })}
      <text
        x={(totalWidth + 20) / 2}
        y={74}
        textAnchor="middle"
        fontSize="12"
        fontFamily="monospace"
        fontWeight="600"
        fill="#334155"
      >
        {code}
      </text>
    </svg>
  );
}

export default function BarcodeGeneratorModal({ product, isOpen, onClose }: BarcodeGeneratorModalProps) {
  const [copies, setCopies] = useState(8);
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !product) return null;

  const barcodeValue = product.barcode || product.sku;

  const handleCopy = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    showToast("Barcode copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Printable Area - Controlled by CSS @media print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-label-sheet, #printable-label-sheet * {
            visibility: visible;
          }
          #printable-label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <BarcodeIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Barcode & Shelf Labels</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate, copy, and print warehouse tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Main Barcode Card */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product Name</span>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">{product.name}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                SKU: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{product.sku}</span>
                {product.price !== undefined && (
                  <span className="ml-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    ${product.price.toFixed(2)} / {product.uom || "pcs"}
                  </span>
                )}
              </p>
            </div>

            {/* SVG Render */}
            <div className="bg-white p-4 rounded-lg shadow-inner max-w-sm mx-auto my-4 border border-slate-200">
              {renderSvgBarcode(barcodeValue)}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>
          </div>

          {/* Printable Sheet Options */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <div>
              <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Printable Label Grid</h5>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Format multiple sticker labels on standard paper</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Labels:</label>
              <select
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="px-2.5 py-1 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={1}>1 Label</option>
                <option value={4}>4 Labels</option>
                <option value={8}>8 Labels (Standard sheet)</option>
                <option value={16}>16 Labels (Compact sheet)</option>
              </select>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print Now
              </button>
            </div>
          </div>

          {/* Hidden Container for Print Media */}
          <div id="printable-label-sheet" className="hidden print:grid print:grid-cols-2 print:gap-4">
            {Array.from({ length: copies }).map((_, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-slate-400 p-4 text-center rounded-lg page-break-inside-avoid"
              >
                <div className="text-xs font-bold uppercase">{product.name}</div>
                <div className="text-[10px] text-slate-600">SKU: {product.sku}</div>
                {renderSvgBarcode(barcodeValue)}
                {product.price !== undefined && (
                  <div className="text-xs font-bold text-slate-800 mt-1">${product.price.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
