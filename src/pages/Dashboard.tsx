import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { 
  Package, 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  DollarSign, 
  Layers,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { cn } from "../components/Layout";
import { Link, useNavigate } from "react-router-dom";
import AICopilotWidget from "../components/AICopilotWidget";
import AutoPOGeneratorModal from "../components/AutoPOGeneratorModal";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [opSummary, setOpSummary] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [showAutoPO, setShowAutoPO] = useState(false);
  const navigate = useNavigate();

  const loadData = () => {
    fetchApi("/dashboard/stats").then(setStats).catch(console.error);
    fetchApi("/dashboard/operations-summary").then(setOpSummary).catch(console.error);
    fetchApi("/ai/forecast").then(setForecast).catch(console.error);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickReorder = (product: any) => {
    navigate("/receipts");
  };

  if (!stats || !opSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-3">
        <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Synchronizing warehouse telemetry...</p>
      </div>
    );
  }

  const chartData = [
    { name: "Total SKUs", value: stats.totalProducts },
    { name: "Low Stock", value: stats.lowStockItems },
    { name: "Out of Stock", value: stats.outOfStockItems },
  ];

  const healthyRatio = stats.totalProducts > 0 
    ? Math.round(((stats.totalProducts - stats.lowStockItems - stats.outOfStockItems) / stats.totalProducts) * 100) 
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Bento Intelligence Ribbon (Zero AI slop, Apple minimalist aesthetic) */}
      <AICopilotWidget 
        onQuickReorder={handleQuickReorder} 
        onRefreshNeeded={loadData}
      />

      {/* Operations Quick Action Stream */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Inventory Health Index: <strong>{healthyRatio}% Optimal</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoPO(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            1-Click Auto-Restock
          </button>
          <Link
            to="/receipts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-500" /> Receive
          </Link>
          <Link
            to="/deliveries"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5 text-indigo-500" /> Deliver
          </Link>
        </div>
      </div>

      {/* Operations Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <OperationAlertCard 
          title="Inbound Receipts" 
          type="receipts"
          data={opSummary.receipts} 
          icon={ArrowDownToLine} 
          color="text-emerald-600 dark:text-emerald-400" 
          bg="bg-emerald-50 dark:bg-emerald-950/40" 
          link="/receipts" 
        />
        <OperationAlertCard 
          title="Outbound Deliveries" 
          type="deliveries"
          data={opSummary.deliveries} 
          icon={ArrowUpFromLine} 
          color="text-indigo-600 dark:text-indigo-400" 
          bg="bg-indigo-50 dark:bg-indigo-950/40" 
          link="/deliveries" 
        />
      </div>

      {/* High-Precision Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard 
          title="Total Inventory Valuation" 
          value={`$${(forecast?.totalValuation || 0).toLocaleString()}`} 
          subtitle="Real-time cost ledger basis"
          icon={DollarSign} 
          color="text-emerald-600 dark:text-emerald-400" 
          bg="bg-emerald-50 dark:bg-emerald-950/40" 
        />
        <StatCard 
          title="Total Stored Units" 
          value={stats.totalStock.toLocaleString()} 
          subtitle="Across all physical warehouse bins"
          icon={Package} 
          color="text-blue-600 dark:text-blue-400" 
          bg="bg-blue-50 dark:bg-blue-950/40" 
        />
        <StatCard 
          title="Catalog SKUs" 
          value={stats.totalProducts} 
          subtitle="Active product definitions"
          icon={Layers} 
          color="text-purple-600 dark:text-purple-400" 
          bg="bg-purple-50 dark:bg-purple-950/40" 
        />
        <StatCard 
          title="Low Stock Warning" 
          value={stats.lowStockItems} 
          subtitle="Stock at or below reorder point"
          icon={AlertTriangle} 
          color="text-amber-600 dark:text-amber-400" 
          bg="bg-amber-50 dark:bg-amber-950/40" 
        />
        <StatCard 
          title="Out of Stock Items" 
          value={stats.outOfStockItems} 
          subtitle="Immediate fulfillment halt"
          icon={AlertCircle} 
          color="text-rose-600 dark:text-rose-400" 
          bg="bg-rose-50 dark:bg-rose-950/40" 
        />
        <StatCard 
          title="Pending Operations" 
          value={stats.pendingReceipts + stats.pendingDeliveries} 
          subtitle="Queued warehouse tasks"
          icon={Clock} 
          color="text-indigo-600 dark:text-indigo-400" 
          bg="bg-indigo-50 dark:bg-indigo-950/40" 
        />
      </div>

      {/* Analytics & Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inventory Distribution Chart */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Inventory Profile</h3>
              <p className="text-xs text-slate-500">Distribution by availability state</p>
            </div>
            <Link to="/stock" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Inspect Bins →
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', opacity: 0.5 }} 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 600
                  }} 
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Operations Summary */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Operations</h3>
                <p className="text-xs text-slate-500">Warehouse ledger event stream</p>
              </div>
              <Link to="/history" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Full Ledger →
              </Link>
            </div>

            <div className="space-y-3">
              {stats.recentOperations?.map((op: any) => (
                <div 
                  key={op.id} 
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{op.reference || `OP-${op.id}`}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {op.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {format(new Date(op.date), "MMM d, yyyy HH:mm")} · {op.user_name}
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-semibold rounded-full", 
                    op.status === 'done' 
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" 
                      : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                  )}>
                    {op.status}
                  </span>
                </div>
              ))}
              {(!stats.recentOperations || stats.recentOperations.length === 0) && (
                <div className="text-center text-slate-400 py-12 text-xs">No recent operations logged</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Continuous event synchronization</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
            </span>
          </div>
        </div>
      </div>

      {/* Auto-PO Restock Modal */}
      <AutoPOGeneratorModal
        isOpen={showAutoPO}
        onClose={() => setShowAutoPO(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="min-w-0 pr-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight truncate">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1 truncate">{subtitle}</p>}
      </div>
      <div className={`p-3.5 rounded-xl ${bg} ${color} shrink-0 border border-slate-200/50 dark:border-slate-700/50`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function OperationAlertCard({ title, type, data, icon: Icon, color, bg, link }: any) {
  const isReceipt = type === "receipts";
  const pendingLabel = isReceipt ? "Awaiting Intake" : "Awaiting Dispatch";

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${bg} ${color} border border-slate-200/50 dark:border-slate-700/50`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <span className="text-[11px] text-slate-400">Warehouse logistics flow</span>
            </div>
          </div>
          <Link to={link} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{data.to_receive ?? data.to_deliver}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{pendingLabel}</span>
          </div>
          
          <div className="flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
              <div className="flex items-center text-rose-700 dark:text-rose-400 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                <span>Overdue</span>
              </div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-md font-mono">
                {data.late}
              </span>
            </div>
            
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-center text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <span>Pending</span>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md font-mono">
                {data.waiting}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-500 dark:text-slate-400">Total Lifecycle Operations</span>
        <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg font-mono">
          {data.total}
        </span>
      </div>
    </div>
  );
}
