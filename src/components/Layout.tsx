import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft, 
  Settings2, 
  History, 
  LogOut,
  User,
  Sun,
  Moon,
  BarChart2,
  Menu,
  X,
  DollarSign,
  Warehouse,
  Truck,
  Plus,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ToastContainer } from "./Toast";
import CommandPalette from "./CommandPalette";
import AutoPOGeneratorModal from "./AutoPOGeneratorModal";
import { fetchApi } from "../lib/api";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAutoRestockOpen, setIsAutoRestockOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [recentOperations, setRecentOperations] = useState<any[]>([]);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch recent operations for notification center
  useEffect(() => {
    fetchApi("/dashboard/stats")
      .then((data) => {
        if (data.recentOperations) {
          setRecentOperations(data.recentOperations.slice(0, 6));
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const toggleTheme = () => setIsDark(!isDark);

  const canEdit = user?.role === "admin" || user?.role === "manager";

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "Stock Levels", href: "/stock", icon: Package },
    { name: "Warehouses", href: "/warehouses", icon: Warehouse },
    { name: "Suppliers", href: "/suppliers", icon: Truck },
    { name: "Receipts", href: "/receipts", icon: ArrowDownToLine },
    { name: "Deliveries", href: "/deliveries", icon: ArrowUpFromLine },
    { name: "Transfers", href: "/transfers", icon: ArrowRightLeft },
    { name: "Adjustments", href: "/adjustments", icon: Settings2 },
    { name: "Move History", href: "/history", icon: History },
    { name: "Finances", href: "/finances", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    ...(canEdit ? [{ name: "Settings", href: "/settings", icon: Settings2 }] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-sm">
              I
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">Inventra</h1>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Enterprise WMS</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition-all",
                  isActive 
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                )}
              >
                <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-emerald-400" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-3 py-2 mb-2 text-xs text-slate-300 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-white mr-2.5 shrink-0 text-xs">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-400 truncate capitalize">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-xs font-medium text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4 text-slate-400 shrink-0" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-8 transition-colors duration-200 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {navItems.find(item => item.href === location.pathname)?.name || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Spotlight Search Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline">Quick Jump...</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Restock Wizard Shortcut */}
            <button
              onClick={() => setIsAutoRestockOpen(true)}
              title="Automated Restock Wizard"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Restock Wizard
            </button>

            {/* Notification Center Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative"
                aria-label="Recent activity notifications"
              >
                <Bell className="h-4 w-4" />
                {recentOperations.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover Drawer */}
              {isNotificationsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Activity Stream
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                        {recentOperations.length} recent
                      </span>
                    </div>
                    <Link
                      to="/history"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View Ledger
                    </Link>
                  </div>

                  <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                    {recentOperations.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No recent operations recorded.
                      </div>
                    ) : (
                      recentOperations.map((op) => (
                        <div
                          key={op.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{op.reference || `OP-${op.id}`}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                {op.type}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              {format(new Date(op.date), "MMM d, HH:mm")} · by {op.user_name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              op.status === "done"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            }`}
                          >
                            {op.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToggleTheme={toggleTheme}
        onOpenAutoRestock={() => setIsAutoRestockOpen(true)}
      />

      {/* Global 1-Click Auto-PO Generator Modal */}
      <AutoPOGeneratorModal
        isOpen={isAutoRestockOpen}
        onClose={() => setIsAutoRestockOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
