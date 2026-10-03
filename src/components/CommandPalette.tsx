import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Truck, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  Settings2, 
  History, 
  DollarSign, 
  BarChart2, 
  Sun, 
  Moon, 
  Plus, 
  Zap, 
  X,
  CornerDownLeft,
  Barcode,
  Smartphone
} from "lucide-react";
import { fetchApi } from "../lib/api";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme?: () => void;
  onOpenAutoRestock?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onToggleTheme,
  onOpenAutoRestock,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Pre-fetch product catalog for instant spotlight search
      fetchApi("/products")
        .then(setProducts)
        .catch(() => {});
    }
  }, [isOpen]);

  const navigationCommands = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, category: "Navigation" },
    { name: "Products Catalog", href: "/products", icon: Package, category: "Navigation" },
    { name: "Stock Levels & Bins", href: "/stock", icon: Package, category: "Navigation" },
    { name: "Warehouses & 2D Map", href: "/warehouses", icon: Warehouse, category: "Navigation" },
    { name: "Supplier Directory", href: "/suppliers", icon: Truck, category: "Navigation" },
    { name: "Inbound Receipts", href: "/receipts", icon: ArrowDownToLine, category: "Navigation" },
    { name: "Outbound Deliveries", href: "/deliveries", icon: ArrowUpFromLine, category: "Navigation" },
    { name: "Internal Transfers", href: "/transfers", icon: ArrowRightLeft, category: "Navigation" },
    { name: "Inventory Adjustments", href: "/adjustments", icon: Settings2, category: "Navigation" },
    { name: "Movement History Ledger", href: "/history", icon: History, category: "Navigation" },
    { name: "Financial Valuation", href: "/finances", icon: DollarSign, category: "Navigation" },
    { name: "Analytics & Reports", href: "/reports", icon: BarChart2, category: "Navigation" },
    { name: "Mobile Floor Terminal", href: "/mobile", icon: Smartphone, category: "Navigation" },
  ];

  const actionCommands = [
    {
      name: "Launch Mobile Warehouse Terminal (Barcode Scanner)",
      action: () => {
        onClose();
        navigate("/mobile");
      },
      icon: Smartphone,
      category: "Quick Actions",
      badge: "Mobile App",
    },
    {
      name: "1-Click Auto-Restock Critical SKUs",
      action: () => {
        onClose();
        if (onOpenAutoRestock) onOpenAutoRestock();
      },
      icon: Zap,
      category: "Quick Actions",
      badge: "Automation",
    },
    {
      name: "Receive New Stock (Create Inbound PO)",
      action: () => {
        onClose();
        navigate("/receipts");
      },
      icon: Plus,
      category: "Quick Actions",
    },
    {
      name: "Create Delivery Order",
      action: () => {
        onClose();
        navigate("/deliveries");
      },
      icon: ArrowUpFromLine,
      category: "Quick Actions",
    },
    {
      name: "New Stock Transfer",
      action: () => {
        onClose();
        navigate("/transfers");
      },
      icon: ArrowRightLeft,
      category: "Quick Actions",
    },
    {
      name: "Add New Product SKU",
      action: () => {
        onClose();
        navigate("/products");
      },
      icon: Plus,
      category: "Quick Actions",
    },
    {
      name: "Toggle Dark / Light Mode",
      action: () => {
        if (onToggleTheme) onToggleTheme();
      },
      icon: Moon,
      category: "Quick Actions",
    },
  ];

  // Filter items based on query
  const term = query.toLowerCase().trim();

  const filteredNav = navigationCommands.filter((c) =>
    c.name.toLowerCase().includes(term)
  );

  const filteredActions = actionCommands.filter((c) =>
    c.name.toLowerCase().includes(term)
  );

  const filteredProducts = term
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            (p.category && p.category.toLowerCase().includes(term))
        )
        .slice(0, 5)
        .map((p) => ({
          name: `${p.name} (${p.sku})`,
          action: () => {
            onClose();
            navigate("/stock");
          },
          icon: Barcode,
          category: "Catalog SKUs",
          subtitle: `Category: ${p.category || "General"} · Reorder: ${p.reorder_level || 10}`,
        }))
    : [];

  const allItems: any[] = [...filteredActions, ...filteredNav, ...filteredProducts];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          if (selected.action) {
            selected.action();
          } else if (selected.href) {
            navigate(selected.href);
            onClose();
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, allItems, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spotlight Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search SKUs, warehouses, actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching commands or SKUs found for "{query}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.href) {
                      navigate(item.href);
                      onClose();
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-semibold block truncate">{item.name}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↑</kbd>{" "}
              <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">↵</kbd> to select
            </span>
          </div>
          <span className="text-slate-400">Inventra Spotlight</span>
        </div>
      </div>
    </div>
  );
}
