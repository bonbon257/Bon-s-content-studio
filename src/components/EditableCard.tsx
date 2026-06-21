import { Check, Copy, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DiffSegment } from '../utils/diff';
import { diffWords } from '../utils/diff';

interface EditableCardProps {
  label: string;
  value: string;
  multiline?: boolean;
  rows?: number;
  edited: boolean;
  onChange: (next: string) => void;
  onCopy: (text: string) => void;
  onPolish: (original: string) => Promise<{ polished: string; changes: string[] }>;
  onUndoEdit?: () => void;
  footer?: React.ReactNode;
  display?: 'title' | 'body';
}

type PolishState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'preview'; original: string; polished: string; changes: string[]; segments: DiffSegment[] }
  | { status: 'error'; message: string };

function DiffView({ segments }: { segments: DiffSegment[] }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-[1.6] text-ink">
      {segments.map((seg, idx) => {
        if (seg.op === 'kept') return <span key={idx}>{seg.value}</span>;
        if (seg.op === 'added') return <span key={idx} className="n-hl-add">{seg.value}</span>;
        return <span key={idx} className="n-hl-del">{seg.value}</span>;
      })}
    </p>
  );
}

export function EditableCard({
  label,
  value,
  multiline,
  rows = 8,
  edited,
  onChange,
  onCopy,
  onPolish,
  onUndoEdit,
  footer,
  display = 'body',
}: EditableCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [polish, setPolish] = useState<PolishState>({ status: 'idle' });
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  function startEdit() {
    if (polish.status === 'preview') return;
    setDraft(value);
    setEditing(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function handlePolish() {
    if (!value.trim()) return;
    setPolish({ status: 'loading' });
    try {
      const { polished, changes } = await onPolish(value);
      if (polished.trim() === value.trim()) {
        setPolish({
          status: 'preview',
          original: value,
          polished,
          changes: changes.length ? changes : ['润色后基本与原文一致，无需修改'],
          segments: [{ op: 'kept', value }],
        });
        return;
      }
      const segments = diffWords(value, polished);
      setPolish({ status: 'preview', original: value, polished, changes, segments });
    } catch (err) {
      setPolish({ status: 'error', message: err instanceof Error ? err.message : '润色失败' });
    }
  }

  function acceptPolish() {
    if (polish.status !== 'preview') return;
    onChange(polish.polished);
    setPolish({ status: 'idle' });
  }

  function rejectPolish() {
    setPolish({ status: 'idle' });
  }

  return (
    <section className="n-row group n-paper p-5">
      <header className="mb-3 flex items-center justify-between gap-2">
        <span className="n-eyebrow">{label}</span>
        <div className="n-row-actions flex items-center gap-1">
          {edited && (
            <button
              type="button"
              onClick={onUndoEdit}
              title="撤销编辑"
            className="rounded-full bg-emberSoft px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ember transition hover:bg-ember hover:text-cream"
            >
              edited
            </button>
          )}
          <button
            type="button"
            onClick={() => onCopy(value)}
            disabled={!value}
            className="n-btn-ghost text-xs"
            title="复制"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {polish.status === 'preview' ? (
        <div className="space-y-4">
          <div className="border-l-2 border-ember pl-4">
            <DiffView segments={polish.segments} />
          </div>
          {polish.changes.length > 0 && (
            <ul className="space-y-1 text-sm text-muted">
              {polish.changes.map((change, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-ember">·</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={acceptPolish} className="n-btn n-btn-ember">
              <Check className="h-3.5 w-3.5" />
              接受润色
            </button>
            <button type="button" onClick={rejectPolish} className="n-btn">
              <X className="h-3.5 w-3.5" />
              撤销
            </button>
          </div>
        </div>
      ) : editing ? (
        multiline ? (
          <textarea
            ref={(el) => {
              inputRef.current = el;
            }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            rows={rows}
            className="n-editable n-editing block w-full resize-y outline-none"
            style={{ fontSize: 15, lineHeight: 1.7 }}
          />
        ) : (
          <input
            ref={(el) => {
              inputRef.current = el;
            }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            className="n-editable n-editing block w-full outline-none"
            style={
              display === 'title'
                ? {
                    fontFamily: 'Fraunces, ui-serif, Georgia, serif',
                    fontSize: 22,
                    lineHeight: 1.3,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }
                : { fontSize: 15, lineHeight: 1.6 }
            }
          />
        )
      ) : (
        <button type="button" onClick={startEdit} className="n-editable" title="点击编辑">
          {display === 'title' ? (
            <p
              className="m-0 font-serif font-semibold leading-tight text-ink"
              style={{ fontSize: 22, letterSpacing: '-0.01em' }}
            >
              {value || <span className="text-muted">点击编辑标题…</span>}
            </p>
          ) : (
            <p className="m-0 whitespace-pre-wrap" style={{ fontSize: 15, lineHeight: 1.7, color: '#171411' }}>
              {value || <span className="text-muted">点击编辑内容…</span>}
            </p>
          )}
        </button>
      )}

      {footer}

      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        {polish.status === 'error' ? (
          <p className="text-sm text-ember">{polish.message}</p>
        ) : (
          <span className="n-muted">点击内容即可编辑</span>
        )}
        {polish.status !== 'preview' && (
          <button
            type="button"
            onClick={handlePolish}
            disabled={!value.trim() || polish.status === 'loading' || editing}
            className="n-btn-ghost text-xs"
          >
            {polish.status === 'loading' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 n-spin" />
                润色中…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                润色一下
              </>
            )}
          </button>
        )}
      </footer>
    </section>
  );
}

// keep the import to avoid unused warning
void RotateCcw;
