import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Activity,
  Cpu,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Database,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Server,
  FileText,
  BookOpen,
  Quote,
  Flame,
  Radio,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { safeFetchAIJson } from '../utils/ai-client';
import { Dossier, LexiconTerm, CitationItem } from '../types';

interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'SUCCESS' | 'HIGH_DEMAND' | 'FAILOVER' | 'BACKOFF' | 'ERROR' | 'PROBE';
  modelRequested: string;
  modelUsed?: string;
  durationMs: number;
  tokensEstimated: number;
  message: string;
  statusCode?: number;
}

interface ModelHealth {
  name: string;
  displayName: string;
  status: 'OPTIMAL' | 'HIGH_DEMAND' | 'BUSY' | 'UNAVAILABLE';
  lastCallTime?: string;
  totalCalls: number;
  successCalls: number;
  failoverCount: number;
  avgLatencyMs: number;
  totalTokens: number;
}

interface TelemetryData {
  bootTime: string;
  totalRequests: number;
  successfulRequests: number;
  totalTokensEstimated: number;
  failoverEventsCount: number;
  overloadWarningsCount: number;
  currentEngineStatus: 'OPTIMAL' | 'HIGH_DEMAND_FAILOVER' | 'DEGRADED';
  models: Record<string, ModelHealth>;
  events: TelemetryEvent[];
  uptimeSeconds?: number;
  dossiersCount?: number;
}

interface SystemDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossiers: Dossier[];
  lexicon: LexiconTerm[];
  citations: CitationItem[];
  theme: 'dark' | 'light';
}

export const SystemDashboardModal: React.FC<SystemDashboardModalProps> = ({
  isOpen,
  onClose,
  dossiers,
  lexicon,
  citations,
  theme
}) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [probeResults, setProbeResults] = useState<any[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [eventFilter, setEventFilter] = useState<'ALL' | 'FAILOVER' | 'HIGH_DEMAND' | 'SUCCESS'>('ALL');

  const fetchDiagnostics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await safeFetchAIJson('/api/system/ai-diagnostics', {
        method: 'GET'
      });
      if (res.ok && res.data?.success && res.data?.telemetry) {
        setTelemetry(res.data.telemetry);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching AI diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRunProbe = async () => {
    setIsProbing(true);
    setProbeResults(null);
    try {
      const res = await safeFetchAIJson('/api/system/probe-ai-models', {
        method: 'POST'
      });
      if (res.ok && res.data?.success) {
        setProbeResults(res.data.probeResults || []);
        if (res.data.telemetry) {
          setTelemetry(res.data.telemetry);
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error probing AI models:', err);
    } finally {
      setIsProbing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
      const interval = setInterval(() => {
        fetchDiagnostics();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchDiagnostics]);

  if (!isOpen) return null;

  const totalChapters = dossiers.reduce((acc, d) => {
    const pCount = (d.projectStructure || []).reduce((pAcc, pillar) => pAcc + (pillar.chapters || []).length, 0);
    return acc + pCount;
  }, 0);

  const handleExportLogs = () => {
    if (!telemetry?.events) return;
    const logData = JSON.stringify(telemetry, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-telemetry-diagnostics-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = (telemetry?.events || []).filter(evt => {
    if (eventFilter === 'ALL') return true;
    if (eventFilter === 'FAILOVER') return evt.type === 'FAILOVER' || evt.type === 'BACKOFF';
    if (eventFilter === 'HIGH_DEMAND') return evt.type === 'HIGH_DEMAND' || evt.statusCode === 503;
    if (eventFilter === 'SUCCESS') return evt.type === 'SUCCESS';
    return true;
  });

  const overallStatus = telemetry?.currentEngineStatus || 'OPTIMAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-6xl h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-[#090814] text-slate-100 border-purple-500/30 shadow-purple-950/50'
            : 'bg-white text-slate-900 border-purple-200 shadow-xl'
        }`}
      >
        {/* HEADER */}
        <div
          className={`p-4 md:px-6 flex items-center justify-between border-b ${
            theme === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display-title font-bold text-base md:text-lg tracking-wide uppercase">
                  DASHBOARD HỆ THỐNG // CHẨN ĐOÁN SỨC KHỎE AI & TẢI LƯỢNG TOKEN
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${
                  overallStatus === 'OPTIMAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  <Radio className="w-3 h-3 animate-ping text-emerald-400" />
                  <span>{overallStatus === 'OPTIMAL' ? 'AI OPERATIONAL' : 'AUTO-FAILOVER ACTIVE'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Giám sát tín hiệu 503 Overload, tự động điều hướng Candidate Model, thống kê Token & tài nguyên hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer border font-mono text-xs font-bold flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Tải tệp nhật ký chẩn đoán JSON để đối soát"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>XUẤT LOG JSON</span>
            </button>

            <button
              onClick={handleRunProbe}
              disabled={isProbing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50"
              title="Gửi request probe thử nghiệm 1-chạm tới tất cả các Candidate Models để cập nhật tình trạng realtime"
            >
              {isProbing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>ĐANG PROBE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>PROBE AI 1-CHẠM</span>
                </>
              )}
            </button>

            <button
              onClick={fetchDiagnostics}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Làm mới dữ liệu chẩn đoán"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 ${
          theme === 'dark' ? 'bg-[#090814]' : 'bg-white'
        }`}>
          {/* SECTION 1: TOP KEY METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Metric 1: Total Tokens */}
            <div className={`p-4 rounded-2xl border space-y-1 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-purple-950/20 border-purple-800/40 text-purple-200'
                : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-tech uppercase tracking-wider font-bold text-purple-400">TỔNG TOKEN ĐÃ DÙNG</span>
                <Flame className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl md:text-2xl font-mono font-extrabold tracking-tight">
                {(telemetry?.totalTokensEstimated || 0).toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-purple-400/80">
                Ước tính từ kí tự Prompt & Response
              </div>
            </div>

            {/* Metric 2: Total Requests & Latency */}
            <div className={`p-4 rounded-2xl border space-y-1 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-tech uppercase tracking-wider font-bold text-indigo-400">TỔNG PHIÊN GỌI AI</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl md:text-2xl font-mono font-extrabold tracking-tight">
                {(telemetry?.totalRequests || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">requests</span>
              </div>
              <div className="text-[10px] font-mono text-indigo-400/80">
                Thành công: {telemetry?.successfulRequests || 0} phiên
              </div>
            </div>

            {/* Metric 3: Failover Protection Counter */}
            <div className={`p-4 rounded-2xl border space-y-1 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-tech uppercase tracking-wider font-bold text-amber-400">CỨU NẠN FAILOVER 503</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl md:text-2xl font-mono font-extrabold tracking-tight">
                {(telemetry?.failoverEventsCount || 0)} <span className="text-xs font-normal text-amber-400/80">lần tự ứng biến</span>
              </div>
              <div className="text-[10px] font-mono text-amber-400/80">
                Cảnh báo quá tải: {telemetry?.overloadWarningsCount || 0} tín hiệu
              </div>
            </div>

            {/* Metric 4: System Uptime & Dossiers */}
            <div className={`p-4 rounded-2xl border space-y-1 relative overflow-hidden ${
              theme === 'dark'
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-tech uppercase tracking-wider font-bold text-emerald-400">THỜI GIAN HOẠT ĐỘNG</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl md:text-2xl font-mono font-extrabold tracking-tight">
                {Math.floor((telemetry?.uptimeSeconds || 0) / 60)}m {(telemetry?.uptimeSeconds || 0) % 60}s
              </div>
              <div className="text-[10px] font-mono text-emerald-400/80">
                Boot time: {telemetry?.bootTime ? new Date(telemetry.bootTime).toLocaleTimeString() : 'Online'}
              </div>
            </div>
          </div>

          {/* SECTION 2: AI CANDIDATE MODELS HEALTH MATRIX */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className="font-tech uppercase tracking-wider font-bold text-sm">
                  MA TRẬN SỨC KHỎE CANDIDATE AI MODELS (HEALTH DIAGNOSTIC MATRIX)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Cập nhật lần cuối: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', role: 'Primary Core (Chính)' },
                { key: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', role: 'High-Speed Candidate' },
                { key: 'gemini-flash-latest', name: 'Gemini Flash Latest', role: 'Auto-Failover Candidate' },
                { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', role: 'Fallback Engine' }
              ].map(mItem => {
                const mData: ModelHealth | undefined = telemetry?.models?.[mItem.key];
                const probeInfo = probeResults?.find(p => p.model === mItem.key);

                const isHealthy = !mData || mData.status === 'OPTIMAL';
                const isHighDemand = mData?.status === 'HIGH_DEMAND' || probeInfo?.status === 'HIGH_DEMAND';

                return (
                  <div
                    key={mItem.key}
                    className={`p-4 rounded-2xl border space-y-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40'
                        : 'bg-white border-slate-200 shadow-sm hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs">{mItem.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{mItem.role}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        isHighDemand
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : isHealthy
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isHighDemand ? '⚠️ TẢI CAO (503)' : isHealthy ? '🟢 OPTIMAL' : '🔴 OFFLINE'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-800/40 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Số lượt gọi:</span>
                        <span className="text-slate-200 font-bold">{mData?.totalCalls || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Latency trung bình:</span>
                        <span className="text-purple-300 font-bold">{mData?.avgLatencyMs ? `${mData.avgLatencyMs}ms` : probeInfo?.latencyMs ? `${probeInfo.latencyMs}ms` : '--'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Failover ứng biến:</span>
                        <span className="text-amber-300 font-bold">{mData?.failoverCount || 0} lần</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Token tiêu thụ:</span>
                        <span className="text-emerald-300 font-bold">{(mData?.totalTokens || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: LIVE TELEMETRY LOG STREAM (EVENT CATCHER) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 border-slate-800/60">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="font-tech uppercase tracking-wider font-bold text-sm">
                  NHẬT KÝ BẮT TÍN HIỆU SỨC KHỎE AI (REAL-TIME EVENT STREAM)
                </h3>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(['ALL', 'HIGH_DEMAND', 'FAILOVER', 'SUCCESS'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setEventFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                      eventFilter === filter
                        ? 'bg-purple-600 text-white shadow-xs'
                        : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'TẤT CẢ' : filter === 'HIGH_DEMAND' ? '⚠️ TẢI CAO (503)' : filter === 'FAILOVER' ? '🔀 FAILOVER' : '🟢 THÀNH CÔNG'}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
                {filteredEvents.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs font-mono">
                    Chưa ghi nhận sự kiện nào trong danh mục này. Toàn bộ mô hình AI đang vận hành bình thường.
                  </div>
                ) : (
                  filteredEvents.map(evt => {
                    const isHighDemand = evt.type === 'HIGH_DEMAND' || evt.statusCode === 503;
                    const isFailover = evt.type === 'FAILOVER' || evt.type === 'BACKOFF';
                    const isProbe = evt.type === 'PROBE';

                    return (
                      <div
                        key={evt.id}
                        className={`p-2.5 rounded-xl border text-xs font-mono transition-colors flex items-start justify-between gap-3 ${
                          isHighDemand
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                            : isFailover
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200'
                            : isProbe
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200'
                            : theme === 'dark'
                            ? 'bg-slate-900/40 border-slate-800/40 text-slate-300'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 shrink-0">
                            {isHighDemand ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                            ) : isFailover ? (
                              <ShieldCheck className="w-4 h-4 text-indigo-400" />
                            ) : isProbe ? (
                              <Zap className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold flex items-center gap-2">
                              <span>{evt.message}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Model yêu cầu: <code className="text-purple-300">{evt.modelRequested}</code></span>
                              {evt.modelUsed && evt.modelUsed !== evt.modelRequested && (
                                <span className="text-indigo-300 font-bold">➔ Chuyển sang: {evt.modelUsed}</span>
                              )}
                              {evt.durationMs > 0 && <span>• {evt.durationMs}ms</span>}
                              {evt.tokensEstimated > 0 && <span>• ~{evt.tokensEstimated} tokens</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: OG SUITE KNOWLEDGE METRICS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-tech uppercase tracking-wider font-bold text-sm">
                TÀI NGUYÊN TRI THỨC HỆ THỐNG (OG KNOWLEDGE SUITE RESOURCES)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Hồ Sơ Khảo Luận</div>
                  <div className="font-bold text-sm text-purple-300">{dossiers.length} Hồ sơ ({totalChapters} chương)</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Sổ Từ Điển</div>
                  <div className="font-bold text-sm text-indigo-300">{lexicon.length} Thuật ngữ</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Sổ Trích Dẫn</div>
                  <div className="font-bold text-sm text-amber-300">{citations.length} Danh ngôn</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Lăng Kính Đa Ngành</div>
                  <div className="font-bold text-sm text-emerald-300">Ma Trận Đa Ngành Mở Rộng</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`p-3 md:px-6 border-t flex items-center justify-between text-xs font-mono ${
            theme === 'dark' ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Telemetry Bus Engine v2.5 • Resilient Failover Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Đóng Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
