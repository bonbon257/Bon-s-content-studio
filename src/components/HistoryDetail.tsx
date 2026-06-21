import { ChevronDown, ChevronUp, Copy, RefreshCcw, X } from 'lucide-react';
import { useState } from 'react';
import type { HistoryRecord } from '../types';

function chatToText(record: HistoryRecord) {
  return record.chat
    .map((row) => `${row.target}\t${row.chinese}\t${row.foreign}`)
    .join('\n');
}

export function HistoryDetail({
  record,
  onClose,
  onRegenerate,
  onCopy,
}: {
  record: HistoryRecord;
  onClose: () => void;
  onRegenerate: (record: HistoryRecord) => void;
  onCopy: (text: string) => void;
}) {
  const [chatOpen, setChatOpen] = useState(true);
  const allText = `标题：${record.title}\n\n正文：\n${record.post}\n\nTags：\n${record.tags
    .map((t) => `#${t}`)
    .join(' ')}\n\n聊天对话：\n对象\t中文\t对应语言\n${chatToText(record)}`;

  return (
    <div className="mt-6 border-t border-line pt-6 n-fade-up">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="n-h2">完整内容</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onCopy(allText)} className="n-btn">
            <Copy className="h-3.5 w-3.5" />
            复制全部
          </button>
          <button type="button" onClick={() => onRegenerate(record)} className="n-btn-ghost">
            <RefreshCcw className="h-3.5 w-3.5" />
            重新生成
          </button>
          <button type="button" onClick={onClose} className="n-btn-ghost">
            <X className="h-3.5 w-3.5" />
            关闭
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted">标题</p>
            <button
              type="button"
              onClick={() => onCopy(record.title)}
              className="n-btn-ghost text-xs"
            >
              复制
            </button>
          </div>
          <p className="text-xl font-semibold text-ink">{record.title}</p>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted">正文</p>
            <button
              type="button"
              onClick={() => onCopy(record.post)}
              className="n-btn-ghost text-xs"
            >
              复制
            </button>
          </div>
          <p
            className="whitespace-pre-wrap text-base text-ink"
            style={{ lineHeight: 1.7 }}
          >
            {record.post}
          </p>
        </section>

        {record.tags && record.tags.length > 0 && (
          <section>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">标签</p>
            <div className="flex flex-wrap gap-2">
              {record.tags.map((t) => (
                <span key={t} className="n-tag">
                  #{t}
                </span>
              ))}
            </div>
          </section>
        )}

        <section>
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className="mb-3 flex w-full items-center justify-between rounded px-1 py-1 text-left transition hover:bg-rail"
          >
            <span className="text-xs uppercase tracking-wider text-muted">聊天对话</span>
            {chatOpen ? (
              <ChevronUp className="h-4 w-4 text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted" />
            )}
          </button>
          {chatOpen && record.chat && record.chat.length > 0 && (
            <div className="max-h-96 overflow-auto border border-line">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-rail text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="w-[18%] border-b border-line px-3 py-2 font-medium">
                      对象
                    </th>
                    <th className="border-b border-l border-line px-3 py-2 font-medium">
                      中文
                    </th>
                    <th className="border-b border-l border-line px-3 py-2 font-medium">
                      对应语言
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.chat.map((row, idx) => (
                    <tr key={idx} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-2 align-top text-ink">{row.target}</td>
                      <td className="whitespace-pre-wrap border-l border-line px-3 py-2 align-top text-ink">
                        {row.chinese}
                      </td>
                      <td className="whitespace-pre-wrap border-l border-line px-3 py-2 align-top text-ink">
                        {row.foreign}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
