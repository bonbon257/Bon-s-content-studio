import { useMemo, useState } from 'react';
import {
  analyzeArticle,
  analyzeTopic,
  COUNTRIES,
  generateFromArticle,
  generateFromTopic,
  LANGUAGE_MAP,
  loadConfig,
} from './llm';
import type { Angle, ChatRow, Country, GenerationResult, Platform, Scene } from './types';
import { BUILT_IN_VIRAL_EXAMPLES } from './data/viralExamples';
import { buildViralSkillContext } from './viralSkill';

const platforms: Platform[] = ['小红书', '抖音'];
const VIRAL_LIBRARY_KEY = 'ht-viral-examples-library';
const GENERATION_HISTORY_KEY = 'ht-generation-history';
const MAX_HISTORY_COUNT = 20;

const emptyResult: GenerationResult = {
  title: '',
  post: '',
  tags: [],
  chat: [],
};

interface GenerationHistoryRecord {
  id: string;
  createdAt: string;
  scene: Scene;
  article: string;
  topic: string;
  country: Country;
  platform: Platform;
  angle: Angle | null;
  result: GenerationResult;
}

function loadViralLibrary() {
  try {
    return localStorage.getItem(VIRAL_LIBRARY_KEY) || '';
  } catch {
    return '';
  }
}

function saveViralLibrary(value: string) {
  localStorage.setItem(VIRAL_LIBRARY_KEY, value);
}

function loadGenerationHistory(): GenerationHistoryRecord[] {
  try {
    const raw = localStorage.getItem(GENERATION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGenerationHistory(records: GenerationHistoryRecord[]) {
  localStorage.setItem(GENERATION_HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY_COUNT)));
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

function PillButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-slate-950 text-white shadow-sm'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function OutputCard({ title, children }: { title: string; children: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {children && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(children)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
          >
            复制
          </button>
        )}
      </div>
      <pre className="min-h-20 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
        {children || '生成后会显示在这里'}
      </pre>
    </section>
  );
}

function TagsCard({ tags }: { tags: string[] }) {
  const copyText = tags.join(' ');

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Tags</h3>
        {tags.length > 0 && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(copyText)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
          >
            复制
          </button>
        )}
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="min-h-12 text-sm leading-7 text-slate-500">生成后会显示在这里</p>
      )}
    </section>
  );
}

function ChatTableCard({ rows }: { rows: ChatRow[] }) {
  const copyText = rows.map((row) => `${row.target}\t${row.chinese}\t${row.foreign}`).join('\n');

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">聊天对话</h3>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(`对象\t中文\t对应语言\n${copyText}`)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
          >
            复制
          </button>
        )}
      </div>
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] bg-slate-50 text-xs font-semibold text-slate-500">
            <div className="border-r border-slate-200 px-3 py-3">对象</div>
            <div className="border-r border-slate-200 px-3 py-3">中文</div>
            <div className="px-3 py-3">对应语言</div>
          </div>
          {rows.map((row, index) => (
            <div
              key={`${row.target}-${index}`}
              className="grid grid-cols-[88px_minmax(0,1fr)_minmax(0,1fr)] border-t border-slate-200 text-sm leading-6 text-slate-700"
            >
              <div className="border-r border-slate-200 px-3 py-3 font-medium text-slate-900">{row.target}</div>
              <div className="whitespace-pre-wrap break-words border-r border-slate-200 px-3 py-3">{row.chinese}</div>
              <div className="whitespace-pre-wrap break-words px-3 py-3">{row.foreign}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="min-h-20 text-sm leading-7 text-slate-500">生成后会显示在这里</p>
      )}
    </section>
  );
}

function ViralLibraryPanel({
  value,
  builtInValue,
  onSave,
  onClear,
}: {
  value: string;
  builtInValue: string;
  onSave: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const examplesCount = value.split(/【爆文\d*】|标题[:：]/).filter((part) => part.trim().length > 20).length;
  const builtInCount = builtInValue.split(/【爆文\d*】|标题[:：]/).filter((part) => part.trim().length > 20).length;

  function handleSave() {
    const next = draft.trim();
    saveViralLibrary(next);
    onSave(next);
  }

  function handleClear() {
    saveViralLibrary('');
    setDraft('');
    onClear();
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">爆文素材库</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            内置素材默认启用；这里可以额外补充样本。生成时只传压缩风格规则和少量相关样本，不会每次塞入完整素材库。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            内置 {builtInCount || 0} 条 · 补充 {value.trim() ? examplesCount || 1 : 0} 条
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setOpen((current) => !current);
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {open ? '收起' : '打开'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={12}
            placeholder={`建议格式：
【爆文1】
标题：为什么山姆到了国内就变中高端了？
正文：我以前一直以为……

【爆文2】
标题：……
正文：……`}
            className="w-full resize-y rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none focus:border-slate-400 focus:bg-white"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              保存素材库
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              清空
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            长期固定样本建议放在 `src/data/viralExamples.ts`；这里适合放临时补充样本。每条保留标题和正文即可。
          </p>
        </div>
      )}
    </section>
  );
}

function GenerationHistoryPanel({
  records,
  onRestore,
  onClear,
  onDelete,
}: {
  records: GenerationHistoryRecord[];
  onRestore: (record: GenerationHistoryRecord) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">生成记录</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            自动保存最近 {MAX_HISTORY_COUNT} 次生成结果。关掉页面后再打开，也可以从这里恢复。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            已保存 {records.length} 条
          </span>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {open ? '收起' : '打开'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5">
          {records.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              暂无生成记录。成功生成内容后会自动保存到这里。
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {record.result.title || '未命名内容'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {new Date(record.createdAt).toLocaleString()} ·{' '}
                        {record.scene === 'article' ? '文章改写' : '话题创作'} · {record.country} ·{' '}
                        {record.platform}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRestore(record)}
                        className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        恢复
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{record.result.post}</p>
                </article>
              ))}
              <button
                type="button"
                onClick={onClear}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                清空全部记录
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [scene, setScene] = useState<Scene>('article');
  const [article, setArticle] = useState('');
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState<Country>('韩国');
  const [platform, setPlatform] = useState<Platform>('小红书');
  const [angles, setAngles] = useState<Angle[]>([]);
  const [selectedAngleId, setSelectedAngleId] = useState<number | null>(null);
  const [result, setResult] = useState<GenerationResult>(emptyResult);
  const [loading, setLoading] = useState<'analyze' | 'generate' | null>(null);
  const [error, setError] = useState('');
  const [viralExamples, setViralExamples] = useState(() => loadViralLibrary());
  const [historyRecords, setHistoryRecords] = useState<GenerationHistoryRecord[]>(() => loadGenerationHistory());
  const config = useMemo(() => loadConfig(), []);
  const combinedViralExamples = useMemo(
    () => [BUILT_IN_VIRAL_EXAMPLES.trim(), viralExamples.trim()].filter(Boolean).join('\n\n'),
    [viralExamples],
  );

  const selectedAngle = useMemo(
    () => angles.find((angle) => angle.id === selectedAngleId) || null,
    [angles, selectedAngleId],
  );

  function resetWork() {
    setAngles([]);
    setSelectedAngleId(null);
    setResult(emptyResult);
    setError('');
  }

  function switchScene(next: Scene) {
    setScene(next);
    resetWork();
  }

  function persistHistory(record: GenerationHistoryRecord) {
    const nextRecords = [record, ...historyRecords.filter((item) => item.id !== record.id)].slice(0, MAX_HISTORY_COUNT);
    setHistoryRecords(nextRecords);
    saveGenerationHistory(nextRecords);
  }

  function restoreHistory(record: GenerationHistoryRecord) {
    setScene(record.scene);
    setArticle(record.article);
    setTopic(record.topic);
    setCountry(record.country);
    setPlatform(record.platform);
    setAngles(record.angle ? [record.angle] : []);
    setSelectedAngleId(record.angle?.id ?? null);
    setResult(record.result);
    setError('');
  }

  function deleteHistoryRecord(id: string) {
    const nextRecords = historyRecords.filter((record) => record.id !== id);
    setHistoryRecords(nextRecords);
    saveGenerationHistory(nextRecords);
  }

  function clearHistoryRecords() {
    setHistoryRecords([]);
    saveGenerationHistory([]);
  }

  async function handleAnalyze() {
    setError('');
    setResult(emptyResult);

    if (scene === 'article' && !article.trim()) {
      setError('请先粘贴原文。');
      return;
    }
    if (scene === 'topic' && !topic.trim()) {
      setError('请先输入话题。');
      return;
    }

    setLoading('analyze');
    try {
      const viralSkill = buildViralSkillContext(combinedViralExamples, scene === 'article' ? article : topic);
      const nextAngles =
        scene === 'article'
          ? await analyzeArticle({ config, article, country, platform, viralSkill })
          : await analyzeTopic({ config, topic, country, platform, viralSkill });
      setAngles(nextAngles);
      setSelectedAngleId(nextAngles[0]?.id ?? null);
      if (nextAngles.length === 0) {
        setError('没有解析出可用角度，请换一段输入重试。');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试。');
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerate() {
    setError('');
    if (!selectedAngle) {
      setError('请先分析并选择一个角度。');
      return;
    }

    setLoading('generate');
    try {
      const query = scene === 'article' ? `${article}\n${selectedAngle.title}\n${selectedAngle.description}` : `${topic}\n${selectedAngle.title}\n${selectedAngle.description}`;
      const viralSkill = buildViralSkillContext(combinedViralExamples, query);
      const nextResult =
        scene === 'article'
          ? await generateFromArticle({ config, article, angle: selectedAngle, country, platform, viralSkill })
          : await generateFromTopic({ config, topic, angle: selectedAngle, country, platform, viralSkill });
      setResult(nextResult);
      persistHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date().toISOString(),
        scene,
        article,
        topic,
        country,
        platform,
        angle: selectedAngle,
        result: nextResult,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请稍后重试。');
    } finally {
      setLoading(null);
    }
  }

  const canGenerate = Boolean(selectedAngle) && !loading;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef2ff,transparent_34%),linear-gradient(180deg,#f8fafc,#f1f5f9)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
              HelloTalk Viral Content Generator
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              文化差异软广内容生成器
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              输入原文或话题，先得到可延展切入点，再生成可直接发布的标题、正文和聊天对话。
            </p>
          </div>
          <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => switchScene('article')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                scene === 'article' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              文章改写
            </button>
            <button
              type="button"
              onClick={() => switchScene('topic')}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                scene === 'topic' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              话题创作
            </button>
          </div>
        </header>

        <ViralLibraryPanel
          value={viralExamples}
          builtInValue={BUILT_IN_VIRAL_EXAMPLES}
          onSave={(value) => setViralExamples(value)}
          onClear={() => setViralExamples('')}
        />

        <GenerationHistoryPanel
          records={historyRecords}
          onRestore={restoreHistory}
          onClear={clearHistoryRecords}
          onDelete={deleteHistoryRecord}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              {scene === 'article' ? (
                <div>
                  <FieldLabel required>原文粘贴</FieldLabel>
                  <textarea
                    value={article}
                    onChange={(event) => {
                      setArticle(event.target.value);
                      resetWork();
                    }}
                    placeholder="粘贴一篇已有文章，系统会先提取 3-5 个可延展话题角度..."
                    rows={12}
                    className="w-full resize-y rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
              ) : (
                <div>
                  <FieldLabel required>话题</FieldLabel>
                  <input
                    value={topic}
                    onChange={(event) => {
                      setTopic(event.target.value);
                      resetWork();
                    }}
                    placeholder="例如：为什么很少人润韩国"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  />
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    话题分析会要求模型基于真实社会现象给出切入点，不确定处会使用模糊表达。
                  </p>
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required>国家</FieldLabel>
                  <select
                    value={country}
                    onChange={(event) => {
                      setCountry(event.target.value as Country);
                      resetWork();
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  >
                    {COUNTRIES.map((item) => (
                      <option key={item} value={item}>
                        {item} · {LANGUAGE_MAP[item]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>平台</FieldLabel>
                  <div className="flex gap-2">
                    {platforms.map((item) => (
                      <PillButton key={item} active={platform === item} onClick={() => setPlatform(item)}>
                        {item}
                      </PillButton>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading !== null}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === 'analyze' ? '正在分析...' : scene === 'article' ? '分析原文' : '分析话题'}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading === 'generate' ? '正在生成...' : '生成内容'}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  {error}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-950">角度选择</h2>
                <span className="text-xs text-slate-400">先分析，再选择</span>
              </div>
              {angles.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  暂无角度。点击“{scene === 'article' ? '分析原文' : '分析话题'}”后，这里会展示 3-5 个可选切入点。
                </div>
              ) : (
                <div className="space-y-3">
                  {angles.map((angle) => (
                    <button
                      key={angle.id}
                      type="button"
                      onClick={() => setSelectedAngleId(angle.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedAngleId === angle.id
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-semibold">{angle.title}</p>
                      <p
                        className={`mt-2 text-sm leading-6 ${
                          selectedAngleId === angle.id ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {angle.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5">
            <OutputCard title="标题">{result.title}</OutputCard>
            <OutputCard title="正文">{result.post}</OutputCard>
            <TagsCard tags={result.tags} />
            <ChatTableCard rows={result.chat} />
          </section>
        </div>
      </div>
    </main>
  );
}
