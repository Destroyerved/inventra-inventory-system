import { useState, useEffect, type FormEvent } from "react";
import { Sparkles, Bot, ArrowRight, RefreshCw, Send, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
import { fetchApi } from "../lib/api";
import { showToast } from "./Toast";

export default function AICopilotWidget({ onQuickReorder }: { onQuickReorder?: (product: any) => void }) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

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

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || queryLoading) return;

    const userQ = query.trim();
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

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-500/20 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Inventra AI Copilot</h3>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                insights?.aiPowered 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                  : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              }`}>
                {insights?.aiPowered ? "Gemini AI Online" : "Predictive Engine"}
              </span>
            </div>
            <p className="text-xs text-indigo-200/70">Real-time demand forecasting & warehouse intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInsights}
            title="Refresh Insights"
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800/40 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800/40 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-6 space-y-5">
          {/* Executive Summary Card */}
          <div className="bg-slate-900/60 rounded-xl p-4 border border-indigo-500/10">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bot className="h-4 w-4" /> Executive Telemetry Briefing
            </h4>
            {loading ? (
              <div className="space-y-2 py-2">
                <div className="h-3 bg-indigo-950/50 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-indigo-950/50 rounded animate-pulse w-5/6"></div>
              </div>
            ) : (
              <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-normal">
                {insights?.summary || "Warehouse operations telemetry is compiling..."}
              </p>
            )}
          </div>

          {/* Critical Restock Alerts */}
          {insights?.recommendations && insights.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Restock Prioritization Index
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.recommendations.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        {item.name}
                        <span className="text-[10px] bg-rose-900/60 text-rose-300 px-1.5 py-0.5 rounded">
                          {item.current_stock} left
                        </span>
                      </div>
                      <div className="text-xs text-rose-300/80">
                        Burn: {item.daily_burn_rate}/day · {item.days_remaining}d remaining
                      </div>
                    </div>
                    {onQuickReorder && (
                      <button
                        onClick={() => onQuickReorder(item)}
                        className="shrink-0 text-xs px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg flex items-center gap-1 transition-colors"
                      >
                        Reorder <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copilot Q&A Thread */}
          {conversation.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {conversation.map((chat, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="p-2.5 bg-indigo-900/30 rounded-lg text-indigo-200 border border-indigo-800/30">
                    <span className="font-semibold text-indigo-300">You: </span>{chat.q}
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg text-slate-200 border border-slate-700/50">
                    <span className="font-semibold text-emerald-400">Copilot: </span>{chat.a}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ask Input */}
          <form onSubmit={handleAsk} className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask Copilot (e.g., 'What items are low on stock?' or 'Total inventory value')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-900/80 border border-indigo-500/30 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
            <button
              type="submit"
              disabled={queryLoading || !query.trim()}
              className="absolute right-2 p-1.5 text-indigo-400 hover:text-white disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
