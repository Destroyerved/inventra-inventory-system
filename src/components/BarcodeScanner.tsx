import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onClose }: { onScan: (text: string) => void, onClose: () => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!document.getElementById('reader')) return;
    
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
        onScan(decodedText);
      },
      (error) => {
        // Ignore continuous scan errors
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scan Barcode/QR</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Close</button>
        </div>
        <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
        <p className="text-xs text-slate-500 mt-4 text-center">Point your camera at a product's SKU barcode or QR code.</p>
      </div>
    </div>
  );
}
