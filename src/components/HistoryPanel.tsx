import { Clock3, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { HistoryRecord } from '../types';
import { HistoryCard } from './HistoryCard';

export function HistoryPanel({
  records,
  onDelete,
  onClear,
  onRegenerate,
  onCopy,
}: {
  records: HistoryRecord[];
  onDelete: (record: HistoryRecord) => void;
  onClear: () => void;
  onRegenerate: (record: HistoryRecord) => void;
  onCopy: (text: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((record) =>
      [
        record.country,
        record.topic,
        record.article,
        record.platform,
        record.angle,
        record.title,
        record.post,
        record.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, records]);

  if (records.length === 0) {
    return (
      <section className="mx-auto flex max-w-page flex-col items-center justify-center py-32 text-center">
        <Clock3 className="h-12 w-12 text-line" />
        <h2 className="n-h1 mt-6">还没有生成记录</h2>
        <p className="n-muted mt-3">去创作你的第一条内容吧</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-page">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="n-h1">历史记录</h1>
          <p className="n-muted mt-2">共 {records.length} 条，最多保存 50 条</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative flex items-center gap-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索话题关键词"
              className="n-input"
              style={{ width: 240 }}
            />
          </label>
          <button type="button" onClick={onClear} className="n-btn-danger inline-flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5" />
            清空全部
          </button>
        </div>
      </header>

      {filteredRecords.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">没有匹配的历史记录</p>
      ) : (
        <ul className="divide-y divide-line">
          {filteredRecords.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              expanded={expandedId === record.id}
              onToggle={() =>
                setExpandedId((current) => (current === record.id ? null : record.id))
              }
              onDelete={onDelete}
              onRegenerate={onRegenerate}
              onCopy={onCopy}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
