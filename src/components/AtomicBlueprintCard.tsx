import React, { useState, useMemo } from 'react';
import {
  Layers,
  Cpu,
  Network,
  Brain,
  ShieldCheck,
  Database,
  Server,
  Workflow,
  Zap,
  Globe,
  Box,
  Radio,
  Lock,
  Sparkles,
  Activity,
  Compass,
  Edit3,
  Save,
  X,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  Loader2,
  FileCode,
  Share2,
  Eye,
  Sliders,
  Maximize2,
  ChevronRight,
  Info,
  GitBranch,
  Repeat,
  Terminal,
  Grid,
  ListOrdered,
  HelpCircle,
  ExternalLink,
  Wand2,
  Table,
  Filter,
  ArrowRightLeft,
  GitCommit
} from 'lucide-react';
import { AtomicContentUnit, BlueprintDiagramData, BlueprintNode, BlueprintConnection, BlueprintNodeType } from '../types';
import { usePermission } from '../contexts/PermissionContext';
import { safeFetchAIJson } from '../utils/ai-client';

interface AtomicBlueprintCardProps {
  unit: AtomicContentUnit;
  theme: 'dark' | 'light';
  contextInfo?: string;
  onUpdateUnit?: (unitId: string, newContentOrUnit: string | Partial<AtomicContentUnit>) => void;
}

// Icon dictionary resolver for blueprint nodes
function getNodeIcon(iconName?: string, type?: string, actionType?: string) {
  const name = (iconName || '').toLowerCase();
  const t = (type || '').toLowerCase();
  const act = (actionType || '').toLowerCase();

  if (act === 'trigger' || name === 'zap') return Zap;
  if (act === 'decision' || name === 'gitbranch' || t === 'decision') return GitBranch;
  if (act === 'agent' || name === 'brain' || t === 'ai' || t === 'agent') return Brain;
  if (name === 'shieldcheck' || t === 'security') return ShieldCheck;
  if (name === 'database' || t === 'database' || t === 'vector_db' || t === 'storage') return Database;
  if (name === 'server' || t === 'service' || t === 'gateway') return Server;
  if (name === 'network' || t === 'orchestrator') return Network;
  if (name === 'workflow' || t === 'queue' || act === 'process') return Workflow;
  if (name === 'repeat' || act === 'transform') return Repeat;
  if (name === 'globe' || t === 'client' || act === 'output') return Globe;
  if (name === 'radio') return Radio;
  if (name === 'lock') return Lock;
  if (name === 'compass') return Compass;
  if (name === 'activity') return Activity;
  if (name === 'cpu') return Cpu;
  if (name === 'box') return Box;

  return Layers;
}

// Color scheme based on node type / action type
function getNodeColor(type?: string, actionType?: string, theme: 'dark' | 'light' = 'dark') {
  const isDark = theme === 'dark';
  const t = (type || '').toLowerCase();
  const act = (actionType || '').toLowerCase();

  if (t === 'client' || act === 'trigger') {
    return {
      border: isDark ? 'border-sky-500/50 hover:border-sky-400' : 'border-sky-300 hover:border-sky-400',
      bg: isDark ? 'bg-sky-950/40 hover:bg-sky-950/60' : 'bg-sky-50/90 hover:bg-sky-100/90',
      text: isDark ? 'text-sky-300' : 'text-sky-900',
      glow: isDark ? 'shadow-sky-900/30' : 'shadow-sky-100',
      badge: isDark ? 'bg-sky-900/60 text-sky-300 border-sky-600/40' : 'bg-sky-100 text-sky-800 border-sky-300',
      iconBg: isDark ? 'bg-sky-900/80 text-sky-300 border border-sky-500/30' : 'bg-sky-200 text-sky-900 border border-sky-300'
    };
  }
  if (t === 'gateway' || t === 'orchestrator' || act === 'process') {
    return {
      border: isDark ? 'border-indigo-500/50 hover:border-indigo-400' : 'border-indigo-300 hover:border-indigo-400',
      bg: isDark ? 'bg-indigo-950/40 hover:bg-indigo-950/60' : 'bg-indigo-50/90 hover:bg-indigo-100/90',
      text: isDark ? 'text-indigo-300' : 'text-indigo-900',
      glow: isDark ? 'shadow-indigo-900/30' : 'shadow-indigo-100',
      badge: isDark ? 'bg-indigo-900/60 text-indigo-300 border-indigo-600/40' : 'bg-indigo-100 text-indigo-800 border-indigo-300',
      iconBg: isDark ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-200 text-indigo-900 border border-indigo-300'
    };
  }
  if (t === 'agent' || t === 'ai' || act === 'agent') {
    return {
      border: isDark ? 'border-purple-500/50 hover:border-purple-400' : 'border-purple-300 hover:border-purple-400',
      bg: isDark ? 'bg-purple-950/40 hover:bg-purple-950/60' : 'bg-purple-50/90 hover:bg-purple-100/90',
      text: isDark ? 'text-purple-300' : 'text-purple-900',
      glow: isDark ? 'shadow-purple-900/30' : 'shadow-purple-100',
      badge: isDark ? 'bg-purple-900/60 text-purple-300 border-purple-600/40' : 'bg-purple-100 text-purple-800 border-purple-300',
      iconBg: isDark ? 'bg-purple-900/80 text-purple-300 border border-purple-500/30' : 'bg-purple-200 text-purple-900 border border-purple-300'
    };
  }
  if (t === 'database' || t === 'vector_db' || t === 'storage' || act === 'store') {
    return {
      border: isDark ? 'border-emerald-500/50 hover:border-emerald-400' : 'border-emerald-300 hover:border-emerald-400',
      bg: isDark ? 'bg-emerald-950/40 hover:bg-emerald-950/60' : 'bg-emerald-50/90 hover:bg-emerald-100/90',
      text: isDark ? 'text-emerald-300' : 'text-emerald-900',
      glow: isDark ? 'shadow-emerald-900/30' : 'shadow-emerald-100',
      badge: isDark ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      iconBg: isDark ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
    };
  }
  if (t === 'decision' || act === 'decision' || t === 'security') {
    return {
      border: isDark ? 'border-amber-500/50 hover:border-amber-400' : 'border-amber-300 hover:border-amber-400',
      bg: isDark ? 'bg-amber-950/40 hover:bg-amber-950/60' : 'bg-amber-50/90 hover:bg-amber-100/90',
      text: isDark ? 'text-amber-300' : 'text-amber-900',
      glow: isDark ? 'shadow-amber-900/30' : 'shadow-amber-100',
      badge: isDark ? 'bg-amber-900/60 text-amber-300 border-amber-600/40' : 'bg-amber-100 text-amber-800 border-amber-300',
      iconBg: isDark ? 'bg-amber-900/80 text-amber-300 border border-amber-500/30' : 'bg-amber-200 text-amber-900 border border-amber-300'
    };
  }

  // Default / action / output
  return {
    border: isDark ? 'border-cyan-500/50 hover:border-cyan-400' : 'border-cyan-300 hover:border-cyan-400',
    bg: isDark ? 'bg-cyan-950/30 hover:bg-cyan-950/50' : 'bg-cyan-50/80 hover:bg-cyan-100/80',
    text: isDark ? 'text-cyan-300' : 'text-cyan-900',
    glow: isDark ? 'shadow-cyan-900/30' : 'shadow-cyan-100',
    badge: isDark ? 'bg-cyan-900/60 text-cyan-300 border-cyan-600/40' : 'bg-cyan-100 text-cyan-800 border-cyan-300',
    iconBg: isDark ? 'bg-cyan-900/80 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-200 text-cyan-900 border border-cyan-300'
  };
}

// Translate node type into plain-text Vietnamese badge
function getNodeTypeLabel(type?: string, actionType?: string): string {
  if (actionType === 'trigger') return 'Node Khởi Tạo';
  if (actionType === 'decision') return 'Node Rẽ Nhánh';
  if (actionType === 'process') return 'Khối Xử Lý';
  if (actionType === 'agent') return 'Agent Chuyên Môn';
  if (actionType === 'store') return 'Kho Lưu Trữ';
  if (actionType === 'output') return 'Đầu Ra & Báo Cáo';

  const map: Record<string, string> = {
    client: 'Client / Ingress',
    gateway: 'Cổng Điều Phối',
    orchestrator: 'Bộ Điều Phối Swarm',
    agent: 'AI Agent Chuyên Trách',
    ai: 'Lõi Tính Toán AI',
    service: 'Dịch Vụ Nghiệp Vụ',
    database: 'Cơ Sở Dữ Liệu',
    vector_db: 'Bộ Nhớ Tri Thức (Vector)',
    queue: 'Hàng Đợi Luồng',
    security: 'Bảo Mật & RBAC',
    storage: 'Lưu Trữ Tệp',
    external: 'Dịch Vụ Ngoại Vi',
    action: 'Node Hành Động',
    decision: 'Node Phân Luồng'
  };
  return map[(type || '').toLowerCase()] || 'Khối Chức Năng';
}

export const AtomicBlueprintCard: React.FC<AtomicBlueprintCardProps> = ({
  unit,
  theme,
  contextInfo,
  onUpdateUnit
}) => {
  const { requirePermission } = usePermission();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'ascii' | 'mermaid' | 'json'>('visual');
  const [visualLayoutMode, setVisualLayoutMode] = useState<'horizontal' | 'tiered' | 'grid'>('horizontal');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedConnectionIdx, setSelectedConnectionIdx] = useState<number | null>(null);
  const [hoveredConnectionIdx, setHoveredConnectionIdx] = useState<number | null>(null);
  const [matrixTab, setMatrixTab] = useState<'flow_cards' | 'matrix_grid' | 'detailed_table'>('flow_cards');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'related' | 'solid' | 'dashed'>('all');

  // Parse blueprint data
  const blueprintData: BlueprintDiagramData = useMemo(() => {
    if (unit.blueprintData) return unit.blueprintData;
    try {
      let raw = unit.content.trim();
      if (raw.startsWith('```')) {
        raw = raw.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
      }
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return {
        title: unit.title || 'Sơ Đồ Quy Trình & Kiến Trúc',
        subtitle: 'Bản vẽ luồng hành động và các khối chức năng trực quan',
        category: 'workflow',
        nodes: [
          { id: 'node_in', label: 'Tiếp Nhận Dữ Liệu', shortRole: 'Đầu Vào', stepNumber: 1, type: 'trigger', tier: 'Bước 1: Khởi Tạo', description: unit.content.slice(0, 150), techStack: 'Client / Event', icon: 'Zap', status: 'primary' },
          { id: 'node_process', label: 'Lõi Xử Lý Nghiệp Vụ', shortRole: 'Phân Tích', stepNumber: 2, type: 'ai', tier: 'Bước 2: Xử Lý Lõi', description: 'Chuyển hóa dữ liệu thô thành tri thức thực chiến.', techStack: 'Gemini 3.7 Core', icon: 'Brain', status: 'active' },
          { id: 'node_out', label: 'Lưu Trữ & Xuất Bản', shortRole: 'Kết Quả', stepNumber: 3, type: 'database', tier: 'Bước 3: Hoàn Tất', description: 'Lưu hồ sơ bền vững và phản hồi kết quả.', techStack: 'Database / RAG', icon: 'Database', status: 'active' }
        ],
        connections: [
          { from: 'node_in', to: 'node_process', label: 'Dữ liệu đầu vào', type: 'solid' },
          { from: 'node_process', to: 'node_out', label: 'Tri thức đã lọc', type: 'solid' }
        ],
        asciiFlow: `[Tiếp Nhận Dữ Liệu] --(Dữ liệu đầu vào)--> [Lõi Xử Lý Nghiệp Vụ] --(Tri thức đã lọc)--> [Lưu Trữ & Xuất Bản]`
      };
    }
  }, [unit.blueprintData, unit.content, unit.title]);

  // Active connection highlighting
  const activeConnection = useMemo(() => {
    if (selectedConnectionIdx !== null && blueprintData.connections[selectedConnectionIdx]) {
      return blueprintData.connections[selectedConnectionIdx];
    }
    if (hoveredConnectionIdx !== null && blueprintData.connections[hoveredConnectionIdx]) {
      return blueprintData.connections[hoveredConnectionIdx];
    }
    return null;
  }, [selectedConnectionIdx, hoveredConnectionIdx, blueprintData.connections]);

  const activeSourceNodeId = activeConnection?.from;
  const activeTargetNodeId = activeConnection?.to;

  // Filtered connections list
  const filteredConnections = useMemo(() => {
    let list = blueprintData.connections;
    if (connectionFilter === 'related' && selectedNodeId) {
      list = list.filter(c => c.from === selectedNodeId || c.to === selectedNodeId);
    } else if (connectionFilter === 'solid') {
      list = list.filter(c => (c.type || 'solid') === 'solid');
    } else if (connectionFilter === 'dashed') {
      list = list.filter(c => c.type === 'dashed' || c.type === 'bidirectional');
    }
    return list;
  }, [blueprintData.connections, connectionFilter, selectedNodeId]);

  // Edit draft states
  const [draftTitle, setDraftTitle] = useState(blueprintData.title || '');
  const [draftSubtitle, setDraftSubtitle] = useState(blueprintData.subtitle || '');
  const [draftCategory, setDraftCategory] = useState(blueprintData.category || 'workflow');
  const [draftNodes, setDraftNodes] = useState<BlueprintNode[]>(blueprintData.nodes || []);
  const [draftConnections, setDraftConnections] = useState<BlueprintConnection[]>(blueprintData.connections || []);
  const [draftAscii, setDraftAscii] = useState(blueprintData.asciiFlow || '');
  const [draftRawJson, setDraftRawJson] = useState(JSON.stringify(blueprintData, null, 2));
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Group nodes by tier or step
  const tiersGrouped = useMemo(() => {
    const map = new Map<string, BlueprintNode[]>();
    blueprintData.nodes.forEach((node, idx) => {
      const tierName = node.tier || `Bước ${node.stepNumber || idx + 1}: ${node.label}`;
      if (!map.has(tierName)) {
        map.set(tierName, []);
      }
      map.get(tierName)!.push(node);
    });
    return Array.from(map.entries()).map(([tierName, nodes]) => ({ tierName, nodes }));
  }, [blueprintData.nodes]);

  // Copy helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate Mermaid code
  const generatedMermaid = useMemo(() => {
    if (blueprintData.mermaidCode) return blueprintData.mermaidCode;
    const lines = ['flowchart LR'];
    blueprintData.nodes.forEach((node, idx) => {
      const label = (node.label || `Node ${idx + 1}`).replace(/"/g, "'");
      const tech = node.techStack ? `<br/><small>${node.techStack}</small>` : '';
      lines.push(`    ${node.id}["<b>${label}</b>${tech}"]`);
    });
    blueprintData.connections.forEach(conn => {
      if (conn.label) {
        lines.push(`    ${conn.from} -->|"${conn.label}"| ${conn.to}`);
      } else {
        lines.push(`    ${conn.from} --> ${conn.to}`);
      }
    });
    return lines.join('\n');
  }, [blueprintData]);

  // Save blueprint edits
  const handleSave = () => {
    requirePermission('compose_article', () => {
      let finalData: BlueprintDiagramData;
      if (isJsonMode) {
        try {
          finalData = JSON.parse(draftRawJson);
        } catch (err: any) {
          alert('Mã JSON không hợp lệ: ' + err.message);
          return;
        }
      } else {
        finalData = {
          ...blueprintData,
          title: draftTitle.trim() || 'Sơ Đồ Quy Trình & Kiến Trúc',
          subtitle: draftSubtitle.trim(),
          category: draftCategory,
          nodes: draftNodes,
          connections: draftConnections,
          asciiFlow: draftAscii.trim() || blueprintData.asciiFlow
        };
      }

      const contentString = JSON.stringify(finalData, null, 2);
      if (onUpdateUnit) {
        onUpdateUnit(unit.id, {
          type: 'blueprint_diagram',
          content: contentString,
          blueprintData: finalData,
          rawMarkdown: `\`\`\`blueprint\n${contentString}\n\`\`\``
        });
      }
      setIsEditing(false);
    });
  };

  // Quick AI optimization for blueprint with style preset
  const handleAIRegenerate = async (stylePreset: string, customInstruction?: string) => {
    setIsRegenerating(true);
    const res = await safeFetchAIJson('/api/gemini/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: JSON.stringify(blueprintData),
        stylePreset,
        instruction: customInstruction || `Chuyển hóa sơ đồ theo phong cách ${stylePreset.toUpperCase()}, tập trung vào các node hành động và khối chức năng tinh gọn. Tên node cực ngắn gọn (1-4 từ), mô tả chi tiết được đưa vào description.`,
        contextInfo
      })
    });
    setIsRegenerating(false);

    if (res.ok && res.data?.success && res.data?.blueprint) {
      const newBp = res.data.blueprint;
      setDraftTitle(newBp.title || draftTitle);
      setDraftSubtitle(newBp.subtitle || draftSubtitle);
      setDraftCategory(newBp.category || stylePreset);
      setDraftNodes(newBp.nodes || draftNodes);
      setDraftConnections(newBp.connections || draftConnections);
      setDraftAscii(newBp.asciiFlow || draftAscii);
      setDraftRawJson(JSON.stringify(newBp, null, 2));
    } else {
      alert(res.error || 'Lỗi khi gọi AI vẽ lại sơ đồ.');
    }
  };

  const isDark = theme === 'dark';

  // Category visual tag & color
  const getCategoryMeta = (cat?: string) => {
    const c = (cat || 'workflow').toLowerCase();
    if (c === 'workflow') return { label: 'WORKFLOW HÀNH ĐỘNG', icon: Zap, color: 'text-amber-400 bg-amber-950/40 border-amber-500/30' };
    if (c === 'multi_agent') return { label: 'MULTI-AGENT SWARM', icon: Brain, color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' };
    if (c === 'pipeline') return { label: 'PIPELINE DỮ LIỆU', icon: Workflow, color: 'text-sky-400 bg-sky-950/40 border-sky-500/30' };
    if (c === 'layered') return { label: 'KIẾN TRÚC PHÂN TẦNG', icon: Layers, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' };
    if (c === 'decision_tree') return { label: 'CÂY QUYẾT ĐỊNH', icon: GitBranch, color: 'text-rose-400 bg-rose-950/40 border-rose-500/30' };
    if (c === 'closed_loop') return { label: 'VÒNG LẶP KHÉP KÍN', icon: Repeat, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
    return { label: 'SƠ ĐỒ HỆ THỐNG', icon: Layers, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' };
  };

  const catMeta = getCategoryMeta(blueprintData.category);
  const CatIcon = catMeta.icon;

  return (
    <div
      id={unit.id}
      className={`group relative rounded-xl border transition-all duration-300 overflow-hidden ${
        isDark
          ? 'bg-slate-950/90 border-cyan-500/30 shadow-lg shadow-cyan-950/20'
          : 'bg-white border-cyan-200 shadow-md shadow-cyan-100'
      }`}
    >
      {/* Blueprint Header */}
      <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${
        isDark ? 'bg-slate-900/90 border-cyan-500/20' : 'bg-cyan-50/60 border-cyan-100'
      }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className={`p-1.5 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
          }`}>
            <CatIcon className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${catMeta.color}`}>
                {catMeta.label}
              </span>
              <span className={`text-[10px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {blueprintData.nodes.length} khối chức năng • {blueprintData.connections.length} luồng
              </span>
            </div>
            <h4 className={`text-sm md:text-base font-extrabold tracking-tight mt-0.5 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {blueprintData.title || 'Sơ Đồ Quy Trình & Kiến Trúc'}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Layout Mode Selector */}
          {!isEditing && activeTab === 'visual' && (
            <div className={`flex items-center rounded-lg p-0.5 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                onClick={() => setVisualLayoutMode('horizontal')}
                title="Dạng Workflow Ngang (Pipeline Flow)"
                className={`p-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  visualLayoutMode === 'horizontal'
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setVisualLayoutMode('tiered')}
                title="Dạng Phân Tầng (Tiered Stack)"
                className={`p-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  visualLayoutMode === 'tiered'
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setVisualLayoutMode('grid')}
                title="Dạng Lưới Khối (Functional Grid)"
                className={`p-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  visualLayoutMode === 'grid'
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* View Mode Tabs */}
          {!isEditing && (
            <div className={`flex items-center rounded-lg p-0.5 border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  activeTab === 'visual'
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Trực quan</span>
              </button>
              <button
                onClick={() => setActiveTab('ascii')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  activeTab === 'ascii'
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>ASCII Flow</span>
              </button>
              <button
                onClick={() => setActiveTab('mermaid')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  activeTab === 'mermaid'
                    ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Mermaid</span>
              </button>
            </div>
          )}

          {/* Edit Button */}
          {!isEditing ? (
            <button
              onClick={() => {
                requirePermission('compose_article', () => {
                  setDraftTitle(blueprintData.title);
                  setDraftSubtitle(blueprintData.subtitle || '');
                  setDraftCategory(blueprintData.category || 'workflow');
                  setDraftNodes([...blueprintData.nodes]);
                  setDraftConnections([...blueprintData.connections]);
                  setDraftAscii(blueprintData.asciiFlow || '');
                  setDraftRawJson(JSON.stringify(blueprintData, null, 2));
                  setIsEditing(true);
                });
              }}
              className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                  : 'bg-white hover:bg-slate-50 text-cyan-800 border-cyan-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Sơ Đồ</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`p-1 rounded-lg border cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-black'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtitle / Objective Bar */}
      {blueprintData.subtitle && !isEditing && (
        <div className={`px-4 py-2 text-xs border-b flex items-center gap-2 ${
          isDark ? 'bg-slate-900/40 border-slate-800/60 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'
        }`}>
          <span className="font-semibold text-cyan-400 shrink-0">🎯 Mục tiêu & Luồng chính:</span>
          <span>{blueprintData.subtitle}</span>
        </div>
      )}

      {/* Main View Area */}
      {!isEditing ? (
        <div className="p-4 space-y-6">
          {/* 1. VISUAL WORKFLOW / BLUEPRINT SCHEMATIC */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              {/* Technical Schematic Grid Canvas */}
              <div
                className={`relative rounded-xl border p-4 md:p-6 transition-all overflow-x-auto ${
                  isDark
                    ? 'bg-gradient-to-b from-slate-950 to-slate-900 border-cyan-500/20 [background-image:radial-gradient(#0891b2_0.75px,transparent_0.75px)] [background-size:18px_18px]'
                    : 'bg-gradient-to-b from-cyan-50/30 to-slate-50 border-cyan-200 [background-image:radial-gradient(#06b6d4_0.75px,transparent_0.75px)] [background-size:18px_18px]'
                }`}
              >
                {/* 1A: HORIZONTAL WORKFLOW / PROCESS STREAM (DEFAULT FOCUS) */}
                {visualLayoutMode === 'horizontal' && (
                  <div className="flex items-center gap-3 min-w-max py-4 px-2">
                    {blueprintData.nodes.map((node, idx) => {
                      const IconComp = getNodeIcon(node.icon, node.type, node.actionType);
                      const colorScheme = getNodeColor(node.type, node.actionType, theme);
                      const isSelected = selectedNodeId === node.id;
                      const isSourceNode = activeSourceNodeId === node.id;
                      const isTargetNode = activeTargetNodeId === node.id;
                      const isLast = idx === blueprintData.nodes.length - 1;
                      const nextNode = !isLast ? blueprintData.nodes[idx + 1] : null;
                      const connectingEdge = nextNode 
                        ? blueprintData.connections.find(c => (c.from === node.id && c.to === nextNode.id) || (c.from === node.id))
                        : null;
                      const isEdgeActive = activeConnection && connectingEdge && (
                        (activeConnection.from === connectingEdge.from && activeConnection.to === connectingEdge.to) ||
                        (activeConnection.from === node.id)
                      );

                      return (
                        <React.Fragment key={node.id}>
                          {/* STREAMLINED FUNCTIONAL NODE CARD */}
                          <div
                            onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                            className={`group/node flex flex-col justify-between w-56 rounded-xl border p-3 transition-all duration-200 cursor-pointer relative shrink-0 ${colorScheme.bg} ${colorScheme.border} ${
                              isSelected
                                ? (isDark ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-900/50 scale-102' : 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-200 scale-102')
                                : isSourceNode
                                ? (isDark ? 'ring-2 ring-cyan-400 shadow-md shadow-cyan-500/40 animate-pulse' : 'ring-2 ring-cyan-500 shadow-md animate-pulse')
                                : isTargetNode
                                ? (isDark ? 'ring-2 ring-indigo-400 shadow-md shadow-indigo-500/40 animate-pulse' : 'ring-2 ring-indigo-500 shadow-md animate-pulse')
                                : `hover:shadow-md hover:scale-101 ${colorScheme.glow}`
                            }`}
                          >
                            {/* Connection Indicator Overlays */}
                            {isSourceNode && (
                              <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-cyan-500 text-black shadow-xs z-10">
                                Nguồn Phát ➔
                              </div>
                            )}
                            {isTargetNode && (
                              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-indigo-500 text-white shadow-xs z-10">
                                ➔ Đích Nhận
                              </div>
                            )}

                            {/* Step Badge & Icon Header */}
                            <div className="flex items-center justify-between gap-1.5 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                  isDark ? 'bg-slate-900/90 text-cyan-300 border border-cyan-500/30' : 'bg-white text-cyan-900 border border-cyan-200 shadow-xs'
                                }`}>
                                  {String(node.stepNumber || idx + 1).padStart(2, '0')}
                                </span>
                                <div className={`p-1.5 rounded-lg ${colorScheme.iconBg}`}>
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorScheme.badge}`}>
                                {node.shortRole || getNodeTypeLabel(node.type, node.actionType)}
                              </span>
                            </div>

                            {/* Crisp, Short Functional Label (1-4 words) */}
                            <div className="my-1.5">
                              <h5 className={`text-xs md:text-sm font-extrabold tracking-tight line-clamp-2 ${
                                isDark ? 'text-slate-100' : 'text-slate-900'
                              }`}>
                                {node.label}
                              </h5>
                            </div>

                            {/* Tech Stack Badge & Details Trigger */}
                            <div className="pt-2 border-t border-slate-700/20 flex items-center justify-between gap-1 text-[10px]">
                              {node.techStack ? (
                                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded truncate max-w-[120px] ${
                                  isDark ? 'bg-slate-900/80 text-cyan-300 border border-cyan-800/40' : 'bg-white text-cyan-900 border border-cyan-200'
                                }`}>
                                  {node.techStack}
                                </span>
                              ) : <div />}

                              <span className="text-[9px] text-cyan-400 font-semibold group-hover/node:underline flex items-center">
                                Chi tiết →
                              </span>
                            </div>
                          </div>

                          {/* Connecting Arrow with Protocol/Flow Tag */}
                          {!isLast && (
                            <div
                              onClick={() => {
                                if (connectingEdge) {
                                  const cIdx = blueprintData.connections.indexOf(connectingEdge);
                                  setSelectedConnectionIdx(selectedConnectionIdx === cIdx ? null : cIdx);
                                }
                              }}
                              className={`flex flex-col items-center justify-center px-1 shrink-0 cursor-pointer transition-all ${
                                isEdgeActive ? 'scale-110' : 'hover:scale-105'
                              }`}
                              title={connectingEdge ? `Luồng kết nối: ${connectingEdge.label || 'Trực tiếp'}` : 'Đường dẫn tuần tự'}
                            >
                              {connectingEdge?.label && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mb-1 max-w-[110px] truncate text-center transition-all ${
                                  isEdgeActive
                                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/50 font-extrabold'
                                    : isDark
                                    ? 'bg-slate-900 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-white text-cyan-900 border border-cyan-200 shadow-xs'
                                }`}>
                                  {connectingEdge.label}
                                </span>
                              )}
                              <div className={`flex items-center transition-colors ${
                                isEdgeActive ? 'text-cyan-300' : 'text-cyan-400 animate-pulse'
                              }`}>
                                <div className={`h-0.5 w-6 ${
                                  isEdgeActive ? 'bg-cyan-300 h-1 shadow-sm' : isDark ? 'bg-cyan-500/60' : 'bg-cyan-400'
                                }`} />
                                <ArrowRight className={`w-4 h-4 -ml-1 ${isEdgeActive ? 'text-cyan-300 w-5 h-5' : 'text-cyan-400'}`} />
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* 1B: TIERED ARCHITECTURAL STACK */}
                {visualLayoutMode === 'tiered' && (
                  <div className="space-y-5 min-w-[580px]">
                    {tiersGrouped.map((tierGroup, tIdx) => (
                      <div key={tierGroup.tierName} className="space-y-2">
                        {/* Tier Label Header */}
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            tIdx === 0 ? 'bg-sky-400 animate-ping' : tIdx === 1 ? 'bg-indigo-400' : tIdx === 2 ? 'bg-purple-400' : 'bg-emerald-400'
                          }`} />
                          <span className={`text-xs font-bold uppercase tracking-wider ${
                            isDark ? 'text-cyan-300/90' : 'text-cyan-900'
                          }`}>
                            {tierGroup.tierName}
                          </span>
                          <div className={`h-px flex-1 ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-200'}`} />
                        </div>

                        {/* Nodes in this Tier */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {tierGroup.nodes.map((node, nIdx) => {
                            const IconComp = getNodeIcon(node.icon, node.type, node.actionType);
                            const colorScheme = getNodeColor(node.type, node.actionType, theme);
                            const isSelected = selectedNodeId === node.id;

                            return (
                              <div
                                key={node.id}
                                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                                className={`rounded-xl border p-3 transition-all cursor-pointer relative flex flex-col justify-between ${colorScheme.bg} ${colorScheme.border} ${
                                  isSelected
                                    ? (isDark ? 'ring-2 ring-cyan-400 shadow-md shadow-cyan-900/40' : 'ring-2 ring-cyan-500 shadow-md shadow-cyan-200')
                                    : 'hover:shadow-md'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      isDark ? 'bg-slate-900 text-cyan-300' : 'bg-white text-cyan-900'
                                    }`}>
                                      #{node.stepNumber || nIdx + 1}
                                    </span>
                                    <div className={`p-1.5 rounded-lg ${colorScheme.iconBg}`}>
                                      <IconComp className="w-4 h-4" />
                                    </div>
                                  </div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorScheme.badge}`}>
                                    {node.shortRole || getNodeTypeLabel(node.type, node.actionType)}
                                  </span>
                                </div>

                                <h5 className={`text-xs md:text-sm font-bold tracking-tight mb-2 ${
                                  isDark ? 'text-slate-100' : 'text-slate-900'
                                }`}>
                                  {node.label}
                                </h5>

                                <div className="pt-2 border-t border-slate-700/20 flex items-center justify-between gap-1 text-[10px]">
                                  {node.techStack && (
                                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                                      isDark ? 'bg-slate-900/80 text-cyan-300' : 'bg-white text-cyan-900'
                                    }`}>
                                      {node.techStack}
                                    </span>
                                  )}
                                  <span className="text-cyan-400 font-semibold text-[10px]">
                                    Xem mô tả ↓
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tier Separator */}
                        {tIdx < tiersGrouped.length - 1 && (
                          <div className="flex justify-center py-1">
                            <div className={`px-3 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 ${
                              isDark ? 'bg-slate-900 border-cyan-500/30 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-800'
                            }`}>
                              <span>Luồng chuyển tiếp dữ liệu & quyền hạn</span>
                              <ArrowDown className="w-3 h-3 text-cyan-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 1C: FUNCTIONAL GRID */}
                {visualLayoutMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {blueprintData.nodes.map((node, idx) => {
                      const IconComp = getNodeIcon(node.icon, node.type, node.actionType);
                      const colorScheme = getNodeColor(node.type, node.actionType, theme);
                      const isSelected = selectedNodeId === node.id;

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                          className={`rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between ${colorScheme.bg} ${colorScheme.border} ${
                            isSelected
                              ? (isDark ? 'ring-2 ring-cyan-400 shadow-md shadow-cyan-900/40' : 'ring-2 ring-cyan-500 shadow-md shadow-cyan-200')
                              : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                0{idx + 1}
                              </span>
                              <div className={`p-1.5 rounded-lg ${colorScheme.iconBg}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorScheme.badge}`}>
                              {node.shortRole || getNodeTypeLabel(node.type, node.actionType)}
                            </span>
                          </div>

                          <h5 className={`text-xs md:text-sm font-bold tracking-tight mb-2 ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {node.label}
                          </h5>

                          <div className="pt-2 border-t border-slate-700/20 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-[9px] text-cyan-400">{node.techStack || 'Node'}</span>
                            <span className="text-slate-400">Nhấp để xem ↓</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ================= 2. BẢNG CHÚ GIẢI & DIỄN GIẢI CHI TIẾT KHỐI CHỨC NĂNG ================= */}
              {/* Theo quy chuẩn: Chữ và diễn giải dài chuyển xuống dưới để hình sơ đồ thoáng và tinh gọn */}
              <div className={`rounded-xl border p-4 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/90 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-700/30">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-cyan-400" />
                    <h6 className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      Bảng Chú Giải & Diễn Giải Chi Tiết Khối Chức Năng
                    </h6>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">
                    (Nhấp vào từng khối ở sơ đồ trên để đánh dấu khối tương ứng)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {blueprintData.nodes.map((node, idx) => {
                    const IconComp = getNodeIcon(node.icon, node.type, node.actionType);
                    const colorScheme = getNodeColor(node.type, node.actionType, theme);
                    const isSelected = selectedNodeId === node.id;
                    const outgoing = blueprintData.connections.filter(c => c.from === node.id);
                    const incoming = blueprintData.connections.filter(c => c.to === node.id);

                    return (
                      <div
                        key={node.id}
                        id={`node-desc-${node.id}`}
                        onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? (isDark ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400' : 'bg-cyan-50 border-cyan-400 ring-1 ring-cyan-400')
                            : (isDark ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300')
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-slate-900 text-cyan-300 border border-slate-700' : 'bg-slate-100 text-slate-800'
                            }`}>
                              Bước {node.stepNumber || idx + 1}
                            </span>
                            <div className={`p-1 rounded-md ${colorScheme.iconBg}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <h6 className={`text-xs md:text-sm font-bold truncate ${
                              isDark ? 'text-slate-100' : 'text-slate-900'
                            }`}>
                              {node.label}
                            </h6>
                          </div>

                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${colorScheme.badge}`}>
                            {node.shortRole || getNodeTypeLabel(node.type, node.actionType)}
                          </span>
                        </div>

                        {/* Full Detailed Description */}
                        <p className={`text-xs leading-relaxed mb-2.5 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {node.description || 'Khối xử lý chức năng trong quy trình kiến trúc.'}
                        </p>

                        {/* Tech Stack & Connections Footer */}
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono pt-2 border-t border-slate-700/20 text-slate-400">
                          {node.techStack && (
                            <span className={`px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-slate-900 text-cyan-300' : 'bg-slate-100 text-cyan-900'
                            }`}>
                              ⚙️ {node.techStack}
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            {incoming.length > 0 && <span>Nhận: {incoming.length} luồng</span>}
                            {outgoing.length > 0 && <span>Gửi: {outgoing.length} luồng</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= 3. MA TRẬN LIÊN KẾT & LUỒNG TƯƠNG TÁC (REFINED CONNECTION MATRIX) ================= */}
              {blueprintData.connections.length > 0 && (
                <div className={`rounded-xl border p-4 space-y-3.5 transition-all ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/90 border-slate-200'
                }`}>
                  {/* Matrix Header & Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      }`}>
                        <Workflow className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className={`text-xs md:text-sm font-bold uppercase tracking-wider ${
                            isDark ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            Ma Trận Liên Kết & Luồng Tương Tác
                          </h6>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40' : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                          }`}>
                            {blueprintData.connections.length} đường dẫn
                          </span>
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Quy chuẩn đường truyền dữ liệu, tín hiệu điều phối và các luồng rẽ nhánh thực chiến
                        </p>
                      </div>
                    </div>

                    {/* View Switcher Tabs & Clear Selection */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(selectedConnectionIdx !== null || selectedNodeId !== null) && (
                        <button
                          onClick={() => {
                            setSelectedConnectionIdx(null);
                            setHoveredConnectionIdx(null);
                            setSelectedNodeId(null);
                            setConnectionFilter('all');
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 cursor-pointer ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Bỏ chọn</span>
                        </button>
                      )}

                      <div className={`flex items-center rounded-lg p-0.5 border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <button
                          onClick={() => setMatrixTab('flow_cards')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            matrixTab === 'flow_cards'
                              ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                          }`}
                          title="Dạng thẻ dòng chảy trực quan"
                        >
                          <Workflow className="w-3.5 h-3.5" />
                          <span>Dòng Chảy</span>
                        </button>
                        <button
                          onClick={() => setMatrixTab('matrix_grid')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            matrixTab === 'matrix_grid'
                              ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                          }`}
                          title="Ma trận tương quan N x N"
                        >
                          <Grid className="w-3.5 h-3.5" />
                          <span>Ma Trận N×N</span>
                        </button>
                        <button
                          onClick={() => setMatrixTab('detailed_table')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            matrixTab === 'detailed_table'
                              ? (isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white')
                              : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                          }`}
                          title="Bảng phân tích kỹ thuật chi tiết"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Bảng Chi Tiết</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3 text-cyan-400" />
                        Lọc luồng:
                      </span>
                      <button
                        onClick={() => setConnectionFilter('all')}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                          connectionFilter === 'all'
                            ? (isDark ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200' : 'bg-cyan-100 border-cyan-400 text-cyan-900')
                            : (isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                        }`}
                      >
                        Tất cả ({blueprintData.connections.length})
                      </button>
                      <button
                        onClick={() => setConnectionFilter('solid')}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                          connectionFilter === 'solid'
                            ? (isDark ? 'bg-sky-900/60 border-sky-400 text-sky-200' : 'bg-sky-100 border-sky-400 text-sky-900')
                            : (isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                        }`}
                      >
                        Chính tuyến ({blueprintData.connections.filter(c => (c.type || 'solid') === 'solid').length})
                      </button>
                      <button
                        onClick={() => setConnectionFilter('dashed')}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                          connectionFilter === 'dashed'
                            ? (isDark ? 'bg-amber-900/60 border-amber-400 text-amber-200' : 'bg-amber-100 border-amber-400 text-amber-900')
                            : (isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                        }`}
                      >
                        Rẽ nhánh / Phản hồi ({blueprintData.connections.filter(c => c.type === 'dashed' || c.type === 'bidirectional').length})
                      </button>

                      {selectedNodeId && (
                        <button
                          onClick={() => setConnectionFilter(connectionFilter === 'related' ? 'all' : 'related')}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-colors flex items-center gap-1 ${
                            connectionFilter === 'related'
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : (isDark ? 'bg-purple-950/40 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-800')
                          }`}
                        >
                          <GitCommit className="w-3 h-3" />
                          <span>Chỉ luồng liên quan đến khối đã chọn</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 italic">
                      * Nhấp vào từng đường dẫn để xem và đánh dấu nguồn ➔ đích
                    </span>
                  </div>

                  {/* TAB 1: VISUAL FLOW CARDS */}
                  {matrixTab === 'flow_cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredConnections.map((conn, cIdx) => {
                        const fromNode = blueprintData.nodes.find(n => n.id === conn.from);
                        const toNode = blueprintData.nodes.find(n => n.id === conn.to);
                        const isConnSelected = selectedConnectionIdx === cIdx;
                        const isConnHovered = hoveredConnectionIdx === cIdx;
                        const isActive = isConnSelected || isConnHovered;
                        const FromIcon = getNodeIcon(fromNode?.icon, fromNode?.type, fromNode?.actionType);
                        const ToIcon = getNodeIcon(toNode?.icon, toNode?.type, toNode?.actionType);
                        const fromColor = getNodeColor(fromNode?.type, fromNode?.actionType, theme);
                        const toColor = getNodeColor(toNode?.type, toNode?.actionType, theme);
                        const isDashed = conn.type === 'dashed';
                        const isBidi = conn.type === 'bidirectional';

                        return (
                          <div
                            key={cIdx}
                            onClick={() => setSelectedConnectionIdx(isConnSelected ? null : cIdx)}
                            onMouseEnter={() => setHoveredConnectionIdx(cIdx)}
                            onMouseLeave={() => setHoveredConnectionIdx(null)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                              isActive
                                ? (isDark
                                  ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-400 shadow-lg shadow-cyan-950/40'
                                  : 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-400 shadow-md shadow-cyan-100')
                                : (isDark
                                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                                  : 'bg-white border-slate-200 hover:border-slate-300')
                            }`}
                          >
                            {/* Card Header: Flow Sequence & Type Tag */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isActive
                                    ? 'bg-cyan-500 text-black font-extrabold'
                                    : (isDark ? 'bg-slate-900 text-cyan-300 border border-slate-700' : 'bg-slate-100 text-slate-800')
                                }`}>
                                  #Luồng {String(cIdx + 1).padStart(2, '0')}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  isDashed
                                    ? (isDark ? 'bg-amber-950/50 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-900 border-amber-300')
                                    : isBidi
                                    ? (isDark ? 'bg-purple-950/50 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-900 border-purple-300')
                                    : (isDark ? 'bg-sky-950/50 text-sky-300 border-sky-500/40' : 'bg-sky-50 text-sky-900 border-sky-300')
                                }`}>
                                  {isDashed ? 'Rẽ Nhánh / Điều Kiện' : isBidi ? 'Tương Tác Hai Chiều' : 'Chính Tuyến (Solid)'}
                                </span>
                              </div>

                              {/* Copy ASCII Button for Single Flow */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(`conn_${cIdx}`, `[${fromNode?.label || conn.from}] --(${conn.label || 'luồng'})--> [${toNode?.label || conn.to}]`);
                                }}
                                title="Sao chép cú pháp ASCII của đường dẫn này"
                                className={`p-1 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                                  copiedKey === `conn_${cIdx}`
                                    ? 'bg-emerald-600 text-white'
                                    : (isDark ? 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900' : 'text-slate-500 hover:text-cyan-800 hover:bg-slate-100')
                                }`}
                              >
                                {copiedKey === `conn_${cIdx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === `conn_${cIdx}` ? 'Đã sao chép' : 'ASCII'}</span>
                              </button>
                            </div>

                            {/* Center Pipeline Visual: From -> Arrow -> To */}
                            <div className="grid grid-cols-12 items-center gap-1.5 py-1">
                              {/* Source Node (4 Cols) */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNodeId(fromNode?.id || null);
                                }}
                                className={`col-span-5 p-2 rounded-lg border flex flex-col gap-1 transition-all ${
                                  fromNode?.id === selectedNodeId
                                    ? (isDark ? 'ring-2 ring-cyan-400 bg-cyan-950/80' : 'ring-2 ring-cyan-500 bg-cyan-100')
                                    : (isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-50 border-slate-200')
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">Nguồn phát:</span>
                                  <span className={`text-[8px] font-bold px-1 rounded border ${fromColor.badge}`}>
                                    #{fromNode?.stepNumber || '?'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={`p-1 rounded ${fromColor.iconBg} shrink-0`}>
                                    <FromIcon className="w-3 h-3" />
                                  </div>
                                  <span className={`text-xs font-extrabold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {fromNode?.label || conn.from}
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Connector Pipe (2 Cols) */}
                              <div className="col-span-2 flex flex-col items-center justify-center px-0.5 text-center">
                                {conn.label && (
                                  <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded truncate max-w-[85px] mb-0.5 ${
                                    isActive
                                      ? 'bg-cyan-500 text-black font-extrabold'
                                      : (isDark ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50' : 'bg-cyan-100 text-cyan-900 border border-cyan-300')
                                  }`}>
                                    {conn.label}
                                  </span>
                                )}
                                <div className="flex items-center text-cyan-400 animate-pulse">
                                  <div className={`h-0.5 w-3 ${isDark ? 'bg-cyan-500/60' : 'bg-cyan-400'}`} />
                                  <ArrowRight className="w-3.5 h-3.5 -ml-1 text-cyan-400" />
                                </div>
                              </div>

                              {/* Target Node (5 Cols) */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNodeId(toNode?.id || null);
                                }}
                                className={`col-span-5 p-2 rounded-lg border flex flex-col gap-1 transition-all ${
                                  toNode?.id === selectedNodeId
                                    ? (isDark ? 'ring-2 ring-indigo-400 bg-indigo-950/80' : 'ring-2 ring-indigo-500 bg-indigo-100')
                                    : (isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-50 border-slate-200')
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-mono text-slate-400 font-bold">Đích nhận:</span>
                                  <span className={`text-[8px] font-bold px-1 rounded border ${toColor.badge}`}>
                                    #{toNode?.stepNumber || '?'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={`p-1 rounded ${toColor.iconBg} shrink-0`}>
                                    <ToIcon className="w-3 h-3" />
                                  </div>
                                  <span className={`text-xs font-extrabold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {toNode?.label || conn.to}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Additional Metadata Details Footer */}
                            {(conn.payload || conn.description || conn.protocol) && (
                              <div className="pt-2 border-t border-slate-700/20 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                                {conn.protocol && (
                                  <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded ${
                                    isDark ? 'bg-slate-900 text-indigo-300 border border-indigo-900/50' : 'bg-slate-100 text-indigo-900'
                                  }`}>
                                    Giao thức: {conn.protocol}
                                  </span>
                                )}
                                {conn.payload && (
                                  <span className="text-slate-400 truncate max-w-[200px]" title={conn.payload}>
                                    Payload: <span className="text-cyan-300 font-mono">{conn.payload}</span>
                                  </span>
                                )}
                                {conn.description && (
                                  <span className="text-slate-400 text-[10px] italic">
                                    {conn.description}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: N x N ADJACENCY MATRIX GRID */}
                  {matrixTab === 'matrix_grid' && (
                    <div className="overflow-x-auto">
                      <div className="min-w-[620px] rounded-xl border overflow-hidden">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className={isDark ? 'bg-slate-950 text-slate-300 border-b border-slate-800' : 'bg-slate-100 text-slate-800 border-b border-slate-300'}>
                              <th className="p-2.5 font-bold font-mono text-[10px] uppercase tracking-wider border-r border-slate-800">
                                Nguồn Phát (From) \ Đích Nhận (To)
                              </th>
                              {blueprintData.nodes.map((n, nIdx) => (
                                <th key={n.id} className="p-2 font-bold text-center border-r border-slate-800/60 last:border-r-0 max-w-[120px]">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] font-mono text-cyan-400">#{n.stepNumber || nIdx + 1}</span>
                                    <span className="truncate max-w-[100px] text-[11px] font-bold" title={n.label}>
                                      {n.label}
                                    </span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {blueprintData.nodes.map((rowNode, rIdx) => (
                              <tr
                                key={rowNode.id}
                                className={`border-b last:border-b-0 ${
                                  rIdx % 2 === 0
                                    ? (isDark ? 'bg-slate-900/40' : 'bg-white')
                                    : (isDark ? 'bg-slate-950/40' : 'bg-slate-50/60')
                                }`}
                              >
                                {/* Row Header (Source Node) */}
                                <td className={`p-2.5 font-bold border-r border-slate-800/60 ${
                                  isDark ? 'text-slate-200' : 'text-slate-900'
                                }`}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono text-cyan-400">#{rowNode.stepNumber || rIdx + 1}</span>
                                    <span className="truncate max-w-[140px] text-xs font-bold" title={rowNode.label}>
                                      {rowNode.label}
                                    </span>
                                  </div>
                                </td>

                                {/* Grid Intersections */}
                                {blueprintData.nodes.map((colNode) => {
                                  const conn = blueprintData.connections.find(c => c.from === rowNode.id && c.to === colNode.id);
                                  const isSelf = rowNode.id === colNode.id;
                                  const isSelectedConn = conn && selectedConnectionIdx !== null && blueprintData.connections[selectedConnectionIdx] === conn;

                                  return (
                                    <td
                                      key={colNode.id}
                                      onClick={() => {
                                        if (conn) {
                                          const idx = blueprintData.connections.indexOf(conn);
                                          setSelectedConnectionIdx(isSelectedConn ? null : idx);
                                        }
                                      }}
                                      className={`p-2 text-center border-r border-slate-800/40 last:border-r-0 transition-colors ${
                                        isSelf
                                          ? (isDark ? 'bg-slate-900/80 text-slate-600' : 'bg-slate-100 text-slate-400')
                                          : conn
                                          ? (isSelectedConn
                                            ? (isDark ? 'bg-cyan-950 border-cyan-400 ring-1 ring-cyan-400' : 'bg-cyan-100 border-cyan-400 ring-1 ring-cyan-400')
                                            : (isDark ? 'hover:bg-cyan-950/40 cursor-pointer' : 'hover:bg-cyan-50 cursor-pointer'))
                                          : ''
                                      }`}
                                    >
                                      {isSelf ? (
                                        <span className="text-slate-600 font-mono text-xs">●</span>
                                      ) : conn ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <div className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold flex items-center gap-1 ${
                                            isSelectedConn
                                              ? 'bg-cyan-500 text-black'
                                              : (isDark ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/40' : 'bg-cyan-100 text-cyan-800 border border-cyan-300')
                                          }`}>
                                            <span>➔</span>
                                            <span className="truncate max-w-[80px]">{conn.label || 'Liên kết'}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-slate-700/60 font-mono text-xs">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DETAILED MATRIX TABLE */}
                  {matrixTab === 'detailed_table' && (
                    <div className="overflow-x-auto">
                      <div className="min-w-[650px] rounded-xl border overflow-hidden">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className={isDark ? 'bg-slate-950 text-slate-300 border-b border-slate-800' : 'bg-slate-100 text-slate-800 border-b border-slate-300'}>
                              <th className="p-2.5 font-mono text-[10px] font-bold">MÃ LUỒNG</th>
                              <th className="p-2.5 font-bold">KHỐI NGUỒN (FROM)</th>
                              <th className="p-2.5 font-bold">TÍN HIỆU / DỮ LIỆU</th>
                              <th className="p-2.5 font-bold">GIAO THỨC & LOẠI</th>
                              <th className="p-2.5 font-bold">KHỐI ĐÍCH (TO)</th>
                              <th className="p-2.5 font-bold">MỤC ĐÍCH VẬN HÀNH</th>
                              <th className="p-2.5 font-bold text-center">THAO TÁC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredConnections.map((conn, cIdx) => {
                              const fromNode = blueprintData.nodes.find(n => n.id === conn.from);
                              const toNode = blueprintData.nodes.find(n => n.id === conn.to);
                              const isSelected = selectedConnectionIdx === cIdx;

                              return (
                                <tr
                                  key={cIdx}
                                  onClick={() => setSelectedConnectionIdx(isSelected ? null : cIdx)}
                                  className={`border-b last:border-b-0 cursor-pointer transition-colors ${
                                    isSelected
                                      ? (isDark ? 'bg-cyan-950/80 border-cyan-400' : 'bg-cyan-50 border-cyan-300')
                                      : cIdx % 2 === 0
                                      ? (isDark ? 'bg-slate-900/40 hover:bg-slate-800/50' : 'bg-white hover:bg-slate-50')
                                      : (isDark ? 'bg-slate-950/40 hover:bg-slate-800/50' : 'bg-slate-50/70 hover:bg-slate-100/70')
                                  }`}
                                >
                                  {/* Code */}
                                  <td className="p-2.5 font-mono text-[10px] font-bold text-cyan-400">
                                    #L{String(cIdx + 1).padStart(2, '0')}
                                  </td>

                                  {/* From Node */}
                                  <td className="p-2.5 font-bold">
                                    <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>
                                      {fromNode?.label || conn.from}
                                    </span>
                                    {fromNode?.shortRole && (
                                      <span className="block text-[9px] text-slate-400 font-normal">
                                        ({fromNode.shortRole})
                                      </span>
                                    )}
                                  </td>

                                  {/* Data Label */}
                                  <td className="p-2.5">
                                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                      isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                    }`}>
                                      {conn.label || 'Dữ liệu luồng'}
                                    </span>
                                  </td>

                                  {/* Protocol & Type */}
                                  <td className="p-2.5 space-y-0.5">
                                    <span className={`inline-block text-[9px] font-mono px-1 rounded ${
                                      isDark ? 'bg-slate-900 text-indigo-300' : 'bg-slate-100 text-indigo-900'
                                    }`}>
                                      {conn.protocol || 'Tuần tự (Sync)'}
                                    </span>
                                    <span className="block text-[9px] text-slate-400">
                                      {conn.type === 'dashed' ? 'Rẽ nhánh' : conn.type === 'bidirectional' ? 'Hai chiều' : 'Chính tuyến'}
                                    </span>
                                  </td>

                                  {/* To Node */}
                                  <td className="p-2.5 font-bold">
                                    <span className={isDark ? 'text-indigo-300' : 'text-indigo-900'}>
                                      {toNode?.label || conn.to}
                                    </span>
                                    {toNode?.shortRole && (
                                      <span className="block text-[9px] text-slate-400 font-normal">
                                        ({toNode.shortRole})
                                      </span>
                                    )}
                                  </td>

                                  {/* Purpose / Description */}
                                  <td className="p-2.5 text-[11px] text-slate-300 max-w-[180px]">
                                    {conn.description || `Truyền chuyển tiếp kết quả từ khối ${fromNode?.label || conn.from} sang ${toNode?.label || conn.to}.`}
                                  </td>

                                  {/* Actions */}
                                  <td className="p-2.5 text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(`table_conn_${cIdx}`, `[${fromNode?.label || conn.from}] --(${conn.label || 'luồng'})--> [${toNode?.label || conn.to}]`);
                                      }}
                                      className={`p-1 rounded text-[10px] font-mono flex items-center justify-center mx-auto cursor-pointer ${
                                        copiedKey === `table_conn_${cIdx}`
                                          ? 'bg-emerald-600 text-white'
                                          : (isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                                      }`}
                                    >
                                      {copiedKey === `table_conn_${cIdx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Architectural Notes & Risk Prevention */}
              {Array.isArray(blueprintData.notes) && blueprintData.notes.length > 0 && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold">Lưu ý Kiến Trúc & Chế Độ Lỗi (Failure Modes) Đã Được Phòng Ngừa:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {blueprintData.notes.map((note, nIdx) => (
                        <li key={nIdx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ASCII TEXT FLOW VIEW (AGENTS.md Rule 6 compliant) */}
          {activeTab === 'ascii' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  <span>Sơ đồ dòng chảy ký tự phẳng (ASCII Flowchart)</span>
                </div>
                <button
                  onClick={() => handleCopy('ascii', blueprintData.asciiFlow || '')}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                    copiedKey === 'ascii'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copiedKey === 'ascii' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'ascii' ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              <pre className={`p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border ${
                isDark
                  ? 'bg-slate-950 border-cyan-500/30 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-cyan-200'
              }`}>
                <code>{blueprintData.asciiFlow || 'Chưa có chuỗi ASCII Flow'}</code>
              </pre>

              <p className="text-[11px] text-slate-400 italic">
                * Sơ đồ này tuân thủ Quy tắc 6 của phương pháp luận OG: Trực quan, phẳng, gãy gọn, quét mắt hiểu ngay trên mọi thiết bị.
              </p>
            </div>
          )}

          {/* 3. MERMAID CODE VIEW */}
          {activeTab === 'mermaid' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Mã nguồn biểu đồ Mermaid (Flowchart)</span>
                </div>
                <button
                  onClick={() => handleCopy('mermaid', generatedMermaid)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                    copiedKey === 'mermaid'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copiedKey === 'mermaid' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'mermaid' ? 'Đã sao chép' : 'Sao chép mã Mermaid'}</span>
                </button>
              </div>

              <pre className={`p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border ${
                isDark
                  ? 'bg-slate-950 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-900 border-slate-700 text-indigo-200'
              }`}>
                <code>{generatedMermaid}</code>
              </pre>
            </div>
          )}

          {/* 4. JSON DATA VIEW */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Dữ liệu Cấu trúc Blueprint (JSON Schema)</span>
                </div>
                <button
                  onClick={() => handleCopy('json', JSON.stringify(blueprintData, null, 2))}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                    copiedKey === 'json'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copiedKey === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'json' ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                </button>
              </div>

              <pre className={`p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border max-h-96 ${
                isDark
                  ? 'bg-slate-950 border-purple-500/30 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-purple-200'
              }`}>
                <code>{JSON.stringify(blueprintData, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* ================= EDITING MODE ================= */
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Trình Biên Soạn Sơ Đồ Kiến Trúc & Workflow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsJsonMode(!isJsonMode)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-semibold cursor-pointer ${
                  isJsonMode
                    ? 'bg-purple-600 text-white border-purple-500'
                    : isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                {isJsonMode ? 'Chuyển sang giao diện Visual' : 'Chỉnh sửa JSON trực tiếp'}
              </button>
            </div>
          </div>

          {/* AI Blueprint Style Switcher & Optimizer */}
          <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
            isDark ? 'bg-slate-900/80 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <Brain className="w-4 h-4" />
                <span>AI Tổng Công Trình Sư: Chuyển Đổi Phong Cách Sơ Đồ 1-Chạm</span>
              </div>
              {isRegenerating && (
                <div className="flex items-center gap-1 text-[11px] text-cyan-400 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tái cấu trúc sơ đồ...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleAIRegenerate('workflow')}
                disabled={isRegenerating}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60' : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Workflow Hành Động</span>
              </button>

              <button
                onClick={() => handleAIRegenerate('multi_agent')}
                disabled={isRegenerating}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/60' : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-50'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>🤖 Multi-Agent Swarms</span>
              </button>

              <button
                onClick={() => handleAIRegenerate('pipeline')}
                disabled={isRegenerating}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-sky-950/40 border-sky-500/40 text-sky-300 hover:bg-sky-900/60' : 'bg-white border-sky-300 text-sky-900 hover:bg-sky-50'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 text-sky-400" />
                <span>🌊 Pipeline Dữ Liệu</span>
              </button>

              <button
                onClick={() => handleAIRegenerate('layered')}
                disabled={isRegenerating}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60' : 'bg-white border-indigo-300 text-indigo-900 hover:bg-indigo-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>🏛️ Phân Tầng L1-L4</span>
              </button>

              <button
                onClick={() => handleAIRegenerate('decision_tree')}
                disabled={isRegenerating}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60' : 'bg-white border-rose-300 text-rose-900 hover:bg-rose-50'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-rose-400" />
                <span>🔀 Cây Quyết Định</span>
              </button>

              <button
                onClick={() => handleAIRegenerate('closed_loop')}
                disabled={isRegenerating}
                className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60' : 'bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-50'
                }`}
              >
                <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                <span>🔄 Vòng Lặp Khép Kín</span>
              </button>
            </div>
          </div>

          {!isJsonMode ? (
            <div className="space-y-4">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Tiêu đề Sơ Đồ</label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-sm font-bold border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Phụ đề / Mục tiêu</label>
                  <input
                    type="text"
                    value={draftSubtitle}
                    onChange={e => setDraftSubtitle(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-sm border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              {/* Node List Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-cyan-400">
                    Danh Sách Khối Chức Năng ({draftNodes.length} khối)
                  </label>
                  <button
                    onClick={() => {
                      const newId = `node_${Date.now()}`;
                      setDraftNodes([
                        ...draftNodes,
                        {
                          id: newId,
                          label: 'Khối Chức Năng Mới',
                          shortRole: 'Xử Lý',
                          stepNumber: draftNodes.length + 1,
                          type: 'process',
                          description: 'Mô tả chi tiết nhiệm vụ của khối này...',
                          techStack: 'Module',
                          icon: 'Zap',
                          status: 'active'
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Khối</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {draftNodes.map((node, nIdx) => (
                    <div
                      key={node.id}
                      className={`p-3 rounded-xl border space-y-2 ${
                        isDark ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-mono font-bold text-cyan-400">#{nIdx + 1}</span>
                          <input
                            type="text"
                            value={node.label}
                            onChange={e => {
                              const updated = [...draftNodes];
                              updated[nIdx].label = e.target.value;
                              setDraftNodes(updated);
                            }}
                            placeholder="Tên chức năng cực ngắn gọn (1-4 từ)..."
                            className={`flex-1 px-2.5 py-1 rounded text-xs font-bold border outline-none ${
                              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-black'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={node.shortRole || ''}
                            onChange={e => {
                              const updated = [...draftNodes];
                              updated[nIdx].shortRole = e.target.value;
                              setDraftNodes(updated);
                            }}
                            placeholder="Vai trò (1-2 từ)"
                            className={`w-24 px-2 py-1 rounded text-[11px] border outline-none ${
                              isDark ? 'bg-slate-950 border-slate-700 text-amber-300' : 'bg-slate-50 border-slate-200 text-amber-800'
                            }`}
                          />

                          <button
                            onClick={() => setDraftNodes(draftNodes.filter((_, idx) => idx !== nIdx))}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                            title="Xóa khối này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Detailed Description */}
                      <div>
                        <textarea
                          rows={2}
                          value={node.description || ''}
                          onChange={e => {
                            const updated = [...draftNodes];
                            updated[nIdx].description = e.target.value;
                            setDraftNodes(updated);
                          }}
                          placeholder="Mô tả chi tiết nhiệm vụ và vai trò thực chiến (sẽ hiển thị ở bảng chú giải bên dưới)..."
                          className={`w-full p-2 rounded text-xs border outline-none ${
                            isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        />
                      </div>

                      {/* Tech Stack & Tier */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <input
                          type="text"
                          value={node.techStack || ''}
                          onChange={e => {
                            const updated = [...draftNodes];
                            updated[nIdx].techStack = e.target.value;
                            setDraftNodes(updated);
                          }}
                          placeholder="Công nghệ / Tech stack (vd: Gemini 3.7, Fastify)..."
                          className={`px-2 py-1 rounded border outline-none ${
                            isDark ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-200 text-cyan-800'
                          }`}
                        />
                        <input
                          type="text"
                          value={node.tier || ''}
                          onChange={e => {
                            const updated = [...draftNodes];
                            updated[nIdx].tier = e.target.value;
                            setDraftNodes(updated);
                          }}
                          placeholder="Tên bước / Tầng (vd: Bước 1: Tiếp Nhận)..."
                          className={`px-2 py-1 rounded border outline-none ${
                            isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Connection Management Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-cyan-400" />
                    <label className="text-xs font-bold text-slate-300 uppercase">
                      Quản Lý Ma Trận Đường Dẫn & Luồng Tương Tác ({draftConnections.length} đường dẫn)
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      if (draftNodes.length < 2) return;
                      setDraftConnections([
                        ...draftConnections,
                        {
                          from: draftNodes[0].id,
                          to: draftNodes[1]?.id || draftNodes[0].id,
                          label: 'Dữ liệu luồng mới',
                          type: 'solid',
                          protocol: 'Sync / Event'
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Đường Dẫn</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {draftConnections.map((conn, cIdx) => (
                    <div
                      key={cIdx}
                      className={`p-3 rounded-xl border space-y-2 ${
                        isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">#Luồng {cIdx + 1}</span>
                        <button
                          onClick={() => setDraftConnections(draftConnections.filter((_, idx) => idx !== cIdx))}
                          className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                          title="Xóa đường dẫn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Source -> Target dropdown selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 text-xs">
                        {/* From Node */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Khối Nguồn (From):</label>
                          <select
                            value={conn.from}
                            onChange={e => {
                              const updated = [...draftConnections];
                              updated[cIdx].from = e.target.value;
                              setDraftConnections(updated);
                            }}
                            className={`w-full p-1.5 rounded text-xs border outline-none font-medium ${
                              isDark ? 'bg-slate-950 border-slate-700 text-cyan-300' : 'bg-slate-50 border-slate-200 text-cyan-900'
                            }`}
                          >
                            {draftNodes.map(n => (
                              <option key={n.id} value={n.id}>
                                #{n.stepNumber || '?'} {n.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2 flex justify-center text-cyan-400">
                          <ArrowRight className="w-4 h-4 hidden sm:block" />
                          <ArrowDown className="w-4 h-4 block sm:hidden" />
                        </div>

                        {/* To Node */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Khối Đích (To):</label>
                          <select
                            value={conn.to}
                            onChange={e => {
                              const updated = [...draftConnections];
                              updated[cIdx].to = e.target.value;
                              setDraftConnections(updated);
                            }}
                            className={`w-full p-1.5 rounded text-xs border outline-none font-medium ${
                              isDark ? 'bg-slate-950 border-slate-700 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-900'
                            }`}
                          >
                            {draftNodes.map(n => (
                              <option key={n.id} value={n.id}>
                                #{n.stepNumber || '?'} {n.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Label & Type & Protocol */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Nhãn Tín Hiệu / Dữ Liệu:</label>
                          <input
                            type="text"
                            value={conn.label || ''}
                            onChange={e => {
                              const updated = [...draftConnections];
                              updated[cIdx].label = e.target.value;
                              setDraftConnections(updated);
                            }}
                            placeholder="vd: Payload JSON, Token stream..."
                            className={`w-full px-2 py-1 rounded text-xs border outline-none ${
                              isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-black'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Loại Đường Dẫn:</label>
                          <select
                            value={conn.type || 'solid'}
                            onChange={e => {
                              const updated = [...draftConnections];
                              updated[cIdx].type = e.target.value as 'solid' | 'dashed' | 'bidirectional';
                              setDraftConnections(updated);
                            }}
                            className={`w-full p-1.5 rounded text-xs border outline-none ${
                              isDark ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <option value="solid">Chính tuyến (Solid)</option>
                            <option value="dashed">Rẽ nhánh / Điều kiện (Dashed)</option>
                            <option value="bidirectional">Hai chiều (Bidirectional)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Giao Thức (Protocol):</label>
                          <input
                            type="text"
                            value={conn.protocol || ''}
                            onChange={e => {
                              const updated = [...draftConnections];
                              updated[cIdx].protocol = e.target.value;
                              setDraftConnections(updated);
                            }}
                            placeholder="vd: REST / WebSocket..."
                            className={`w-full px-2 py-1 rounded text-xs border outline-none font-mono ${
                              isDark ? 'bg-slate-950 border-slate-700 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-800'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ASCII Flow String Editor */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">
                  Sơ đồ Ký Tự Phẳng (ASCII Flowchart theo Quy tắc 6)
                </label>
                <input
                  type="text"
                  value={draftAscii}
                  onChange={e => setDraftAscii(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-cyan-800'
                  }`}
                />
              </div>
            </div>
          ) : (
            /* JSON Raw Editor */
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-purple-400">JSON Schema Blueprint:</label>
              <textarea
                rows={15}
                value={draftRawJson}
                onChange={e => setDraftRawJson(e.target.value)}
                className="w-full p-3 rounded-xl font-mono text-xs bg-slate-950 text-purple-300 border border-purple-500/40 outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
