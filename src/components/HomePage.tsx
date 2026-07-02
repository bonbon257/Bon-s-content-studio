import {
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  MessageCircle,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const FEATURE_CARDS = [
  {
    key: 'article',
    label: '文章改写',
    desc: '粘贴爆文原文，AI 自动分析角度并改写成小红书风格',
    icon: PenLine,
    gradient: 'from-[#9B7EDE]/20 to-[#9B7EDE]/5',
    iconBg: 'bg-[#9B7EDE]/15',
    iconColor: 'text-[#7C6BFF]',
  },
  {
    key: 'topic',
    label: '话题创作',
    desc: '输入话题关键词，从零开始生成爆款内容',
    icon: Sparkles,
    gradient: 'from-[#F59E6B]/20 to-[#F59E6B]/5',
    iconBg: 'bg-[#F59E6B]/15',
    iconColor: 'text-[#E88A50]',
  },
  {
    key: 'research',
    label: '资料检索',
    desc: 'AI 辅助搜索资料，提升内容事实准确性',
    icon: Search,
    gradient: 'from-[#7FD99F]/20 to-[#7FD99F]/5',
    iconBg: 'bg-[#7FD99F]/15',
    iconColor: 'text-[#5BC482]',
  },
  {
    key: 'chat',
    label: '聊天生成',
    desc: '直接为正文生成或编辑模拟聊天记录',
    icon: MessageCircle,
    gradient: 'from-[#64B5F6]/20 to-[#64B5F6]/5',
    iconBg: 'bg-[#64B5F6]/15',
    iconColor: 'text-[#42A5F5]',
  },
  {
    key: 'app',
    label: 'APP推荐',
    desc: '生成小红书风格的 APP 分享笔记',
    icon: BookOpen,
    gradient: 'from-[#FF8A80]/20 to-[#FF8A80]/5',
    iconBg: 'bg-[#FF8A80]/15',
    iconColor: 'text-[#E57373]',
  },
  {
    key: 'document',
    label: '按文档生成',
    desc: '基于文档内容批量生成多条发布文案',
    icon: FileText,
    gradient: 'from-[#CE93D8]/20 to-[#CE93D8]/5',
    iconBg: 'bg-[#CE93D8]/15',
    iconColor: 'text-[#AB47BC]',
  },
];

type WorkEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  type: string;
};

const STORAGE_KEY = 'ht-dashboard-entries';

function loadEntries(): WorkEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: WorkEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function HomePage({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const [entries, setEntries] = useState<WorkEntry[]>(loadEntries);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('content');
  const [showAddForm, setShowAddForm] = useState(false);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (number | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [currentMonth]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, WorkEntry[]> = {};
    entries.forEach((e) => {
      (map[e.date] ??= []).push(e);
    });
    return map;
  }, [entries]);

  const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];

  function prevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(formatDate(today));
  }

  function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleDayClick(day: number | null) {
    if (!day) return;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
    setShowAddForm(false);
  }

  function handleAddEntry() {
    if (!selectedDate || !newContent.trim()) return;
    const entry: WorkEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: selectedDate,
      content: newContent.trim(),
      type: newType,
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    setNewContent('');
  }

  function handleDeleteEntry(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  const todayStr = formatDate(new Date());
  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const monthName = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  const typeLabels: Record<string, string> = {
    content: '创作',
    idea: '灵感',
    review: '复盘',
    plan: '计划',
    other: '其他',
  };

  return (
    <div className="min-h-full space-y-6 p-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2B55]">
            <LayoutDashboard className="mr-2 inline-block h-7 w-7 text-[#7C6BFF]" />
            工作台
          </h1>
          <p className="mt-1 text-sm text-[#8E8BA8]">管理创作内容，追踪工作进度</p>
        </div>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-xl bg-[#7C6BFF]/10 px-4 py-2 text-sm font-semibold text-[#7C6BFF] transition hover:bg-[#7C6BFF]/20"
        >
          <Calendar className="mr-1.5 inline-block h-4 w-4" />
          今天
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: '今日待办', value: entriesByDate[todayStr]?.length ?? 0, color: 'bg-[#9B7EDE]/10 text-[#7C6BFF]' },
          { label: '本月记录', value: Object.keys(entriesByDate).filter((d) => d.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`)).length, color: 'bg-[#7FD99F]/10 text-[#5BC482]' },
          { label: '总创作', value: entries.filter((e) => e.type === 'content').length, color: 'bg-[#F59E6B]/10 text-[#E88A50]' },
          { label: '灵感库', value: entries.filter((e) => e.type === 'idea').length, color: 'bg-[#64B5F6]/10 text-[#42A5F5]' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#E8E6F0]/60 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-[#8E8BA8]">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#2D2B55]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Feature cards - centered, above calendar */}
      <div>
        <h2 className="mb-4 text-center text-lg font-bold text-[#2D2B55]">
          <Sparkles className="mr-2 inline-block h-5 w-5 text-[#7C6BFF]" />
          功能导览
        </h2>
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => onNavigate(card.key)}
                className={`group rounded-2xl border border-[#E8E6F0]/60 bg-gradient-to-br ${card.gradient} p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className={`mb-3 inline-flex rounded-xl ${card.iconBg} p-3`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <h3 className="text-sm font-bold text-[#2D2B55]">{card.label}</h3>
                <p className="mt-1 text-xs leading-5 text-[#8E8BA8]">{card.desc}</p>
                <span className={`mt-3 inline-block text-xs font-semibold ${card.iconColor} opacity-0 transition-opacity group-hover:opacity-100`}>
                  进入 →
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar - right-aligned, compact */}
      <div className="mx-auto grid max-w-3xl gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Recent entries (left) */}
        <div className="space-y-6">
          {/* Quick target */}
          <div className="rounded-2xl bg-gradient-to-br from-[#7C6BFF] to-[#9B7EDE] p-5 text-white shadow-lg shadow-[#7C6BFF]/20">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h3 className="font-bold">今日目标</h3>
            </div>
            <p className="mt-3 text-sm text-white/80">选择上方功能卡片，快速开始创作</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {FEATURE_CARDS.slice(0, 3).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onNavigate(f.key)}
                  className="rounded-xl bg-white/15 px-3 py-2.5 text-center text-xs font-medium backdrop-blur transition hover:bg-white/25"
                >
                  {f.label.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Recent entries */}
          <div className="rounded-2xl border border-[#E8E6F0]/60 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#2D2B55]">近期记录</h3>
            <ul className="mt-3 space-y-2.5">
              {entries
                .slice()
                .reverse()
                .slice(0, 5)
                .map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5">
                    <span className="mt-1 shrink-0 h-2 w-2 rounded-full bg-[#7C6BFF]" />
                    <div>
                      <p className="text-sm text-[#2D2B55]">{entry.content.slice(0, 40)}{entry.content.length > 40 ? '...' : ''}</p>
                      <p className="mt-0.5 text-xs text-[#B8B5CC]">
                        {entry.date} · {typeLabels[entry.type] || entry.type}
                      </p>
                    </div>
                  </li>
                ))}
              {entries.length === 0 && (
                <li className="text-xs text-[#B8B5CC]">暂无记录</li>
              )}
            </ul>
          </div>
        </div>

        {/* Calendar (right, compact) */}
        <div className="rounded-2xl border border-[#E8E6F0]/60 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 text-sm transition hover:bg-[#F5F4FA]">
              ←
            </button>
            <h2 className="text-sm font-bold text-[#2D2B55]">{monthName}</h2>
            <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 text-sm transition hover:bg-[#F5F4FA]">
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {weekDayNames.map((name) => (
              <div key={name} className="py-1 text-[10px] font-medium text-[#8E8BA8]">
                {name}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`pad-${idx}`} />;

              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasEntries = entriesByDate[dateStr]?.length > 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`relative flex h-8 w-full flex-col items-center justify-center rounded-lg text-xs transition ${
                    isSelected
                      ? 'bg-[#7C6BFF] text-white shadow shadow-[#7C6BFF]/25'
                      : isToday
                        ? 'bg-[#7C6BFF]/10 text-[#7C6BFF] font-bold'
                        : 'text-[#2D2B55] hover:bg-[#F5F4FA]'
                  }`}
                >
                  {day}
                  {hasEntries && !isSelected && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#7FD99F]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date entries */}
          {selectedDate && (
            <div className="mt-3 border-t border-[#E8E6F0]/60 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#2D2B55]">{selectedDate}</h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1 rounded-lg bg-[#7C6BFF]/10 px-2 py-1 text-[10px] font-semibold text-[#7C6BFF] transition hover:bg-[#7C6BFF]/20"
                >
                  <Plus className="h-3 w-3" />
                  添加
                </button>
              </div>

              {showAddForm && (
                <div className="mt-2 space-y-1.5 rounded-xl bg-[#F5F4FA] p-2.5">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="rounded-lg border border-[#E8E6F0]/60 bg-white px-2 py-1 text-xs text-[#2D2B55]"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="输入工作内容..."
                    className="w-full rounded-lg border border-[#E8E6F0]/60 bg-white px-2.5 py-1.5 text-xs text-[#2D2B55] placeholder-[#B8B5CC]"
                    rows={2}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setNewContent(''); }}
                      className="rounded-lg px-2.5 py-1 text-[10px] text-[#8E8BA8] transition hover:bg-[#E8E6F0]/40"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleAddEntry}
                      disabled={!newContent.trim()}
                      className="rounded-lg bg-[#7C6BFF] px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-[#6A5AE0] disabled:opacity-40"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}

              {selectedEntries.length === 0 && !showAddForm ? (
                <p className="mt-2 text-[10px] text-[#B8B5CC]">暂无记录</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {selectedEntries.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2 rounded-lg bg-[#F5F4FA] p-2">
                      <span className="mt-0.5 shrink-0 rounded bg-[#7C6BFF]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7C6BFF]">
                        {typeLabels[entry.type] || entry.type}
                      </span>
                      <span className="flex-1 text-xs text-[#2D2B55]">{entry.content}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="shrink-0 text-[10px] text-[#B8B5CC] transition hover:text-[#E57373]"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
