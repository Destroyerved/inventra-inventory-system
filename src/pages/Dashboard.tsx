import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { cn } from "../components/Layout";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [opSummary, setOpSummary] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      fetchApi("/dashboard/stats").then(setStats).catch(console.error);
      fetchApi("/dashboard/operations-summary").then(setOpSummary).catch(console.error);
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!stats || !opSummary) return <div className="flex items-center justify-center h-full text-slate-500">Loading dashboard...</div>;

  const data = [
    { name: "Total Products", value: stats.totalProducts },
    { name: "Low Stock", value: stats.lowStockItems },
    { name: "Out of Stock", value: stats.outOfStockItems },
  ];

  return (
    <div className="space-y-6">
      {/* Operations Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OperationAlertCard 
          title="Receipts" 
          type="receipts"
          data={opSummary.receipts} 
          icon={ArrowDownToLine} 
          color="text-emerald-600" 
          bg="bg-emerald-100" 
          link="/receipts" 
        />
        <OperationAlertCard 
          title="Deliveries" 
          type="deliveries"
          data={opSummary.deliveries} 
          icon={ArrowUpFromLine} 
          color="text-indigo-600" 
          bg="bg-indigo-100" 
          link="/deliveries" 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Products in Stock" value={stats.totalStock} icon={Package} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Low Stock Items" value={stats.lowStockItems} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-100" />
        <StatCard title="Out of Stock Items" value={stats.outOfStockItems} icon={AlertCircle} color="text-red-600" bg="bg-red-100" />
        <StatCard title="Pending Receipts" value={stats.pendingReceipts} icon={ArrowDownToLine} color="text-emerald-600" bg="bg-emerald-100" />
        <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={ArrowUpFromLine} color="text-indigo-600" bg="bg-indigo-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6">Inventory Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6">Operations Summary</h3>
          <div className="space-y-4">
            {stats.recentOperations?.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900 dark:text-white">{op.reference || `OP-${op.id}`}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{op.type}</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {format(new Date(op.date), "MMM d, yyyy HH:mm")} by {op.user_name}
                  </div>
                </div>
                <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full", op.status === 'done' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400")}>
                  {op.status}
                </span>
              </div>
            ))}
            {(!stats.recentOperations || stats.recentOperations.length === 0) && (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">No recent operations</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center transition-colors duration-200">
      <div className={`p-4 rounded-xl ${bg} dark:bg-opacity-20 ${color} mr-4`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function OperationAlertCard({ title, type, data, icon: Icon, color, bg, link }: any) {
  const isReceipt = type === "receipts";
  const pendingLabel = isReceipt ? "to Receive" : "to Deliver";

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${bg} dark:bg-opacity-20 ${color} mr-4`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <Link to={link} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center">
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{data.to_receive ?? data.to_deliver}</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{pendingLabel}</span>
        </div>
        
        <div className="flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-100 dark:border-red-800/30">
            <div className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Late</span>
            </div>
            <span className="text-sm font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-md">{data.late}</span>
          </div>
          
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Waiting</span>
            </div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-md">{data.waiting}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Operations</span>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">{data.total}</span>
      </div>
    </div>
  );
}
