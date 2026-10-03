import { useState } from "react";
import { 
  X, 
  Smartphone, 
  Scan, 
  ArrowRight, 
  ExternalLink, 
  Volume2, 
  Vibrate, 
  Tag, 
  CheckCircle2, 
  Layers 
} from "lucide-react";
import { Link } from "react-router-dom";

interface MobileTerminalLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileTerminalLauncherModal({
  isOpen,
  onClose,
}: MobileTerminalLauncherModalProps) {
  const [showSimulatedFrame, setShowSimulatedFrame] = useState(false);

  if (!isOpen) return null;

  const mobileUrl = typeof window !== "undefined" ? `${window.location.origin}/mobile` : "/mobile";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Inventra Mobile Floor Terminal
              </h3>
              <p className="text-xs text-slate-500">
                Companion handheld scanner app for warehouse, dock & factory floor staff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Main 2-Col Split: QR on Left, Workflow Capabilities on Right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Scan QR code to launch on phone */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                Scan with Phone Camera
              </span>

              {/* High-Contrast Vector QR representation */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                <svg
                  className="w-40 h-40"
                  viewBox="0 0 256 256"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="256" height="256" fill="#ffffff" />
                  {/* Position squares */}
                  <rect x="24" y="24" width="64" height="64" rx="8" fill="#0f172a" />
                  <rect x="40" y="40" width="32" height="32" fill="#ffffff" />
                  <rect x="48" y="48" width="16" height="16" fill="#0f172a" />

                  <rect x="168" y="24" width="64" height="64" rx="8" fill="#0f172a" />
                  <rect x="184" y="40" width="32" height="32" fill="#ffffff" />
                  <rect x="192" y="48" width="16" height="16" fill="#0f172a" />

                  <rect x="24" y="168" width="64" height="64" rx="8" fill="#0f172a" />
                  <rect x="40" y="184" width="32" height="32" fill="#ffffff" />
                  <rect x="48" y="192" width="16" height="16" fill="#0f172a" />

                  {/* Matrix patterns */}
                  <rect x="104" y="32" width="16" height="48" fill="#0f172a" />
                  <rect x="136" y="40" width="16" height="16" fill="#0f172a" />
                  <rect x="32" y="104" width="48" height="16" fill="#0f172a" />
                  <rect x="104" y="104" width="48" height="48" rx="6" fill="#10b981" />
                  <rect x="168" y="104" width="32" height="16" fill="#0f172a" />
                  <rect x="216" y="104" width="16" height="32" fill="#0f172a" />
                  <rect x="104" y="168" width="16" height="48" fill="#0f172a" />
                  <rect x="136" y="184" width="32" height="16" fill="#0f172a" />
                  <rect x="184" y="168" width="48" height="16" fill="#0f172a" />
                  <rect x="184" y="200" width="32" height="32" fill="#0f172a" />
                </svg>
              </div>

              <span className="text-[11px] text-slate-500 mt-3 font-mono break-all max-w-[200px]">
                {mobileUrl}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero app store install required · Runs in any mobile browser
              </p>
            </div>

            {/* Right: Factory Site Features */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
                  <Scan className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Rapid Barcode & QR Camera Scanner
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Instantly resolves 1D barcodes (Code 128, EAN, UPC) and 2D QR codes using device cameras or rugged barcode sleds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Audio & Haptic Feedback for Noisy Floors
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Synthesizes 880Hz high chime on match and 220Hz buzz + tactile vibration on error to prevent mis-scans.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Dock Inbound Intake & Guided Picking
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Checklist mode for verifying incoming shipments and sequence-optimized picking routes for outgoing delivery orders.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 mt-0.5">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Mobile Bluetooth Thermal Tagging
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Print single adhesive asset labels on thermal printers (Zebra, Brother, Dymo) right from the mobile terminal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Tip: Save to Home Screen on iOS / Android for full-screen PWA experience
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Close
            </button>
            <Link
              to="/mobile"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Open Mobile Terminal <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
