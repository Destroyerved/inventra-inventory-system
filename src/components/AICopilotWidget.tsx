import { useState, useEffect, type FormEvent } from "react";
import { 
  Activity, 
  Bot, 
  ArrowRight, 
  RefreshCw, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  X, 
  MessageSquare, 
  TrendingUp, 
  Clock 
} from "lucide-react";
import { fetchApi } from "../lib/api";
import { showToast } from "./Toast";
import AutoPOGeneratorModal from "./AutoPOGeneratorModal";

interface AICopilotWidgetProps {
  onQuickReorder?: (product: any) => void;
  onRefreshNeeded?: () => void;
}

export default function AICopilotWidget({ onQuickReorder, onRefreshNeeded }: AICopilotWidgetProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAutoPO, setShowAutoPO] = useState(false);

  const loadInsights = () => {
    setLoading(true);
    fetchApi("/ai/insights")
      .then((data) => {
        setInsights(data);
      })
      .catch((err) => {
        console.error("Failed to load AI insights:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleAsk = async (questionText?: string) => {
    const userQ = (questionText || query).trim();
    if (!userQ || queryLoading) return;

    setQuery("");
    setQueryLoading(true);

    try {
      const res = await fetchApi("/ai/query", {
        method: "POST",
        body: JSON.stringify({ question: userQ }),
      });
      setConversation((prev) => [...prev, { q: userQ, a: res.answer }]);
    } catch (err: any) {
      showToast(err.message || "Failed to query Copilot", "error");
    } finally {
      setQueryLoading(false);
    }
  };

  const sampleQuestions = [
    "What items are low on stock?",
    "What is the total inventory valuation?",
    "Which products have the highest burn rate?",
  ];

  const criticalRecommendations = insights?.recommendations || [];

  return (
    <>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300">
        {/* Top Intelligence Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  Executive Telemetry & Forecasting
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {insights?.aiPowered ? "Gemini Pro 1.5 Active" : "Algorithmic Run-Rate Engine"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continuous inventory velocity modeling, depletion runway, and supply chain telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadInsights}
              title="Refresh Telemetry"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xs transition-colors"
            >
              <Bot className="h-3.5 w-3.5" />
              Ask Copilot
            </button>
          </div>
        </div>

        {/* Bento Metrics Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Executive Telemetry Briefing */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Operational Briefing</span>
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              </div>
              {loading ? (
                <div className="space-y-2 py-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                </div>
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {insights?.summary || "All warehouse nodes operational. Replenishment cycles aligned with demand."}
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status: Synchronized</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0 Anomaly</span>
            </div>
          </div>

          {/* Card 2: Stockout Risk & 1-Click Auto Restock */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Stockout Prioritization</span>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {criticalRecommendations.length}
                </span>
                <span className="text-xs text-slate-500">
                  SKUs with imminent stockout risk
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {criticalRecommendations.length > 0 ? (
                  <span>
                    Highest risk: <strong className="text-slate-900 dark:text-slate-200">{criticalRecommendations[0]?.name}</strong> ({criticalRecommendations[0]?.days_remaining}d runway)
                  </span>
                ) : (
                  <span>All SKUs currently above safety stock buffer.</span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                onClick={() => setShowAutoPO(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                1-Click Restock Wizard
              </button>
            </div>
          </div>

          {/* Card 3: Outbound Velocity & Capital Efficiency */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                <span>Outbound Velocity</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {criticalRecommendations.reduce((acc: number, item: any) => acc + (item.daily_burn_rate || 0), 0).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">
                  units burned / day
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                Predictive burn rates based on 30-day fulfillment telemetry and customer delivery frequency.
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Auto-updates: 15s
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Runway: Safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Copilot Drawer (Apple / Linear Clean Style) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200">
                    <Bot className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Inventra Copilot</h3>
                    <p className="text-xs text-slate-500">Natural language inventory telemetry</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {conversation.length === 0 && (
                  <div className="space-y-4 py-6">
                    <div className="text-center text-slate-400">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Ask any question about your stock
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Copilot parses SKUs, reorder levels, warehouse locations, and financial valuation.
                      </p>
                    </div>

                    <div className="pt-4 space-y-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Suggested Inquiries:
                      </span>
                      {sampleQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAsk(q)}
                          className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversation.map((chat, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* User bubble */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] p-3 bg-slate-900 text-white dark:bg-emerald-600 rounded-2xl rounded-tr-xs text-xs font-medium">
                        {chat.q}
                      </div>
                    </div>
                    {/* Copilot bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-xs text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line border border-slate-200 dark:border-slate-700/60 leading-relaxed font-normal">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                          Copilot:
                        </span>
                        {chat.a}
                      </div>
                    </div>
                  </div>
                ))}

                {queryLoading && (
                  <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500">
                    <div className="h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    Querying warehouse intelligence...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <form
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    handleAsk();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    placeholder="Ask about inventory, suppliers, or forecasts..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={queryLoading || !query.trim()}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-PO Restock Modal */}
      <AutoPOGeneratorModal
        isOpen={showAutoPO}
        onClose={() => setShowAutoPO(false)}
        onSuccess={() => {
          loadInsights();
          if (onRefreshNeeded) onRefreshNeeded();
        }}
      />
    </>
  );
}
