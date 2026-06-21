import { Eye, RefreshCcw, Trash2 } from 'lucide-react';
import type { HistoryRecord } from '../types';
import { HistoryDetail } from './HistoryDetail';

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return new Date(value).toLocaleDateString();
}

export function HistoryCard({
  record,
  expanded,
  onToggle,
  onDelete,
  onRegenerate,
  onCopy,
}: {
  record: HistoryRecord;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (record: HistoryRecord) => void;
  onRegenerate: (record: HistoryRecord) => void;
  onCopy: (text: string) => void;
}) {
  const summary = record.topic || record.article.replace(/\s+/g, ' ').slice(0, 80) || '未填写摘要';

  return (
    <li className="n-row group py-4">
      <button type="button" onClick={onToggle} className="block w-full text-left">
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="rounded bg-rail px-2 py-0.5 text-ink">{record.country}</span>
          <span>·</span>
          <span>{record.platform}</span>
          {record.angle && (
            <>
              <span>·</span>
              <span className="truncate">{record.angle}</span>
            </>
          )}
          <span className="ml-auto whitespace-nowrap">{relativeTime(record.createdAt)}</span>
        </div>
        <h3 className="mt-2 text-base font-medium text-ink">{record.title || '未命名内容'}</h3>
        <p className="mt-1 truncate text-sm text-muted">{summary}</p>
      </button>

      <div className="n-row-actions mt-3 flex flex-wrap items-center gap-1">
        <button type="button" onClick={onToggle} className="n-btn">
          <Eye className="h-3.5 w-3.5" />
          查看详情
        </button>
        <button type="button" onClick={() => onRegenerate(record)} className="n-btn-ghost">
          <RefreshCcw className="h-3.5 w-3.5" />
          重新生成
        </button>
        <button
          type="button"
          onClick={() => onDelete(record)}
          className="n-btn-danger ml-auto inline-flex items-center gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          删除
        </button>
      </div>

      {expanded && (
        <HistoryDetail
          record={record}
          onClose={onToggle}
          onRegenerate={onRegenerate}
          onCopy={onCopy}
        />
      )}
    </li>
  );
}
