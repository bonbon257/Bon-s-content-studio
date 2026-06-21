import {
  ArrowRight,
  ClipboardCopy,
  Clock3,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ResearchHistoryRecord, ResearchResult } from '../types';

const RESEARCH_HISTORY_KEY = 'ht-research-history-v1';
const MAX_RESEARCH_HISTORY = 30;

function readResearchHistory(): ResearchHistoryRecord[] {
  try {
    const raw = localStorage.getItem(RESEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeResearchHistory(records: ResearchHistoryRecord[]) {
  localStorage.setItem(
    RESEARCH_HISTORY_KEY,
    JSON.stringify(records.slice(0, MAX_RESEARCH_HISTORY)),
  );
}

interface ResearchViewProps {
  onSearch: (topic: string) => Promise<ResearchResult>;
  onUseAngle: (topic: string, angleTitle: string, angleDescription: string) => void;
  onCopy: (text: string) => void;
}

export function ResearchView({ onSearch, onUseAngle, onCopy }: ResearchViewProps) {
  const [topic, setTopic] = useState('');
  const [customAngleTitle, setCustomAngleTitle] = useState('');
  const [customAngleDescription, setCustomAngleDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [history, setHistory] = useState<ResearchHistoryRecord[]>(() => readResearchHistory());

  useEffect(() => {
    writeResearchHistory(history);
  }, [history]);

  async function handleSearch(target?: string) {
    const value = (target ?? topic).trim();
    if (!value) {
      setError('请输入想了解的文化主题');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const next = await onSearch(value);
      setResult(next);
      setTopic(value);
      setHistory((prev) => {
        const filtered = prev.filter((r) => r.topic !== value);
        return [
          {
            id: String(Date.now()),
            topic: value,
            result: next,
            createdAt: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, MAX_RESEARCH_HISTORY);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '检索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  function loadFromHistory(record: ResearchHistoryRecord) {
    setTopic(record.topic);
    setResult(record.result);
    setCustomAngleTitle('');
    setCustomAngleDescription('');
    setError('');
  }

  function useCustomAngle() {
    if (!result) return;
    const title = customAngleTitle.trim();
    if (!title) {
      setError('请先填写你的自定义角度');
      return;
    }
    onUseAngle(
      result.topic,
      title,
      customAngleDescription.trim() || '根据我的自定义看法生成内容。',
    );
  }

  function buildCopyText(r: ResearchResult) {
    const lines: string[] = [];
    lines.push(`【主题】${r.topic}`);
    if (r.concept) lines.push(`\n【基本概念】\n${r.concept}`);
    if (r.facts.length) lines.push(`\n【真实数据/普遍现象】\n- ${r.facts.join('\n- ')}`);
    if (r.misconceptions.length) lines.push(`\n【常见误解】\n- ${r.misconceptions.join('\n- ')}`);
    if (r.angles.length)
      lines.push(`\n【适合切入的角度】\n${r.angles.map((a) => `- ${a.title}：${a.description}`).join('\n')}`);
    if (r.related.length) lines.push(`\n【相关话题延伸】\n- ${r.related.join('\n- ')}`);
    if (r.freshnessNote) lines.push(`\n【时效说明】${r.freshnessNote}`);
    return lines.join('\n');
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div>
            <h1 className="n-h1 mb-2">资料检索</h1>
            <p className="n-muted">
              左侧输入文化主题，右侧查看结构化背景、分析角度和生成入口。
            </p>
          </div>

          <section className="rounded-[24px] bg-[#FAF7F2] p-5">
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                <Search className="h-4 w-4 text-muted" />
                检索主题
              </span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) handleSearch();
                }}
                placeholder="如：韩国租房制度"
                className="n-input"
              />
            </label>
            {error && <p className="mt-3 text-sm text-tag">{error}</p>}
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className="n-btn n-btn-primary mt-4 w-full"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 n-spin" /> : null}
              {loading ? '检索中…' : '开始检索'}
            </button>
          </section>

          {history.length > 0 && (
            <section className="rounded-[24px] bg-white p-5">
              <h3 className="n-h2 mb-4">检索历史</h3>
              <ul className="divide-y divide-line">
                {history.map((record) => (
                  <li
                    key={record.id}
                    className="n-row group flex items-center justify-between gap-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => loadFromHistory(record)}
                      className="flex-1 truncate text-left text-sm text-ink transition hover:text-accent"
                    >
                      {record.topic}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistory((prev) => prev.filter((r) => r.id !== record.id))}
                      className="n-row-actions n-btn-danger"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <main className="min-w-0">
          {!result && (
            <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border-2 border-dashed border-[#E8E4DE] bg-[#FAF7F2] p-8 text-center">
              <div>
                <Search className="mx-auto mb-4 h-10 w-10 text-muted" />
                <h2 className="n-h2 mb-2">右侧会显示检索结果</h2>
                <p className="n-muted">输入主题并点击开始检索后，这里会展示背景、角度和生成入口。</p>
              </div>
            </div>
          )}

          {result && (
            <article className="space-y-8 n-fade-up">
              <header className="flex items-start justify-between gap-4">
                <h2 className="n-h1">{result.topic}</h2>
                <button type="button" onClick={() => onCopy(buildCopyText(result))} className="n-btn">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  复制全部
                </button>
              </header>

          {result.concept && (
            <section>
              <h3 className="n-h2 mb-3">基本概念</h3>
              <p className="n-body whitespace-pre-wrap" style={{ lineHeight: 1.7 }}>
                {result.concept}
              </p>
            </section>
          )}

          {result.facts.length > 0 && (
            <section>
              <h3 className="n-h2 mb-3">真实数据 / 普遍现象</h3>
              <ul className="space-y-2">
                {result.facts.map((fact, idx) => (
                  <li key={idx} className="flex gap-3 leading-7">
                    <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-muted" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.misconceptions.length > 0 && (
            <section>
              <h3 className="n-h2 mb-3">常见误解</h3>
              <ul className="space-y-2">
                {result.misconceptions.map((m, idx) => (
                  <li key={idx} className="flex gap-3 leading-7">
                    <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-tag" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-[24px] bg-[#FAF7F2] p-5">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <h3 className="n-h2 mb-1">分析角度 & 生成内容</h3>
                <p className="n-muted">
                  检索完背景后，如果觉得可写，可以直接选一个角度进入创作，生成你要的帖子格式。
                </p>
              </div>
            </div>

            {result.angles.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-bold text-[#1A1A1A]">推荐切入角度</h4>
                <ul className="divide-y divide-line rounded-[20px] bg-white px-4">
                {result.angles.map((angle, idx) => (
                  <li key={idx} className="n-row group flex items-start justify-between gap-4 py-3">
                    <div className="flex-1">
                      <p className="font-medium text-ink">{angle.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{angle.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUseAngle(result.topic, angle.title, angle.description)}
                      className="n-btn n-row-actions whitespace-nowrap"
                    >
                      用这个角度创作
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </li>
                ))}
                </ul>
              </div>
            )}

            <div className="mt-5 rounded-[20px] border-2 border-dashed border-[#E8E4DE] bg-white p-4">
              <p className="font-bold text-[#1A1A1A]">自定义我的角度</p>
              <p className="mt-1 text-sm leading-6 text-[#6B6B6B]">
                如果推荐角度都不合适，可以写你的看法，再进入话题创作生成帖子。
              </p>
              <div className="mt-3 grid gap-3">
                <input
                  value={customAngleTitle}
                  onChange={(event) => setCustomAngleTitle(event.target.value)}
                  placeholder="例如：韩国人为什么更在意租房押金安全？"
                  className="n-input"
                />
                <textarea
                  value={customAngleDescription}
                  onChange={(event) => setCustomAngleDescription(event.target.value)}
                  placeholder="补充你想写的方向、疑问或评论区争议点..."
                  rows={3}
                  className="n-textarea min-h-[92px]"
                />
                <button
                  type="button"
                  onClick={useCustomAngle}
                  className="n-btn n-btn-primary"
                >
                  用我的角度生成内容
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </section>

          {result.related.length > 0 && (
            <section>
              <h3 className="n-h2 mb-3">相关话题延伸</h3>
              <div className="flex flex-wrap gap-2">
                {result.related.map((rel, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSearch(rel)}
                    className="rounded bg-rail px-3 py-1 text-sm text-ink transition hover:bg-hover"
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </section>
          )}

          {result.freshnessNote && (
            <section className="border-l-2 border-line pl-4 text-sm text-muted">
              <p className="mb-1 inline-flex items-center gap-1.5 font-medium text-ink">
                <Clock3 className="h-3.5 w-3.5" />
                信息时效说明
              </p>
              <p className="leading-6">{result.freshnessNote}</p>
            </section>
          )}
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
