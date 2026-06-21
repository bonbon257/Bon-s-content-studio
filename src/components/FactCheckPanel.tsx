import { AlertTriangle, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import type { FactCheckItem, FactCheckLevel } from '../types';

export type FactCheckStatus = 'pending' | 'verified' | 'needs-edit';

interface FactCheckPanelProps {
  items: FactCheckItem[];
  statuses: Record<number, FactCheckStatus>;
  onMark: (index: number, status: FactCheckStatus) => void;
}

const LEVEL: Record<FactCheckLevel, { label: string; icon: typeof CheckCircle2; color: string }> = {
  confirmed: { label: '已确认', icon: CheckCircle2, color: '#2EAADC' },
  uncertain: { label: '待核实', icon: HelpCircle, color: '#9CA3AF' },
  softened: { label: '可能夸张', icon: AlertTriangle, color: '#EB5757' },
};

const STATUS_LABEL: Record<FactCheckStatus, string> = {
  pending: '未处理',
  verified: '已核实',
  'needs-edit': '需修改',
};

export function FactCheckPanel({ items, statuses, onMark }: FactCheckPanelProps) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  const summary = items.reduce(
    (acc, item) => {
      acc[item.level] = (acc[item.level] || 0) + 1;
      return acc;
    },
    {} as Record<FactCheckLevel, number>,
  );

  return (
    <div className="mt-6 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition hover:bg-rail"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 text-muted transition ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-sm font-medium text-ink">事实核查</span>
        <span className="text-xs text-muted">
          {[
            summary.confirmed && `已确认 ${summary.confirmed}`,
            summary.uncertain && `待核实 ${summary.uncertain}`,
            summary.softened && `已模糊 ${summary.softened}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </button>

      {open && (
        <ul className="mt-3 space-y-3 pl-6">
          {items.map((item, idx) => {
            const meta = LEVEL[item.level] || LEVEL.uncertain;
            const Icon = meta.icon;
            const status = statuses[idx] || 'pending';
            return (
              <li key={idx} className="border-l border-line pl-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-muted">
                    <Icon className="h-3 w-3" style={{ color: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{STATUS_LABEL[status]}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-ink">{item.claim}</p>
                {item.note && (
                  <p className="mt-1 text-xs leading-5 text-muted">{item.note}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => onMark(idx, status === 'verified' ? 'pending' : 'verified')}
                    className={`rounded px-2 py-0.5 text-xs transition ${
                      status === 'verified'
                        ? 'bg-accent text-white'
                        : 'bg-hover text-ink hover:bg-line'
                    }`}
                  >
                    标记已核实
                  </button>
                  <button
                    type="button"
                    onClick={() => onMark(idx, status === 'needs-edit' ? 'pending' : 'needs-edit')}
                    className={`rounded px-2 py-0.5 text-xs transition ${
                      status === 'needs-edit'
                        ? 'bg-tag text-white'
                        : 'bg-hover text-ink hover:bg-line'
                    }`}
                  >
                    需修改
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
