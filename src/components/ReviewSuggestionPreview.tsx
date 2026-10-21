import { Check, X } from 'lucide-react';
import type { ContentRevisionResult } from '../types';
import { diffWords } from '../utils/diff';

export interface SuggestionPreviewData {
  suggestion: string;
  skillName: string;
  beforeTitle: string;
  beforePost: string;
  after: ContentRevisionResult;
}

function DiffText({ before, after }: { before: string; after: string }) {
  const segments = diffWords(before, after);
  return (
    <p className="whitespace-pre-wrap text-sm leading-[1.7] text-[#1A1A1A]">
      {segments.map((seg, idx) => {
        if (seg.op === 'kept') return <span key={idx}>{seg.value}</span>;
        if (seg.op === 'added') {
          return (
            <span key={idx} className="rounded bg-[#D7F0D9] text-[#2D7A3A]">
              {seg.value}
            </span>
          );
        }
        return (
          <span key={idx} className="rounded bg-[#FBE0E0] text-[#B03A3A] line-through">
            {seg.value}
          </span>
        );
      })}
    </p>
  );
}

export function ReviewSuggestionPreview({
  data,
  onClose,
  onApply,
}: {
  data: SuggestionPreviewData | null;
  onClose: () => void;
  onApply: () => void;
}) {
  if (!data) return null;

  const changes = data.after.changes || [];

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative flex max-h-[88vh] w-full max-w-3xl flex-col rounded-[24px] bg-[#FAF7F2] shadow-2xl"
        style={{ animation: 'n-fade-up 0.2s ease' }}
      >
        <header className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">采纳建议 · 修改预览</h2>
            <p className="mt-1 text-xs text-[#6B6B6B]">
              绿色为新增，红色删除线为删掉的内容。确认后才会替换当前标题和正文。
            </p>
          </div>
          <button type="button" onClick={onClose} className="mac-icon-btn" title="关闭">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-auto px-6 py-5">
          <div className="rounded-[14px] bg-[#FFF7ED] p-3 text-xs leading-6 text-[#8A5A1B]">
            <span className="font-bold">来源：{data.skillName}</span>
            <p className="mt-1">建议原文：{data.suggestion}</p>
          </div>

          <section>
            <p className="mac-label">标题</p>
            <div className="rounded-[14px] bg-white p-3">
              <DiffText before={data.beforeTitle} after={data.after.title} />
            </div>
          </section>

          <section>
            <p className="mac-label">正文</p>
            <div className="rounded-[14px] bg-white p-3">
              <DiffText before={data.beforePost} after={data.after.post} />
            </div>
          </section>

          {changes.length > 0 && (
            <section className="rounded-[14px] bg-[#F5F0E8] p-3">
              <p className="mb-1 text-xs font-black uppercase tracking-wide text-[#6B6B6B]">改动说明</p>
              <ul className="space-y-1 text-sm leading-6 text-[#1A1A1A]">
                {changes.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[#E8E4DE] px-6 py-4">
          <button type="button" onClick={onClose} className="mac-mini-btn">
            放弃
          </button>
          <button type="button" onClick={onApply} className="mac-primary-btn">
            <Check className="h-4 w-4" /> 应用修改
          </button>
        </footer>
      </div>
    </div>
  );
}
