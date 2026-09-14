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
  Plus
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ToastContainer } from "./Toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Inventra</h1>
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
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-emerald-400" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-3 py-2 mb-2 text-sm text-slate-300">
            <User className="mr-3 h-5 w-5 text-slate-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-white truncate">{user?.name}</span>
              <span className="text-xs text-slate-500 truncate capitalize">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 shrink-0" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-8 transition-colors duration-200 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white truncate">
              {navItems.find(item => item.href === location.pathname)?.name || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/receipts"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="h-3 w-3" /> Receive
              </Link>
              <Link
                to="/deliveries"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
              >
                <Plus className="h-3 w-3" /> Deliver
              </Link>
              <Link
                to="/transfers"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors"
              >
                <Plus className="h-3 w-3" /> Transfer
              </Link>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
