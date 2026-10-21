import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Cloud,
  Copy,
  ExternalLink,
  FileText,
  History,
  Home,
  ImageIcon,
  Leaf,
  Loader2,
  Maximize2,
  MessageCircle,
  Palette as PaletteIcon,
  PenLine,
  RefreshCw,
  Save,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { FactCheckPanel, type FactCheckStatus } from './components/FactCheckPanel';
import { CoverGenerator } from './components/CoverGenerator';
import { HomePage } from './components/HomePage';
import { KnowledgeBaseDrawer } from './components/KnowledgeBaseDrawer';
import { HistoryPanel } from './components/HistoryPanel';
import { PreferencesDrawer } from './components/PreferencesDrawer';
import { StyleSkillDrawer } from './components/StyleSkillDrawer';
import { ResearchView } from './components/ResearchView';
import { ReviewSuggestionPreview, type SuggestionPreviewData } from './components/ReviewSuggestionPreview';
import { SettingsDrawer } from './components/SettingsDrawer';
import { ThemeDrawer } from './components/ThemeDrawer';
import {
  applyThemeSettings,
  loadThemeSettings,
  saveThemeSettings,
  THEME_PRESETS,
  type ThemeSettings,
} from './theme';
import { BUILT_IN_VIRAL_EXAMPLES } from './data/viralExamples';
import { useHistory } from './hooks/useHistory';
import { usePreferences } from './hooks/usePreferences';
import { useStyleSkills } from './hooks/useStyleSkills';
import { useChatSkills } from './hooks/useChatSkills';
import { useGuideSkills } from './hooks/useGuideSkills';
import {
  analyzeArticle,
  analyzeArticleWithComments,
  analyzeTopic,
  COUNTRIES,
  generateAppRecommendation,
  generateFromArticle,
  generateFromDocument,
  generateFromTopic,
  LANGUAGE_MAP,
  loadConfig,
  polishText,
  regenerateChat,
  regenerateChatRow,
  regenerateTitle,
  researchGeneratedContent,
  researchTopic,
  reviewContentWithSkills,
  reviseGeneratedContent,
  saveConfig,
} from './llm';
import { getEnabledKnowledgeContext, truncateKnowledgeContext } from './knowledgeBase';
import type {
  Angle,
  AppRecommendationResult,
  ChatRow,
  ContentReviewReport,
  Country,
  FactCheckItem,
  GenerationResult,
  GeneratedContentResearchResult,
  GuideStage,
  HistoryRecord,
  Platform,
  Scene,
} from './types';
import { buildViralSkillContext } from './viralSkill';
import { fetchCloudSkills, pushCloudSkills } from './lib/cloudSync';

type AppTab = 'home' | 'article' | 'topic' | 'research' | 'chat' | 'app' | 'document' | 'history';
type Stage = 'empty' | 'angles' | 'generating' | 'result';
// 云端同步 UI 状态：idle=未开始，syncing=推送中，synced=已同步，disabled=未配置 KV，error=鉴权/网络失败
type CloudState = 'idle' | 'syncing' | 'synced' | 'disabled' | 'error';

const platforms: Platform[] = ['小红书', '抖音'];
const VIRAL_LIBRARY_KEY = 'ht-viral-examples-library';
const APP_PASSWORD_KEY = 'ht-app-password';

const tabs: { key: Exclude<AppTab, 'history'>; label: string; icon: typeof PenLine }[] = [
  { key: 'home', label: '工作台', icon: Home },
  { key: 'article', label: '文章改写', icon: PenLine },
  { key: 'topic', label: '话题创作', icon: Sparkles },
  { key: 'research', label: '资料检索', icon: Search },
  { key: 'chat', label: '聊天生成', icon: MessageCircle },
  { key: 'app', label: 'APP推荐', icon: BookOpen },
  { key: 'document', label: '按文档生成', icon: FileText },
];

const angleColors = ['#F5D5D5', '#F5E6D0', '#E0D5F5', '#D5F0E0', '#D5E8F5'];

const emptyResult: GenerationResult = {
  title: '',
  post: '',
  tags: [],
  chat: [],
  factChecks: [],
};

function loadViralLibrary() {
  try {
    return localStorage.getItem(VIRAL_LIBRARY_KEY) || '';
  } catch {
    return '';
  }
}

function flagForCountry(country: Country) {
  const map: Record<Country, string> = {
    美国: '🇺🇸',
    英国: '🇬🇧',
    日本: '🇯🇵',
    韩国: '🇰🇷',
    德国: '🇩🇪',
    法国: '🇫🇷',
    西班牙: '🇪🇸',
    意大利: '🇮🇹',
    俄罗斯: '🇷🇺',
    泰国: '🇹🇭',
    巴西: '🇧🇷',
    马来西亚: '🇲🇾',
    新加坡: '🇸🇬',
  };
  return map[country] || '🌍';
}

function cleanTag(tag: string) {
  return tag.replace(/^#+/, '').trim();
}

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -12, x: '-50%' }}
      className="fixed left-1/2 top-5 z-[100] rounded-full bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      {message}
    </motion.div>
  );
}

function SideNav({
  active,
  onTabChange,
  onHistory,
}: {
  active: AppTab;
  onTabChange: (tab: Exclude<AppTab, 'history'>) => void;
  onHistory: () => void;
}) {
  const items = [
    ...tabs,
    { key: 'history' as const, label: '历史', icon: History },
  ];
  return (
    <aside className="mac-side-nav">
      <div className="mac-logo-bubble">
        <Leaf className="h-6 w-6" />
      </div>
      <nav className="mt-10 flex flex-col items-center gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              title={item.label}
              onClick={() => (item.key === 'history' ? onHistory() : onTabChange(item.key))}
              className={`mac-side-icon ${selected ? 'is-active' : ''}`}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </nav>
      <div className="mt-auto mac-avatar">
        <User className="h-5 w-5" />
      </div>
    </aside>
  );
}

function TopBar({
  active,
  onTabChange,
  onSettings,
  onTheme,
  onPreferences,
  onStyleSkill,
  onCover,
  onKb,
  activeSkillName,
  cloudState,
}: {
  active: AppTab;
  onTabChange: (tab: Exclude<AppTab, 'history'>) => void;
  onSettings: () => void;
  onTheme: () => void;
  onPreferences: () => void;
  onStyleSkill: () => void;
  onCover: () => void;
  onKb: () => void;
  activeSkillName?: string;
  cloudState?: CloudState;
}) {
  return (
    <header className="mac-topbar">
      <div className="mac-tabs">
        {tabs.map((tab) => {
          const selected = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`mac-tab ${selected ? 'is-active' : ''}`}
            >
              <span>{selected ? '●' : '○'}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        {cloudState && cloudState !== 'idle' && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
              cloudState === 'syncing'
                ? 'bg-[#FFF3E0] text-[#FF9F43]'
                : cloudState === 'synced'
                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                  : cloudState === 'error'
                    ? 'bg-[#FDECEA] text-[#D93025]'
                    : 'bg-slate-100 text-slate-400'
            }`}
            title={
              cloudState === 'syncing'
                ? '正在同步到云端…'
                : cloudState === 'synced'
                  ? '云端已同步'
                  : cloudState === 'error'
                    ? '云端同步失败，请检查访问密码或网络'
                    : '未配置云端存储（Vercel KV / Upstash Redis）'
            }
          >
            {cloudState === 'syncing' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Cloud className="h-3 w-3" />
            )}
            {cloudState === 'syncing'
              ? '同步中'
              : cloudState === 'synced'
                ? '已同步'
                : cloudState === 'error'
                  ? '同步失败'
                  : '云端未配置'}
          </span>
        )}
        <div className="mac-top-avatar">B</div>
        <button type="button" onClick={onPreferences} className="mac-icon-btn" title="我的偏好">
          <Brain className="h-5 w-5" />
        </button>
        <button type="button" onClick={onStyleSkill} className="mac-icon-btn relative" title="风格 SKILL">
          <Sparkles className="h-5 w-5 text-[#FF9F43]" />
          {activeSkillName && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#FF9F43]" />
          )}
        </button>
        <button type="button" onClick={onCover} className="mac-icon-btn" title="封面生成">
          <ImageIcon className="h-5 w-5" />
        </button>
        <button type="button" onClick={onKb} className="mac-icon-btn" title="知识库">
          <BookOpen className="h-5 w-5" />
        </button>
        <button type="button" onClick={onTheme} className="mac-icon-btn" title="页面设计">
          <PaletteIcon className="h-5 w-5" />
        </button>
        <button type="button" onClick={onSettings} className="mac-icon-btn" title="设置">
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

function CuteIllustration() {
  return (
    <div className="mac-illustration">
      <div className="mac-illo-face">
        <span />
        <span />
      </div>
      <div className="mac-illo-card one" />
      <div className="mac-illo-card two" />
      <Sparkles className="absolute right-7 top-5 h-5 w-5 text-[#F0B8B8]" />
    </div>
  );
}

function PlatformPills({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (value: Platform) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={`mac-platform-pill ${value === item ? 'is-active' : ''}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function InputCard({
  scene,
  article,
  topic,
  comments,
  country,
  platform,
  loading,
  error,
  onArticleChange,
  onTopicChange,
  onCommentsChange,
  onCountryChange,
  onPlatformChange,
  onAnalyze,
  onClear,
}: {
  scene: Scene;
  article: string;
  topic: string;
  comments: string;
  country: Country;
  platform: Platform;
  loading: 'analyze' | 'generate' | null;
  error: string;
  onArticleChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  onCommentsChange: (value: string) => void;
  onCountryChange: (value: Country) => void;
  onPlatformChange: (value: Platform) => void;
  onAnalyze: () => void;
  onClear: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mac-card mac-input-card"
    >
      <CuteIllustration />
      <div className="mt-6">
        <p className="mac-kicker">{scene === 'article' ? 'Rewrite source' : 'Topic seed'}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#1A1A1A]">
          {scene === 'article' ? '把原文改成真实感爆文' : '从一个话题开始创作'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
          选择国家和平台后，先分析角度，再生成可发布内容。
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label>
          <span className="mac-label">国家</span>
          <select
            value={country}
            onChange={(event) => onCountryChange(event.target.value as Country)}
            className="mac-select"
          >
            {COUNTRIES.map((item) => (
              <option key={item} value={item}>
                {flagForCountry(item)} {item} · {LANGUAGE_MAP[item]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="mac-label">平台</span>
          <PlatformPills value={platform} onChange={onPlatformChange} />
        </div>
      </div>

      <div className="mt-5">
        {scene === 'article' ? (
          <>
            <label>
              <span className="mb-2 flex items-center justify-between">
                <span className="mac-label !mb-0">原文</span>
                {article.trim() && (
                  <button type="button" onClick={onClear} className="mac-clear-btn">
                    一键清空
                  </button>
                )}
              </span>
              <textarea
                value={article}
                onChange={(event) => onArticleChange(event.target.value)}
                placeholder="粘贴你的文章到这里..."
                className="mac-textarea"
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-2 flex items-center justify-between">
                <span className="mac-label !mb-0">💬 评论区评论（可选）</span>
                {comments.trim() && (
                  <button type="button" onClick={() => onCommentsChange('')} className="mac-clear-btn">
                    清空
                  </button>
                )}
              </span>
              <p className="mb-1.5 text-xs text-[#6B6B6B]">
                从爆文评论区复制多条评论粘贴到这里，程序会从评论中提取高讨论度角度
              </p>
              <textarea
                value={comments}
                onChange={(event) => onCommentsChange(event.target.value)}
                placeholder="每条评论占一行，例如：&#10;哈哈哈真的假的，我们那边完全不一样&#10;我也是！在国外待了三年深有体会&#10;楼上的经历太真实了吧"
                className="mac-textarea !min-h-[100px]"
                rows={4}
              />
            </label>
          </>
        ) : (
          <label>
            <span className="mb-2 flex items-center justify-between">
              <span className="mac-label !mb-0">话题</span>
              {topic.trim() && (
                <button type="button" onClick={onClear} className="mac-clear-btn">
                  一键清空
                </button>
              )}
            </span>
            <input
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              placeholder="例如：为什么很少人润韩国"
              className="mac-input"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-3 rounded-2xl bg-[#F5D5D5] px-4 py-2 text-sm text-[#1A1A1A]">{error}</p>}

      <button type="button" onClick={onAnalyze} disabled={loading !== null} className="mac-primary-btn mt-5 w-full">
        {loading === 'analyze' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            分析中...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            分析角度
          </>
        )}
      </button>
    </motion.section>
  );
}

function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex min-h-[560px] flex-col items-center justify-center text-center"
    >
      <div className="relative h-32 w-32 rounded-full bg-[#D5E8F5]">
        <div className="absolute left-8 top-10 h-14 w-16 rounded-[22px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]" />
        <Sparkles className="absolute right-7 top-7 h-7 w-7 text-[#F0B8B8]" />
        <PenLine className="absolute bottom-8 left-12 h-8 w-8 text-[#1A1A1A]" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-[#1A1A1A]">在左侧输入内容，开始创作吧！</h2>
      <p className="mt-2 max-w-[340px] text-sm leading-6 text-[#6B6B6B]">
        输入原文或话题后点击分析，右侧会出现可选择的切入角度。
      </p>
    </motion.div>
  );
}

function AngleSelection({
  angles,
  selectedAngleId,
  loading,
  onSelectAngle,
  onAddCustomAngle,
  onGenerate,
}: {
  angles: Angle[];
  selectedAngleId: number | null;
  loading: 'analyze' | 'generate' | null;
  onSelectAngle: (id: number) => void;
  onAddCustomAngle: (angle: Angle) => void;
  onGenerate: () => void;
}) {
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  function submitCustomAngle() {
    const title = customTitle.trim();
    const description = customDescription.trim();
    if (!title) return;
    const id = Math.max(0, ...angles.map((angle) => angle.id)) + 1;
    onAddCustomAngle({
      id,
      title,
      description: description || '根据我的自定义看法生成内容。',
    });
    setCustomTitle('');
    setCustomDescription('');
  }

  return (
    <motion.div
      key="angles"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="mac-kicker">Angle lab</p>
          <h2 className="mt-1 text-2xl font-bold text-[#1A1A1A]">✨ 找到 {angles.length} 个切入角度</h2>
        </div>
      </div>
      <div className="space-y-3">
        {angles.map((angle, index) => {
          const selected = selectedAngleId === angle.id;
          return (
            <motion.button
              key={angle.id}
              type="button"
              whileHover={{ y: -2 }}
              onClick={() => onSelectAngle(angle.id)}
              className={`mac-angle-card ${selected ? 'is-selected' : ''}`}
              style={{ backgroundColor: angleColors[index % angleColors.length] }}
            >
              <div className="mac-angle-icon">{index + 1}</div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="font-bold text-[#1A1A1A]">{angle.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#6B6B6B]">{angle.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-[#1A1A1A]">
                {selected ? '已选择 ✓' : '选择 →'}
              </span>
            </motion.button>
          );
        })}
      </div>
      <section className="rounded-[20px] border-2 border-dashed border-[#E8E4DE] bg-white/70 p-4">
        <p className="font-bold text-[#1A1A1A]">我想自定义一个角度</p>
        <p className="mt-1 text-sm leading-6 text-[#6B6B6B]">
          如果以上角度都不合适，可以写下你的判断，系统会按你的方向生成。
        </p>
        <div className="mt-3 grid gap-3">
          <input
            value={customTitle}
            onChange={(event) => setCustomTitle(event.target.value)}
            placeholder="例如：为什么韩国人对租房押金这么敏感？"
            className="mac-input"
          />
          <textarea
            value={customDescription}
            onChange={(event) => setCustomDescription(event.target.value)}
            placeholder="补充你的看法：想从哪个生活场景、矛盾点或评论区争议切入？"
            rows={3}
            className="mac-textarea !min-h-[96px]"
          />
          <button
            type="button"
            onClick={submitCustomAngle}
            disabled={!customTitle.trim()}
            className="mac-secondary-btn"
          >
            加入我的角度
          </button>
        </div>
      </section>
      <div className="flex flex-col gap-3 border-t border-[#E8E4DE] pt-5 sm:flex-row">
        <button
          type="button"
          onClick={onGenerate}
          disabled={selectedAngleId === null || loading !== null}
          className="mac-primary-btn flex-1"
        >
          {loading === 'generate' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>🚀 生成内容</>
          )}
        </button>
        <button type="button" className="mac-text-btn">
          ← 返回重新选择
        </button>
      </div>
    </motion.div>
  );
}

function GeneratingState() {
  const steps = ['📝 构思标题', '📄 撰写正文', '💬 模拟对话'];
  return (
    <motion.div
      key="generating"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex min-h-[560px] flex-col justify-center"
    >
      <p className="mac-kicker text-center">Generating</p>
      <h2 className="mt-2 text-center text-2xl font-bold text-[#1A1A1A]">正在把角度写成真实帖子</h2>
      <div className="mx-auto mt-8 h-3 w-full max-w-[420px] overflow-hidden rounded-full bg-[#F5F0E8]">
        <motion.div
          initial={{ width: '8%' }}
          animate={{ width: ['18%', '52%', '84%'] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse' }}
          className="h-full rounded-full bg-[#1A1A1A]"
        />
      </div>
      <div className="mx-auto mt-8 grid w-full max-w-[420px] gap-3">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.2, delay: index * 0.25, repeat: Infinity }}
            className="flex items-center justify-between rounded-[20px] bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          >
            <span className="font-semibold text-[#1A1A1A]">{step}</span>
            <CheckCircle2 className="h-5 w-5 text-[#6B6B6B]" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function EditableText({
  value,
  multiline,
  placeholder,
  className,
  onChange,
}: {
  value: string;
  multiline?: boolean;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  function beginEdit() {
    setDraft(value);
    setEditing(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (editing && multiline) {
    return (
      <textarea
        ref={(element) => {
          inputRef.current = element;
        }}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        rows={8}
        className={`mac-editable is-editing min-h-[170px] resize-y ${className || ''}`}
      />
    );
  }

  if (editing) {
    return (
      <input
        ref={(element) => {
          inputRef.current = element;
        }}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
        className={`mac-editable is-editing ${className || ''}`}
      />
    );
  }

  return (
    <button type="button" onClick={beginEdit} className="mac-editable">
      <span className={`block whitespace-pre-wrap text-left ${className || ''}`}>
        {value || <span className="text-[#6B6B6B]">{placeholder}</span>}
      </span>
    </button>
  );
}

function RevisionBox({
  title = '修改方向',
  placeholder,
  loading,
  onRevise,
}: {
  title?: string;
  placeholder: string;
  loading: boolean;
  onRevise: (instruction: string) => Promise<boolean>;
}) {
  const [instruction, setInstruction] = useState('');

  return (
    <section className="rounded-[22px] bg-[#F5F0E8] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="mac-label !mb-0">{title}</label>
        {instruction.trim() && (
          <button type="button" onClick={() => setInstruction('')} className="mac-clear-btn">
            一键清空
          </button>
        )}
      </div>
      <textarea
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className="mac-textarea !min-h-[112px] !bg-white"
      />
      <button
        type="button"
        onClick={async () => {
          const ok = await onRevise(instruction);
          if (ok) setInstruction('');
        }}
        disabled={loading || !instruction.trim()}
        className="mac-primary-btn mt-3 w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        按方向修改
      </button>
    </section>
  );
}

function isHostedRuntime() {
  if (typeof window === 'undefined') return false;
  return !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function loadAppPassword() {
  try {
    return localStorage.getItem(APP_PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

function PasswordGate({ onUnlock }: { onUnlock: (password: string) => Promise<boolean> }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const password = value.trim();
    if (!password || checking) return;
    setChecking(true);
    setError('');
    const ok = await onUnlock(password);
    setChecking(false);
    if (!ok) {
      setError('密码不正确，请重新输入。');
      return;
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#D4E8E0] p-5">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(26,26,26,0.12)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E8]">
          <User className="h-6 w-6 text-[#1A1A1A]" />
        </div>
        <h1 className="text-center text-2xl font-black text-[#1A1A1A]">输入访问密码</h1>
        <p className="mt-3 text-center text-sm leading-6 text-[#6B6B6B]">
          这是云端版本的个人访问保护。密码会保存在当前浏览器里，下次打开不用重复输入。
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="请输入你在 Vercel 配置的 APP_PASSWORD"
            className="mac-input"
            autoFocus
          />
          {error && <p className="text-xs leading-5 text-[#D93025]">{error}</p>}
          <button type="submit" className="mac-primary-btn w-full" disabled={checking}>
            {checking ? '验证中…' : '进入应用'}
          </button>
        </form>
        <p className="mt-4 text-xs leading-5 text-[#6B6B6B]">
          密码输错不会被保存；万一被锁住，可在「设置」里点「重新输入访问密码」。
        </p>
      </div>
    </div>
  );
}

function OutputResult({
  result,
  factCheckStatuses,
  polishChanges,
  polishingField,
  titleRegenerating,
  revisingContent,
  canRestorePost,
  contentResearchQuestion,
  contentResearchResult,
  contentResearchLoading,
  contentResearchError,
  chatRowCount,
  styleSkillName,
  chatSkillName,
  enabledGuideSkills,
  reviewReport,
  reviewLoading,
  onBack,
  onCopy,
  onTitleChange,
  onPostChange,
  onRestorePost,
  onContentResearchQuestionChange,
  onResearchContent,
  onPolishField,
  onRegenerateTitle,
  onReviseContent,
  onMarkFactCheck,
  onSave,
  onOpenChatModal,
  onOpenCover,
  onReReview,
  onApplySuggestion,
}: {
  result: GenerationResult;
  factCheckStatuses: Record<number, FactCheckStatus>;
  polishChanges: string[];
  polishingField: 'title' | 'post' | null;
  titleRegenerating: boolean;
  revisingContent: boolean;
  canRestorePost: boolean;
  contentResearchQuestion: string;
  contentResearchResult: GeneratedContentResearchResult | null;
  contentResearchLoading: boolean;
  contentResearchError: string;
  chatRowCount: number;
  styleSkillName?: string;
  chatSkillName?: string;
  enabledGuideSkills: Array<{ id: string; name: string }>;
  reviewReport: ContentReviewReport | null;
  reviewLoading: boolean;
  onBack: () => void;
  onCopy: (text: string) => void;
  onTitleChange: (value: string) => void;
  onPostChange: (value: string) => void;
  onRestorePost: () => void;
  onContentResearchQuestionChange: (value: string) => void;
  onResearchContent: () => Promise<void>;
  onPolishField: (field: 'title' | 'post') => void;
  onRegenerateTitle: () => Promise<void>;
  onReviseContent: (instruction: string) => Promise<boolean>;
  onMarkFactCheck: (index: number, status: FactCheckStatus) => void;
  onSave: () => void;
  onOpenChatModal: () => void;
  onOpenCover: () => void;
  onReReview: () => void;
  onApplySuggestion: (suggestion: string, skillName: string) => Promise<void>;
}) {
  const cleanTags = (result.tags || []).map(cleanTag).filter(Boolean);
  const tagText = cleanTags.map((tag) => `#${tag}`).join(' ');
  const postCopyText = [result.post, tagText].filter(Boolean).join('\n\n');

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mac-kicker">Publish draft</p>
          <h2 className="mt-1 text-2xl font-bold text-[#1A1A1A]">内容已生成</h2>
        </div>
        <button type="button" onClick={onBack} className="mac-text-btn">
          <ArrowLeft className="h-4 w-4" />
          返回重新选择角度
        </button>
      </div>

      <section className="mac-result-card">
        <header className="mac-result-header">
          <span>🏷️ 标题</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => onCopy(result.title)} className="mac-mini-btn">
              <Copy className="h-3.5 w-3.5" /> 复制
            </button>
            <button type="button" onClick={() => onPolishField('title')} className="mac-mini-btn" disabled={polishingField !== null || titleRegenerating}>
              {polishingField === 'title' ? '润色中...' : '✨ 润色'}
            </button>
            <button type="button" onClick={() => onRegenerateTitle()} className="mac-mini-btn" disabled={titleRegenerating || polishingField !== null}>
              {titleRegenerating ? '生成中...' : <><RefreshCw className="h-3.5 w-3.5" /> 重来</>}
            </button>
          </div>
        </header>
        <EditableText
          value={result.title}
          onChange={onTitleChange}
          placeholder="点击编辑标题..."
          className="text-xl font-bold text-[#1A1A1A]"
        />
      </section>

      <section className="mac-result-card">
        <header className="mac-result-header">
          <span>📄 正文</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => onCopy(postCopyText)} className="mac-mini-btn">
              <Copy className="h-3.5 w-3.5" /> 复制
            </button>
            <button
              type="button"
              onClick={() => {
                onCopy(postCopyText);
                window.open('http://www.ju1.cn/', '_blank', 'noopener,noreferrer');
              }}
              className="mac-mini-btn"
            >
              <ExternalLink className="h-3.5 w-3.5" /> 句易网检测
            </button>
            <button type="button" onClick={() => onPolishField('post')} className="mac-mini-btn" disabled={polishingField !== null}>
              {polishingField === 'post' ? '润色中...' : '✨ 润色'}
            </button>
            <button type="button" onClick={onRestorePost} className="mac-mini-btn" disabled={!canRestorePost}>
              <ArrowLeft className="h-3.5 w-3.5" /> 恢复上一版
            </button>
          </div>
        </header>
        <EditableText
          value={result.post}
          multiline
          onChange={onPostChange}
          placeholder="点击编辑正文..."
          className="text-[15px] leading-[1.75] text-[#1A1A1A]"
        />
        {cleanTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 rounded-[18px] bg-[#F5F0E8] p-3">
            {cleanTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1A1A1A]">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E8E4DE] pt-4">
          <span className="rounded-full bg-[#C9EBCA] px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
            {result.post.trim().length} / 170 字
          </span>
          <span className="text-sm text-[#6B6B6B]">🔍 事实核查</span>
          <button
            type="button"
            onClick={onOpenCover}
            className="mac-mini-btn ml-auto"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            生成封面
          </button>
          <button
            type="button"
            onClick={onOpenChatModal}
            className="mac-mini-btn"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {chatRowCount > 0 ? `查看聊天记录 (${chatRowCount}条)` : '生成并查看聊天记录'}
          </button>
        </div>

        {/* 本次生效 SKILL */}
        <ActiveSkillsPanel
          styleSkillName={styleSkillName}
          chatSkillName={chatSkillName}
          guideSkills={enabledGuideSkills}
        />

        <FactCheckPanel
          items={(result.factChecks || []) as FactCheckItem[]}
          statuses={factCheckStatuses}
          onMark={onMarkFactCheck}
        />
        {result.reasoning && (
          <ReasoningPanel reasoning={result.reasoning} />
        )}

        {/* 内容审查报告 */}
        <ContentReviewPanel
          report={reviewReport}
          loading={reviewLoading}
          hasEnabledGuides={enabledGuideSkills.length > 0}
          onReReview={onReReview}
          onApplySuggestion={onApplySuggestion}
        />
        {polishChanges.length > 0 && (
          <div className="mt-4 rounded-[18px] bg-[#F5E6D0] p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#6B6B6B]">润色修改点</p>
            <ul className="space-y-1 text-sm leading-6 text-[#1A1A1A]">
              {polishChanges.map((change, index) => (
                <li key={`${change}-${index}`}>• {change}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <RevisionBox
        loading={revisingContent}
        placeholder="例如：方向改成韩国人熬夜不是自律，而是社会压力；开头更像真人吐槽；增加一点我自己的经历；结尾引导评论区讨论。"
        onRevise={onReviseContent}
      />

      <AiContentCheckPanel
        question={contentResearchQuestion}
        result={contentResearchResult}
        loading={contentResearchLoading}
        error={contentResearchError}
        onQuestionChange={onContentResearchQuestionChange}
        onResearch={onResearchContent}
        onCopy={onCopy}
      />

      <footer className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button type="button" onClick={onBack} className="mac-secondary-btn flex-1">
          ← 返回重新选择角度
        </button>
        <button type="button" onClick={onSave} className="mac-primary-btn flex-1">
          <Save className="h-4 w-4" />
          保存到历史记录
        </button>
      </footer>
    </motion.div>
  );
}

function ReasoningPanel({ reasoning }: { reasoning: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 rounded-[18px] border border-[#FF9F43]/20 bg-[#FFF7ED] p-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#FF9F43]" />
          <span className="text-xs font-bold text-[#1A1A1A]">AI 思考过程</span>
          <span className="rounded-full bg-[#FF9F43]/20 px-2 py-0.5 text-[10px] font-semibold text-[#FF9F43]">
            推理
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#FF9F43]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#FF9F43]" />
        )}
      </button>
      {expanded && (
        <div className="mt-3 max-h-[300px] overflow-y-auto rounded-xl bg-white/60 p-3 text-xs leading-relaxed text-[#6B6B6B]">
          <pre className="whitespace-pre-wrap font-sans">{reasoning}</pre>
        </div>
      )}
    </div>
  );
}

// ==================== 本次生效 SKILL 面板 ====================
function ActiveSkillsPanel({
  styleSkillName,
  chatSkillName,
  guideSkills,
}: {
  styleSkillName?: string;
  chatSkillName?: string;
  guideSkills: Array<{ id: string; name: string }>;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasAny = styleSkillName || chatSkillName || guideSkills.length > 0;

  if (!hasAny) {
    return (
      <div className="mt-3 rounded-[18px] border border-dashed border-[#E8E4DE] bg-white/50 p-3 text-center text-xs text-[#B8B5CC]">
        <Sparkles className="mx-auto mb-1 h-4 w-4" />
        还没有激活任何风格 SKILL 或方法论
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[18px] border border-[#C9EBCA]/50 bg-[#F0FAF0] p-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#2D7A3A]" />
          <span className="text-xs font-bold text-[#1A1A1A]">本次生效 SKILL</span>
          <span className="rounded-full bg-[#C9EBCA] px-2 py-0.5 text-[10px] font-semibold text-[#2D7A3A]">
            {(styleSkillName ? 1 : 0) + (chatSkillName ? 1 : 0) + guideSkills.length} 个
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#2D7A3A]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#2D7A3A]" />
        )}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          {styleSkillName && (
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="rounded-full bg-[#FF9F43]/20 px-2 py-0.5 text-[10px] font-bold text-[#FF9F43]">
                风格
              </span>
              <span className="text-sm font-medium text-[#1A1A1A]">{styleSkillName}</span>
            </div>
          )}
          {chatSkillName && (
            <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
              <span className="rounded-full bg-[#B8B5FF]/30 px-2 py-0.5 text-[10px] font-bold text-[#6B63D8]">
                聊天
              </span>
              <span className="text-sm font-medium text-[#1A1A1A]">{chatSkillName}</span>
            </div>
          )}
          {guideSkills.length > 0 && (
            <div className="rounded-xl bg-white/70 px-3 py-2">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-full bg-[#C9EBCA] px-2 py-0.5 text-[10px] font-bold text-[#2D7A3A]">
                  方法论
                </span>
                <span className="text-xs text-[#6B6B6B]">{guideSkills.length} 个已启用</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {guideSkills.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-[#F0FAF0] px-2 py-0.5 text-[10px] text-[#2D7A3A]"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== 内容审查报告面板 ====================
function ContentReviewPanel({
  report,
  loading,
  hasEnabledGuides,
  onReReview,
  onApplySuggestion,
}: {
  report: ContentReviewReport | null;
  loading: boolean;
  hasEnabledGuides: boolean;
  onReReview: () => void;
  onApplySuggestion: (suggestion: string, skillName: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  const statusConfig = {
    pass: { label: '优秀', color: 'text-[#2D7A3A]', bg: 'bg-[#C9EBCA]', border: 'border-[#C9EBCA]' },
    warning: { label: '待优化', color: 'text-[#B86B00]', bg: 'bg-[#FFE4C4]', border: 'border-[#FFE4C4]' },
    fail: { label: '需改进', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
  };

  if (!hasEnabledGuides) {
    return (
      <div className="mt-3 rounded-[18px] border border-dashed border-[#E8E4DE] bg-white/50 p-3 text-center">
        <p className="text-xs text-[#B8B5CC]">启用方法论 SKILL 后，生成内容会自动质检</p>
      </div>
    );
  }

  if (loading && !report) {
    return (
      <div className="mt-3 rounded-[18px] border border-[#FF9F43]/20 bg-[#FFF7ED] p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[#FF9F43]" />
          <span className="text-sm font-medium text-[#1A1A1A]">AI 正在质检内容...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mt-3 rounded-[18px] border border-dashed border-[#E8E4DE] bg-white/50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#6B6B6B]">点击按钮审查当前内容</p>
          <button type="button" onClick={onReReview} className="mac-mini-btn">
            <Sparkles className="h-3.5 w-3.5" />
            开始质检
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[report.overallStatus];

  return (
    <div className={`mt-3 rounded-[18px] border ${status.border} bg-white p-3`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`h-4 w-4 ${status.color}`} />
          <span className="text-xs font-bold text-[#1A1A1A]">内容质检报告</span>
          <span className={`rounded-full ${status.bg} px-2 py-0.5 text-[10px] font-bold ${status.color}`}>
            {report.overallScore} 分 · {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReReview();
            }}
            className="mac-mini-btn"
            title="重新审查"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? (
            <ChevronUp className={`h-4 w-4 ${status.color}`} />
          ) : (
            <ChevronDown className={`h-4 w-4 ${status.color}`} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {report.reviews.map((review) => {
            const rStatus = statusConfig[review.status];
            return (
              <div key={review.skillId} className="rounded-xl bg-[#FAF7F2] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full ${rStatus.bg} px-2 py-0.5 text-[10px] font-bold ${rStatus.color}`}>
                      {review.score} 分
                    </span>
                    <span className="text-sm font-bold text-[#1A1A1A]">{review.skillName}</span>
                  </div>
                </div>
                <p className="mb-2 text-xs text-[#6B6B6B]">{review.summary}</p>
                <div className="space-y-1">
                  {review.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={item.pass ? 'text-[#2D7A3A]' : 'text-[#E55353]'}>
                        {item.pass ? '✓' : '✗'}
                      </span>
                      <div>
                        <span className="font-medium text-[#1A1A1A]">{item.name}</span>
                        <span className="text-[#6B6B6B]"> — {item.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {review.suggestions.length > 0 && (
                  <div className="mt-2 rounded-lg bg-[#FFF7ED] p-2">
                    <p className="mb-1 text-[10px] font-bold text-[#FF9F43]">💡 改进建议</p>
                    <ul className="space-y-1.5 text-xs text-[#6B6B6B]">
                      {review.suggestions.map((s, i) => {
                        const key = `${review.skillId}-${i}`;
                        const isApplying = applyingKey === key;
                        return (
                          <li key={i} className="flex items-start justify-between gap-2">
                            <span className="flex-1">• {s}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                setApplyingKey(key);
                                try {
                                  await onApplySuggestion(s, review.skillName);
                                } finally {
                                  setApplyingKey(null);
                                }
                              }}
                              disabled={applyingKey !== null}
                              className="mac-mini-btn shrink-0"
                              title="按这条建议改写并预览"
                            >
                              {isApplying ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" /> 生成中
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3" /> 采纳
                                </>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AiContentCheckPanel({
  question,
  result,
  loading,
  error,
  onQuestionChange,
  onResearch,
  onCopy,
}: {
  question: string;
  result: GeneratedContentResearchResult | null;
  loading: boolean;
  error: string;
  onQuestionChange: (value: string) => void;
  onResearch: () => Promise<void>;
  onCopy: (text: string) => void;
}) {
  const copyText = result
    ? [
        `背景判断：${result.summary}`,
        result.angles.length ? `可用角度：\n${result.angles.map((item) => `- ${item}`).join('\n')}` : '',
        result.risks.length ? `风险提醒：\n${result.risks.map((item) => `- ${item}`).join('\n')}` : '',
        result.insertableLines.length
          ? `可加入正文的句子：\n${result.insertableLines.map((item) => `- ${item}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    : '';

  return (
    <section className="mac-result-card">
      <header className="mac-result-header">
        <span>🔍 AI 内容检索 / 背景 Check</span>
        {result && (
          <button type="button" onClick={() => onCopy(copyText)} className="mac-mini-btn">
            <Copy className="h-3.5 w-3.5" /> 复制结果
          </button>
        )}
      </header>
      <div className="rounded-[20px] bg-[#F5F0E8] p-4">
        <textarea
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          rows={3}
          placeholder="例如：帮我 check 这个背景是否真实；这个角度会不会太硬广；补充一个更真实的外国朋友视角。"
          className="mac-textarea !min-h-[96px] !bg-white"
        />
        <button type="button" onClick={onResearch} disabled={loading} className="mac-primary-btn mt-3 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? '检索中...' : 'AI 内容检索'}
        </button>
      </div>
      {error && <p className="mt-3 rounded-2xl bg-[#F5D5D5] px-4 py-2 text-sm text-[#1A1A1A]">{error}</p>}
      {result && (
        <div className="mt-4 grid gap-3">
          <div>
            <p className="mac-label">背景判断</p>
            <p className="text-sm leading-6 text-[#1A1A1A]">{result.summary || '暂无明确判断。'}</p>
          </div>
          <MiniList title="可用角度" items={result.angles} />
          <MiniList title="风险提醒" items={result.risks} tone="warn" />
          <MiniList title="可加入正文的句子" items={result.insertableLines} />
        </div>
      )}
    </section>
  );
}

function MiniList({ title, items, tone = 'default' }: { title: string; items: string[]; tone?: 'default' | 'warn' }) {
  if (!items.length) return null;
  return (
    <div className={`rounded-[18px] p-3 ${tone === 'warn' ? 'bg-[#F5E6D0]' : 'bg-[#FAF7F2]'}`}>
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#6B6B6B]">{title}</p>
      <ul className="space-y-1 text-sm leading-6 text-[#1A1A1A]">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function ChatResult({
  rows,
  loading,
  rowLoadingIndex,
  scene,
  onSceneChange,
  onChange,
  onCopy,
  onRegenerate,
  onContinue,
  onRegenerateRow,
}: {
  rows: ChatRow[];
  loading: boolean;
  rowLoadingIndex: number | null;
  scene: string;
  onSceneChange: (value: string) => void;
  onChange: (rows: ChatRow[]) => void;
  onCopy: (text: string) => void;
  onRegenerate: (instruction?: string, scene?: string) => Promise<boolean>;
  onContinue: (instruction?: string, scene?: string) => Promise<boolean>;
  onRegenerateRow: (index: number, instruction?: string, scene?: string) => Promise<boolean>;
}) {
  const [chatInstruction, setChatInstruction] = useState('');

  function update(index: number, key: keyof ChatRow, value: string) {
    onChange(rows.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  }
  function deleteRow(index: number) {
    onChange(rows.filter((_, idx) => idx !== index));
  }

  return (
    <section className="mac-result-card">
      <header className="mac-result-header">
        <span>💬 聊天记录</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const ok = await onRegenerate(chatInstruction, scene);
              if (ok) setChatInstruction('');
            }}
            className="mac-mini-btn"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {rows?.length ? '按当前正文重生成' : '生成聊天记录'}
          </button>
          {rows?.length > 0 && (
            <>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onContinue(chatInstruction, scene);
                  if (ok) setChatInstruction('');
                }}
                className="mac-mini-btn"
                disabled={loading}
              >
                {loading ? '处理中...' : '按建议重写聊天'}
              </button>
              <button
                type="button"
                onClick={() => onCopy(rows.map((row) => `${row.target}\t${row.foreign}\t${row.chinese}`).join('\n'))}
                className="mac-mini-btn"
              >
                <Copy className="h-3.5 w-3.5" /> 复制表格
              </button>
            </>
          )}
        </div>
      </header>
      {!rows?.length ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-[22px] border-2 border-dashed border-[#E8E4DE] bg-[#FAF7F2] p-6 text-center">
          <div>
            <MessageCircle className="mx-auto mb-3 h-9 w-9 text-[#F0B8B8]" />
            <h3 className="text-base font-black text-[#1A1A1A]">确认正文后生成聊天记录</h3>
            <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
              你可以先修改标题和正文，再点击上方按钮。聊天会基于当前最新版正文生成，不浪费主生成 token。
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mac-chat-table-wrap">
            <table className="mac-chat-table">
              <thead>
                <tr>
                  <th>对象</th>
                  <th>外语</th>
                  <th>中文</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={row.target}
                        onChange={(event) => update(index, 'target', event.target.value)}
                        className="mac-table-input font-bold"
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.foreign}
                        onChange={(event) => update(index, 'foreign', event.target.value)}
                        rows={2}
                        className="mac-table-input min-h-[58px] resize-y"
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.chinese}
                        onChange={(event) => update(index, 'chinese', event.target.value)}
                        rows={2}
                        className="mac-table-input min-h-[58px] resize-y"
                      />
                    </td>
                    <td>
                      <div className="flex min-w-[108px] flex-col gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await onRegenerateRow(index, chatInstruction, scene);
                            if (ok) setChatInstruction('');
                          }}
                          disabled={loading || rowLoadingIndex !== null}
                          className="mac-row-action-btn"
                        >
                          {rowLoadingIndex === index ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          重生成本行
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          disabled={loading || rowLoadingIndex !== null || rows.length <= 1}
                          className="mac-row-action-btn danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6B6B6B]">
            修改任意单元格后，也可以在下方写清楚你想要的方向，系统会结合正文、已改聊天和建议重写后续内容。
          </p>
        </>
      )}
      <div className="mt-4 rounded-[20px] bg-[#F5F0E8] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="mac-label !mb-0">聊天场景 / 起因（可选）</label>
          {scene.trim() && (
            <button type="button" onClick={() => onSceneChange('')} className="mac-clear-btn">
              一键清空
            </button>
          )}
        </div>
        <textarea
          value={scene}
          onChange={(event) => onSceneChange(event.target.value)}
          rows={2}
          placeholder="例如：我在动态里吐槽被外国朋友追问收入，他看到后私信我解释为什么这么问；或者：他先在我的动态下留言，我才开始私聊。"
          className="mac-textarea !min-h-[72px] !bg-white"
        />
      </div>
      <div className="mt-4 rounded-[20px] bg-[#F5F0E8] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="mac-label !mb-0">聊天记录修改建议</label>
          {chatInstruction.trim() && (
            <button type="button" onClick={() => setChatInstruction('')} className="mac-clear-btn">
              一键清空
            </button>
          )}
        </div>
        <textarea
          value={chatInstruction}
          onChange={(event) => setChatInstruction(event.target.value)}
          rows={3}
          placeholder="例如：前半段改成巴西朋友先反问我为什么会这样想，后面多聊真实生活感受，不要像科普；或者：保留前3行，后面围绕我修改的观点继续追问。"
          className="mac-textarea !min-h-[96px] !bg-white"
        />
        <button
          type="button"
          onClick={async () => {
            const ok = await onContinue(chatInstruction);
            if (ok) setChatInstruction('');
          }}
          disabled={loading || rowLoadingIndex !== null}
          className="mac-primary-btn mt-3 w-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          按修改建议生成
        </button>
      </div>
    </section>
  );
}

function ChatModal({
  open,
  rows,
  loading,
  rowLoadingIndex,
  scene,
  onSceneChange,
  onClose,
  onChange,
  onCopy,
  onRegenerate,
  onContinue,
  onRegenerateRow,
}: {
  open: boolean;
  rows: ChatRow[];
  loading: boolean;
  rowLoadingIndex: number | null;
  scene: string;
  onSceneChange: (value: string) => void;
  onClose: () => void;
  onChange: (rows: ChatRow[]) => void;
  onCopy: (text: string) => void;
  onRegenerate: (instruction?: string, scene?: string) => Promise<boolean>;
  onContinue: (instruction?: string, scene?: string) => Promise<boolean>;
  onRegenerateRow: (index: number, instruction?: string, scene?: string) => Promise<boolean>;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-[24px] bg-[#FAF7F2] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#F0B8B8]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">聊天记录</h2>
            {rows.length > 0 && (
              <span className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-xs text-[#6B6B6B]">
                {rows.length} 条
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="mac-icon-btn">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <ChatResult
            rows={rows}
            loading={loading}
            rowLoadingIndex={rowLoadingIndex}
            scene={scene}
            onSceneChange={onSceneChange}
            onChange={onChange}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
            onContinue={onContinue}
            onRegenerateRow={onRegenerateRow}
          />
        </div>
      </motion.div>
    </div>
  );
}

function DynamicCard({
  stage,
  angles,
  selectedAngleId,
  loading,
  result,
  factCheckStatuses,
  polishChanges,
  polishingField,
  titleRegenerating,
  revisingContent,
  chatLoading,
  rowLoadingIndex,
  canRestorePost,
  contentResearchQuestion,
  contentResearchResult,
  contentResearchLoading,
  contentResearchError,
  styleSkillName,
  chatSkillName,
  enabledGuideSkills,
  reviewReport,
  reviewLoading,
  onSelectAngle,
  onGenerate,
  onAddCustomAngle,
  onBack,
  onCopy,
  onTitleChange,
  onPostChange,
  onRestorePost,
  onChatChange,
  onContentResearchQuestionChange,
  onResearchContent,
  onPolishField,
  onRegenerateTitle,
  onReviseContent,
  onRegenerateChat,
  onContinueChat,
  onRegenerateChatRow,
  onMarkFactCheck,
  onSave,
  onOpenChatModal,
  onOpenCover,
  onReReview,
  onApplySuggestion,
}: {
  stage: Stage;
  angles: Angle[];
  selectedAngleId: number | null;
  loading: 'analyze' | 'generate' | null;
  result: GenerationResult;
  factCheckStatuses: Record<number, FactCheckStatus>;
  polishChanges: string[];
  polishingField: 'title' | 'post' | null;
  titleRegenerating: boolean;
  revisingContent: boolean;
  chatLoading: boolean;
  rowLoadingIndex: number | null;
  canRestorePost: boolean;
  contentResearchQuestion: string;
  contentResearchResult: GeneratedContentResearchResult | null;
  contentResearchLoading: boolean;
  contentResearchError: string;
  styleSkillName?: string;
  chatSkillName?: string;
  enabledGuideSkills: Array<{ id: string; name: string }>;
  reviewReport: ContentReviewReport | null;
  reviewLoading: boolean;
  onSelectAngle: (id: number) => void;
  onGenerate: () => void;
  onAddCustomAngle: (angle: Angle) => void;
  onBack: () => void;
  onCopy: (text: string) => void;
  onTitleChange: (value: string) => void;
  onPostChange: (value: string) => void;
  onRestorePost: () => void;
  onChatChange: (rows: ChatRow[]) => void;
  onContentResearchQuestionChange: (value: string) => void;
  onResearchContent: () => Promise<void>;
  onPolishField: (field: 'title' | 'post') => void;
  onRegenerateTitle: () => Promise<void>;
  onReviseContent: (instruction: string) => Promise<boolean>;
  onRegenerateChat: (instruction?: string) => Promise<boolean>;
  onContinueChat: (instruction?: string) => Promise<boolean>;
  onRegenerateChatRow: (index: number, instruction?: string) => Promise<boolean>;
  onMarkFactCheck: (index: number, status: FactCheckStatus) => void;
  onSave: () => void;
  onOpenChatModal: () => void;
  onOpenCover: () => void;
  onReReview: () => void;
  onApplySuggestion: (suggestion: string, skillName: string) => Promise<void>;
}) {
  return (
    <section className="mac-card mac-dynamic-card">
      <AnimatePresence mode="wait">
        {stage === 'empty' && <EmptyState />}
        {stage === 'angles' && (
          <AngleSelection
            angles={angles}
            selectedAngleId={selectedAngleId}
            loading={loading}
            onSelectAngle={onSelectAngle}
            onAddCustomAngle={onAddCustomAngle}
            onGenerate={onGenerate}
          />
        )}
        {stage === 'generating' && <GeneratingState />}
        {stage === 'result' && (
          <OutputResult
            result={result}
            factCheckStatuses={factCheckStatuses}
            polishChanges={polishChanges}
            polishingField={polishingField}
            titleRegenerating={titleRegenerating}
            revisingContent={revisingContent}
            canRestorePost={canRestorePost}
            contentResearchQuestion={contentResearchQuestion}
            contentResearchResult={contentResearchResult}
            contentResearchLoading={contentResearchLoading}
            contentResearchError={contentResearchError}
            chatRowCount={result.chat?.length || 0}
            styleSkillName={styleSkillName}
            chatSkillName={chatSkillName}
            enabledGuideSkills={enabledGuideSkills}
            reviewReport={reviewReport}
            reviewLoading={reviewLoading}
            onBack={onBack}
            onCopy={onCopy}
            onTitleChange={onTitleChange}
            onPostChange={onPostChange}
            onRestorePost={onRestorePost}
            onContentResearchQuestionChange={onContentResearchQuestionChange}
            onResearchContent={onResearchContent}
            onPolishField={onPolishField}
            onRegenerateTitle={onRegenerateTitle}
            onReviseContent={onReviseContent}
            onMarkFactCheck={onMarkFactCheck}
            onSave={onSave}
            onOpenChatModal={onOpenChatModal}
            onOpenCover={onOpenCover}
            onReReview={onReReview}
            onApplySuggestion={onApplySuggestion}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function countVisibleText(text: string) {
  return String(text || '').replace(/[\s\p{P}\p{S}]/gu, '').length;
}

function AppRecommendationView({
  topic,
  material,
  result,
  loading,
  revising,
  error,
  onTopicChange,
  onMaterialChange,
  onResultChange,
  onGenerate,
  onRevise,
  onClear,
  onCopy,
  styleSkills,
  appStyleSkillId,
  enabledGuideCount,
  onSelectAppStyleSkill,
}: {
  topic: string;
  material: string;
  result: AppRecommendationResult | null;
  loading: boolean;
  revising: boolean;
  error: string;
  styleSkills: Array<{ id: string; name: string }>;
  appStyleSkillId: string | null;
  enabledGuideCount: number;
  onSelectAppStyleSkill: (id: string | null) => void;
  onTopicChange: (value: string) => void;
  onMaterialChange: (value: string) => void;
  onResultChange: (value: AppRecommendationResult) => void;
  onGenerate: () => void;
  onRevise: (instruction: string) => Promise<boolean>;
  onClear: () => void;
  onCopy: (text: string) => void;
}) {
  const tagsText = result?.tags.join(' ') || '';
  const fullPostText = result ? [result.title, '', result.post, '', tagsText].join('\n') : '';
  const forbiddenHits = result?.forbiddenHits || [];

  function updateResult(patch: Partial<AppRecommendationResult>) {
    if (!result) return;
    onResultChange({ ...result, ...patch });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mac-card p-6"
    >
      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mac-kicker">App share · 真人分享</p>
              <h1 className="mt-1 text-2xl font-bold text-[#1A1A1A]">小红书 · APP 真人分享贴</h1>
              <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
                左侧写真实场景，右侧出标题、正文和标签。核心是像真人分享，不像广告。
              </p>
            </div>
            <BookOpen className="h-10 w-10 shrink-0 text-[#F0B8B8]" />
          </div>

          <label className="block">
            <span className="mb-2 flex items-center justify-between">
              <span className="mac-label !mb-0">分享主题 / 真实场景</span>
              {(topic.trim() || material.trim()) && (
                <button type="button" onClick={onClear} className="mac-clear-btn">
                  一键清空
                </button>
              )}
            </span>
            <input
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              placeholder="例如：马上要去日本玩想学点日语"
              className="mac-input"
            />
          </label>

          <label className="block">
            <span className="mac-label">风格 SKILL（仅作用于 APP 推荐）</span>
            <select
              value={appStyleSkillId || ''}
              onChange={(event) => onSelectAppStyleSkill(event.target.value || null)}
              className="mac-input"
            >
              <option value="">不使用风格 SKILL</option>
              {styleSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-[#6B6B6B]">
              {styleSkills.length === 0
                ? '还没有风格 SKILL，可在顶部「SKILL」里从爆文提炼。'
                : enabledGuideCount > 0
                  ? `与文章生成的选择互不影响，同时参考 ${enabledGuideCount} 个已启用的方法论 SKILL。`
                  : '与文章生成的选择互不影响；启用方法论 SKILL 后会自动参考。'}
            </span>
          </label>

          <label className="block">
            <span className="mac-label">素材文档 / 参考资料</span>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[18px] bg-[#F5F0E8] p-3">
              <label className="mac-mini-btn cursor-pointer !bg-white">
                <FileText className="h-3.5 w-3.5" />
                读取素材文档
                <input
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => onMaterialChange(String(reader.result || ''));
                    reader.readAsText(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <span className="text-xs leading-5 text-[#6B6B6B]">
                支持 txt / md / csv / json；也可以直接粘贴素材。
              </span>
            </div>
            <textarea
              value={material}
              onChange={(event) => onMaterialChange(event.target.value)}
              rows={6}
              placeholder="把 APP 素材、产品卖点、禁用表达、可参考文案粘贴在这里。LLM 会学习素材，但正文仍按真人分享语气改写，不会照搬。"
              className="mac-textarea !min-h-[150px]"
            />
          </label>

          <div className="rounded-[18px] bg-[#F5F0E8] p-4 text-sm leading-6 text-[#6B6B6B]">
            固定规则：标题不超过 20 字；正文 100-220 字；结构为真实背景 + 1、2、3 分别写至少 3 个 APP 优点；HelloTalk 在前两位被提到；禁止 Tandem、YeeTalk 等同类型竞品；标签必带 #认识外国人 #找外国人聊天；标题和正文都不能出现「最 / 神器 / 推荐 / 种草 / 必备 / 安利」等违禁词。
          </div>

          {error && <p className="rounded-2xl bg-[#F5D5D5] px-4 py-2 text-sm text-[#1A1A1A]">{error}</p>}

          <button type="button" onClick={onGenerate} disabled={loading} className="mac-primary-btn w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                生成真人分享贴
              </>
            )}
          </button>
        </aside>

        <main className="min-w-0">
          {!result && (
            <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border-2 border-dashed border-[#E8E4DE] bg-[#FAF7F2] p-8 text-center">
              <div>
                <BookOpen className="mx-auto mb-4 h-10 w-10 text-[#F0B8B8]" />
                <h2 className="text-lg font-black text-[#1A1A1A]">右侧会显示生成结果</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
                  生成后只保留标题、正文和标签，方便直接编辑和复制。
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
          {forbiddenHits.length > 0 && (
            <div className="rounded-2xl bg-[#F5D5D5] px-4 py-3 text-sm leading-6 text-[#1A1A1A]">
              ⚠️ 检测到违禁词：{forbiddenHits.join('、')}。我已尽量回避，但仍出现在标题或正文里，请手动改写后再发。
            </div>
          )}

          <section className="mac-result-card">
            <header className="mac-result-header">
              <span>🏷️ 标题</span>
              <div className="flex gap-2">
                <span className="rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-semibold text-[#6B6B6B]">
                  {result.title.length} / 20 字
                </span>
                <button type="button" onClick={() => onCopy(result.title)} className="mac-mini-btn">
                  <Copy className="h-3.5 w-3.5" /> 复制
                </button>
              </div>
            </header>
            <input
              value={result.title}
              onChange={(event) => updateResult({ title: event.target.value.slice(0, 20) })}
              className="mac-input !bg-white text-xl font-bold"
            />
          </section>

          <section className="mac-result-card">
            <header className="mac-result-header">
              <span>📄 正文贴文</span>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#C9EBCA] px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
                  {countVisibleText(result.post)} 字
                </span>
                <button type="button" onClick={() => onCopy([result.post, tagsText].join('\n\n'))} className="mac-mini-btn">
                  <Copy className="h-3.5 w-3.5" /> 复制正文+标签
                </button>
                <button type="button" onClick={() => onCopy(fullPostText)} className="mac-mini-btn">
                  <Copy className="h-3.5 w-3.5" /> 复制全部
                </button>
              </div>
            </header>
            <textarea
              value={result.post}
              onChange={(event) => updateResult({ post: event.target.value })}
              rows={10}
              className="mac-textarea !min-h-[220px] !bg-white"
            />
            <div className="mt-4 flex flex-wrap gap-2 rounded-[18px] bg-[#F5F0E8] p-3">
              {result.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1A1A1A]">
                  {tag}
                </span>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="mac-label">标签（用空格分隔，至少含 #认识外国人 #找外国人聊天）</span>
              <input
                value={tagsText}
                onChange={(event) =>
                  updateResult({
                    tags: event.target.value
                      .split(/\s+/)
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
                  })
                }
                className="mac-input !bg-white"
              />
            </label>
          </section>
          <RevisionBox
            loading={revising}
            placeholder="例如：开头加一点我马上去日本玩的真实背景；不要像广告；语气更像朋友分享；多写为什么我会想用这个APP。"
            onRevise={onRevise}
          />
            </div>
          )}
        </main>
      </div>
    </motion.section>
  );
}

function ChatLabView({
  country,
  platform,
  title,
  post,
  rows,
  loading,
  rowLoadingIndex,
  instruction,
  scene,
  error,
  onCountryChange,
  onPlatformChange,
  onTitleChange,
  onPostChange,
  onInstructionChange,
  onSceneChange,
  onClearPost,
  onChange,
  onCopy,
  onGenerate,
  onContinue,
  onRegenerateRow,
}: {
  country: Country;
  platform: Platform;
  title: string;
  post: string;
  rows: ChatRow[];
  loading: boolean;
  rowLoadingIndex: number | null;
  instruction: string;
  scene: string;
  error: string;
  onCountryChange: (value: Country) => void;
  onPlatformChange: (value: Platform) => void;
  onTitleChange: (value: string) => void;
  onPostChange: (value: string) => void;
  onInstructionChange: (value: string) => void;
  onSceneChange: (value: string) => void;
  onClearPost: () => void;
  onChange: (rows: ChatRow[]) => void;
  onCopy: (text: string) => void;
  onGenerate: () => Promise<boolean>;
  onContinue: () => Promise<boolean>;
  onRegenerateRow: (index: number) => Promise<boolean>;
}) {
  function update(index: number, key: keyof ChatRow, value: string) {
    onChange(rows.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  }
  function deleteRow(index: number) {
    onChange(rows.filter((_, idx) => idx !== index));
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mac-card p-6"
    >
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mac-kicker">Chat lab</p>
              <h1 className="mt-1 text-2xl font-bold text-[#1A1A1A]">直接为正文生成聊天记录</h1>
              <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
                左侧粘贴标题、正文和修改建议，右侧编辑聊天表格。退出文章改写流程后，也能直接补生成聊天记录。
              </p>
            </div>
            <MessageCircle className="h-10 w-10 shrink-0 text-[#F0B8B8]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end xl:grid-cols-1">
            <label>
              <span className="mac-label">国家</span>
              <select
                value={country}
                onChange={(event) => onCountryChange(event.target.value as Country)}
                className="mac-select"
              >
                {COUNTRIES.map((item) => (
                  <option key={item} value={item}>
                    {flagForCountry(item)} {item} · {LANGUAGE_MAP[item]}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="mac-label">平台</span>
              <PlatformPills value={platform} onChange={onPlatformChange} />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="mac-label !mb-0">输入内容</span>
              {(title.trim() || post.trim() || instruction.trim() || scene.trim() || rows.length > 0) && (
                <button type="button" onClick={onClearPost} className="mac-clear-btn">
                  一键清空全部
                </button>
              )}
            </div>
            <label>
              <span className="mac-label">标题（可选）</span>
              <input
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="粘贴或输入标题，便于聊天记录贴合主题..."
                className="mac-input"
              />
            </label>
            <label>
              <span className="mac-label">正文 *</span>
              <textarea
                value={post}
                onChange={(event) => onPostChange(event.target.value)}
                placeholder="粘贴你最终版的正文..."
                className="mac-textarea"
              />
            </label>
            <label>
              <span className="mac-label">聊天场景 / 起因（可选）</span>
              <textarea
                value={scene}
                onChange={(event) => onSceneChange(event.target.value)}
                rows={2}
                placeholder="例如：我在动态里吐槽被外国朋友追问收入，他看到后私信我解释为什么这么问。写明为什么会有这段聊天，生成的开场会更自然。"
                className="mac-textarea !min-h-[72px]"
              />
            </label>
            <label>
              <span className="mac-label">想要的聊天方向 / 修改建议（可选）</span>
              <textarea
                value={instruction}
                onChange={(event) => onInstructionChange(event.target.value)}
                rows={3}
                placeholder="例如：聊天里多聊真实生活感受，不要像科普；外国朋友先反问，再分享自己的经历。"
                className="mac-textarea !min-h-[96px]"
              />
            </label>
          </div>

          {error && <p className="rounded-2xl bg-[#F5D5D5] px-4 py-2 text-sm text-[#1A1A1A]">{error}</p>}

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || rowLoadingIndex !== null}
            className="mac-primary-btn w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {rows.length ? '重新生成聊天记录' : '生成聊天记录'}
              </>
            )}
          </button>
        </aside>

        <main className="min-w-0">
          {rows.length === 0 && (
            <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border-2 border-dashed border-[#E8E4DE] bg-[#FAF7F2] p-8 text-center">
              <div>
                <MessageCircle className="mx-auto mb-4 h-10 w-10 text-[#F0B8B8]" />
                <h2 className="text-lg font-black text-[#1A1A1A]">右侧会显示聊天表格</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
                  生成后可以单行重生成、删除、按建议重写或复制表格。
                </p>
              </div>
            </div>
          )}

          {rows.length > 0 && (
        <section className="mac-result-card">
          <header className="mac-result-header">
            <span>💬 聊天记录</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onContinue}
                className="mac-mini-btn"
                disabled={loading || rowLoadingIndex !== null}
              >
                {loading ? '处理中...' : '按建议重写聊天'}
              </button>
              <button
                type="button"
                onClick={() => onCopy(rows.map((row) => `${row.target}\t${row.foreign}\t${row.chinese}`).join('\n'))}
                className="mac-mini-btn"
              >
                <Copy className="h-3.5 w-3.5" /> 复制表格
              </button>
            </div>
          </header>
          <div className="mac-chat-table-wrap">
            <table className="mac-chat-table">
              <thead>
                <tr>
                  <th>对象</th>
                  <th>外语</th>
                  <th>中文</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={row.target}
                        onChange={(event) => update(index, 'target', event.target.value)}
                        className="mac-table-input font-bold"
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.foreign}
                        onChange={(event) => update(index, 'foreign', event.target.value)}
                        rows={2}
                        className="mac-table-input min-h-[58px] resize-y"
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.chinese}
                        onChange={(event) => update(index, 'chinese', event.target.value)}
                        rows={2}
                        className="mac-table-input min-h-[58px] resize-y"
                      />
                    </td>
                    <td>
                      <div className="flex min-w-[108px] flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => onRegenerateRow(index)}
                          disabled={loading || rowLoadingIndex !== null}
                          className="mac-row-action-btn"
                        >
                          {rowLoadingIndex === index ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          重生成本行
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          disabled={loading || rowLoadingIndex !== null || rows.length <= 1}
                          className="mac-row-action-btn danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6B6B6B]">
            修改正文或聊天方向后，点击“按建议重写聊天”会根据最新正文重新生成整份聊天记录，不会只把新增内容追加到尾部。
          </p>
            </section>
          )}
        </main>
      </div>
    </motion.section>
  );
}

function DocumentGeneratorView({
  document,
  briefing,
  result,
  variation,
  loading,
  error,
  country,
  platform,
  onDocumentChange,
  onBriefingChange,
  onCountryChange,
  onPlatformChange,
  onGenerate,
  onRegenerate,
  onClear,
  onCopy,
}: {
  document: string;
  briefing: string;
  result: GenerationResult | null;
  variation: number;
  loading: boolean;
  error: string;
  country: Country;
  platform: Platform;
  onDocumentChange: (value: string) => void;
  onBriefingChange: (value: string) => void;
  onCountryChange: (value: Country) => void;
  onPlatformChange: (value: Platform) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onClear: () => void;
  onCopy: (text: string) => void;
}) {
  const tagsText = result?.tags.join(' ') || '';
  const fullPostText = result ? [result.title, '', result.post, '', tagsText].join('\n') : '';

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mac-card p-6"
    >
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mac-kicker">Doc-driven · 按文档生成</p>
              <h1 className="mt-1 text-2xl font-bold text-[#1A1A1A]">按文档生成</h1>
              <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
                上传 / 粘贴本次活动文档，写明投放要求，AI 会按要求输出标题、正文和标签。
              </p>
            </div>
            <FileText className="h-10 w-10 shrink-0 text-[#F0B8B8]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mac-label">国家</span>
              <select
                value={country}
                onChange={(event) => onCountryChange(event.target.value as Country)}
                className="mac-input"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mac-label">平台</span>
              <select
                value={platform}
                onChange={(event) => onPlatformChange(event.target.value as Platform)}
                className="mac-input"
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 flex items-center justify-between">
              <span className="mac-label !mb-0">本次活动 / 投放说明</span>
              {(briefing.trim() || document.trim()) && (
                <button type="button" onClick={onClear} className="mac-clear-btn">
                  一键清空
                </button>
              )}
            </span>
            <textarea
              value={briefing}
              onChange={(event) => onBriefingChange(event.target.value)}
              rows={4}
              placeholder="例如：本次是沪江推广，要求只做真实分享，不要带聊天记录；正文要突出文化差异点 + 学习困扰。"
              className="mac-textarea !min-h-[110px]"
            />
          </label>

          <label className="block">
            <span className="mac-label">素材文档（导入或粘贴）</span>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[18px] bg-[#F5F0E8] p-3">
              <label className="mac-mini-btn cursor-pointer !bg-white">
                <FileText className="h-3.5 w-3.5" />
                读取文档
                <input
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => onDocumentChange(String(reader.result || ''));
                    reader.readAsText(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <span className="text-xs leading-5 text-[#6B6B6B]">
                支持 txt / md / csv / json；也可直接粘贴正文。
              </span>
            </div>
            <textarea
              value={document}
              onChange={(event) => onDocumentChange(event.target.value)}
              rows={8}
              placeholder="把活动文档/产品口径/品牌资料粘贴在这里。AI 会读取学习，但只输出真人分享语气，不会照抄。"
              className="mac-textarea !min-h-[180px]"
            />
          </label>

          <div className="rounded-[18px] bg-[#F5F0E8] p-3 text-sm leading-6 text-[#1A1A1A]">
            聊天记录不会在正文生成时一起生成。请先确认并修改正文，再到“聊天生成”页按当前正文生成，避免浪费 token。
          </div>

          {error && <p className="rounded-2xl bg-[#F5D5D5] px-4 py-2 text-sm text-[#1A1A1A]">{error}</p>}

          <div className="flex flex-col gap-2">
            <button type="button" onClick={onGenerate} disabled={loading} className="mac-primary-btn w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  按文档生成
                </>
              )}
            </button>
            {result && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={loading}
                className="mac-secondary-btn w-full"
              >
                <RefreshCw className="h-4 w-4" />
                换一版（已换 {variation} 次）
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0">
          {!result && (
            <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border-2 border-dashed border-[#E8E4DE] bg-[#FAF7F2] p-8 text-center">
              <div>
                <FileText className="mx-auto mb-4 h-10 w-10 text-[#F0B8B8]" />
                <h2 className="text-lg font-black text-[#1A1A1A]">右侧会显示生成结果</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
                  默认仅生成标题、正文和标签；聊天记录请在确认正文后单独生成。
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <section className="mac-result-card">
                <header className="mac-result-header">
                  <span>🏷️ 标题</span>
                  <button type="button" onClick={() => onCopy(result.title)} className="mac-mini-btn">
                    <Copy className="h-3.5 w-3.5" /> 复制
                  </button>
                </header>
                <p className="mac-result-title">{result.title}</p>
              </section>

              <section className="mac-result-card">
                <header className="mac-result-header">
                  <span>📝 正文</span>
                  <button type="button" onClick={() => onCopy(result.post)} className="mac-mini-btn">
                    <Copy className="h-3.5 w-3.5" /> 复制
                  </button>
                </header>
                <p className="mac-result-post whitespace-pre-wrap">{result.post}</p>
              </section>

              <section className="mac-result-card">
                <header className="mac-result-header">
                  <span>🏷️ 标签</span>
                  <button type="button" onClick={() => onCopy(tagsText)} className="mac-mini-btn">
                    <Copy className="h-3.5 w-3.5" /> 复制
                  </button>
                </header>
                <p className="text-sm text-[#6B6B6B]">{tagsText}</p>
              </section>

              <button
                type="button"
                onClick={() => onCopy(fullPostText)}
                className="mac-primary-btn w-full"
              >
                <Copy className="h-4 w-4" />
                复制完整内容（标题 + 正文 + 标签）
              </button>
            </div>
          )}
        </main>
      </div>
    </motion.section>
  );
}

function MobileBottomNav({
  active,
  onTabChange,
  onHistory,
}: {
  active: AppTab;
  onTabChange: (tab: Exclude<AppTab, 'history'>) => void;
  onHistory: () => void;
}) {
  const items = [
    ...tabs,
    { key: 'history' as const, label: '历史', icon: History },
  ];
  return (
    <nav className="mac-mobile-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => (item.key === 'history' ? onHistory() : onTabChange(item.key))}
            className={active === item.key ? 'is-active' : ''}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function AppShell() {
  const [active, setActive] = useState<AppTab>('home');
  const [article, setArticle] = useState('');
  const [topic, setTopic] = useState('');
  const [comments, setComments] = useState('');
  const [country, setCountry] = useState<Country>('韩国');
  const [platform, setPlatform] = useState<Platform>('小红书');
  const [angles, setAngles] = useState<Angle[]>([]);
  const [selectedAngleId, setSelectedAngleId] = useState<number | null>(null);
  const [result, setResult] = useState<GenerationResult>(emptyResult);
  const [reviewReport, setReviewReport] = useState<ContentReviewReport | null>(null);
  const [suggestionPreview, setSuggestionPreview] = useState<SuggestionPreviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [factCheckStatuses, setFactCheckStatuses] = useState<Record<number, FactCheckStatus>>({});
  const [loading, setLoading] = useState<'analyze' | 'generate' | null>(null);
  const [polishingField, setPolishingField] = useState<'title' | 'post' | null>(null);
  const [titleRegenerating, setTitleRegenerating] = useState(false);
  const [revisingContent, setRevisingContent] = useState(false);
  const [polishChanges, setPolishChanges] = useState<string[]>([]);
  const [postHistory, setPostHistory] = useState<string[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [rowLoadingIndex, setRowLoadingIndex] = useState<number | null>(null);
  const [contentResearchQuestion, setContentResearchQuestion] = useState('');
  const [contentResearchResult, setContentResearchResult] = useState<GeneratedContentResearchResult | null>(null);
  const [contentResearchLoading, setContentResearchLoading] = useState(false);
  const [contentResearchError, setContentResearchError] = useState('');
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatScene, setChatScene] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [styleSkillOpen, setStyleSkillOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbContext, setKbContext] = useState('');
  const { prefs, contextString, saveManual, resetManual, resetAuto, learnFromGeneration, learnFromInstruction, learnFromPolish, replaceStore: replacePrefs } = usePreferences();
  const styleSkills = useStyleSkills();
  const chatSkills = useChatSkills();
  const guideSkills = useGuideSkills();
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const [themeDraft, setThemeDraft] = useState<ThemeSettings>(() => loadThemeSettings());
  const [config, setConfig] = useState(() => loadConfig());
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [appPassword, setAppPassword] = useState(() => loadAppPassword());

  // 云端同步状态
  const [cloudState, setCloudState] = useState<CloudState>('idle');
  const [cloudPulled, setCloudPulled] = useState(false);

  // Chat Lab (standalone chat-only workspace) state
  const [chatLabTitle, setChatLabTitle] = useState('');
  const [chatLabPost, setChatLabPost] = useState('');
  const [chatLabInstruction, setChatLabInstruction] = useState('');
  const [chatLabScene, setChatLabScene] = useState('');
  const [chatLabRows, setChatLabRows] = useState<ChatRow[]>([]);
  const [chatLabLoading, setChatLabLoading] = useState(false);
  const [chatLabRowLoadingIndex, setChatLabRowLoadingIndex] = useState<number | null>(null);
  const [chatLabError, setChatLabError] = useState('');

  // APP recommendation workspace state
  const [appTopic, setAppTopic] = useState('');
  const [appMaterial, setAppMaterial] = useState('');
  const [appResult, setAppResult] = useState<AppRecommendationResult | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appRevising, setAppRevising] = useState(false);
  const [appError, setAppError] = useState('');

  // Document-based generation state
  const [docDocument, setDocDocument] = useState('');
  const [docBriefing, setDocBriefing] = useState('');
  const [docResult, setDocResult] = useState<GenerationResult | null>(null);
  const [docVariation, setDocVariation] = useState(0);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  const history = useHistory();
  const [viralExamples, setViralExamples] = useState(() => loadViralLibrary());
  const saveViralLibrary = (value: string) => {
    try {
      localStorage.setItem(VIRAL_LIBRARY_KEY, value);
    } catch {
      // ignore
    }
    setViralExamples(value);
  };
  const combinedViralExamples = useMemo(
    () => [BUILT_IN_VIRAL_EXAMPLES.trim(), viralExamples.trim()].filter(Boolean).join('\n\n'),
    [viralExamples],
  );
  const selectedAngle = angles.find((angle) => angle.id === selectedAngleId) || null;
  const scene: Scene = active === 'topic' ? 'topic' : 'article';
  const hasResult = !!result.title || !!result.post || (result.chat && result.chat.length > 0);
  const stage: Stage = loading === 'generate' ? 'generating' : hasResult ? 'result' : angles.length > 0 ? 'angles' : 'empty';

  // ===================== 云端同步 =====================
  // 1) 启动时从云端拉取，覆盖本地（云端为准）
  const hasPulledRef = useRef(false);
  useEffect(() => {
    if (!isHostedRuntime() || !appPassword || hasPulledRef.current) return;
    hasPulledRef.current = true;
    (async () => {
      const result = await fetchCloudSkills();
      // 密码错误时由全局监听器清除密码并弹出输入框，这里不覆盖状态
      if (result.status === 'unauthorized') return;
      if (result.status === 'disabled') {
        setCloudState('disabled');
        return;
      }
      if (result.status === 'error') {
        setCloudState('error');
        return;
      }
      const cloud = result.data;
      if (cloud) {
        if (Array.isArray(cloud.styleSkills)) styleSkills.replaceStore(cloud.styleSkills);
        if (Array.isArray(cloud.guideSkills)) guideSkills.replaceStore(cloud.guideSkills);
        if (cloud.preferences) replacePrefs(cloud.preferences as any);
        if (typeof cloud.viralExamples === 'string') saveViralLibrary(cloud.viralExamples);
      }
      setCloudPulled(true);
      setCloudState('synced');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appPassword]);

  // 2) 本地数据变更时，防抖推送到云端（仅在初始拉取成功后）
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHostedRuntime() || !cloudPulled || !appPassword) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      setCloudState('syncing');
      const result = await pushCloudSkills({
        styleSkills: styleSkills.skills,
        guideSkills: guideSkills.skills,
        preferences: prefs,
        viralExamples,
      });
      setCloudState(
        result.status === 'ok' ? 'synced' : result.status === 'disabled' ? 'disabled' : 'error',
      );
    }, 1200);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleSkills.skills, guideSkills.skills, prefs, viralExamples, cloudPulled, appPassword]);

  // 密码失效（接口返回 401）时清除本地密码并重新弹出输入框，避免被错误密码锁死
  useEffect(() => {
    function handleAuthFailed() {
      clearAccessPassword();
    }
    window.addEventListener('app-auth-failed', handleAuthFailed);
    return () => window.removeEventListener('app-auth-failed', handleAuthFailed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearAccessPassword() {
    try {
      localStorage.removeItem(APP_PASSWORD_KEY);
    } catch {
      // 忽略本地存储失败
    }
    hasPulledRef.current = false;
    setCloudPulled(false);
    setCloudState('idle');
    setAppPassword('');
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2000);
  }

  function handleResetAccessPassword() {
    clearAccessPassword();
    setSettingsOpen(false);
    showToast('请重新输入访问密码');
  }

  async function handleUnlock(password: string): Promise<boolean> {
    // 云端环境下先校验密码，避免把错误密码存进本地后无法重新输入
    try {
      const res = await fetch('/api/skills', {
        method: 'GET',
        headers: { 'x-app-password': password },
      });
      if (res.status === 401) return false;
    } catch {
      // 网络异常时放行，避免完全无法进入应用
    }
    try {
      localStorage.setItem(APP_PASSWORD_KEY, password);
    } catch {
      // 忽略本地存储失败，仍允许本次会话继续使用
    }
    setAppPassword(password);
    showToast('访问密码已保存');
    return true;
  }

  function resetWork() {
    setAngles([]);
    setSelectedAngleId(null);
    setResult(emptyResult);
    setFactCheckStatuses({});
    setPolishChanges([]);
    setPostHistory([]);
    setContentResearchQuestion('');
    setContentResearchResult(null);
    setContentResearchError('');
    setError('');
  }

  function handleAddCustomAngle(angle: Angle) {
    setAngles((prev) => [...prev, angle]);
    setSelectedAngleId(angle.id);
    showToast('已加入你的自定义角度');
  }

  function handleTabChange(tab: Exclude<AppTab, 'history'>) {
    setActive(tab);
    if (tab === 'article' || tab === 'topic') resetWork();
  }

  async function handleAnalyze() {
    if (active !== 'article' && active !== 'topic') return;
    setError('');
    setResult(emptyResult);
    setFactCheckStatuses({});

    if (active === 'article' && !article.trim()) {
      setError('请先粘贴原文。');
      showToast('请先粘贴原文');
      return;
    }
    if (active === 'topic' && !topic.trim()) {
      setError('请先输入话题。');
      showToast('请先输入话题');
      return;
    }

    setLoading('analyze');
    try {
      const viralSkill = buildViralSkillContext(
        combinedViralExamples,
        active === 'article' ? article : topic,
      );
      const nextAngles =
        active === 'article'
          ? comments.trim()
            ? await analyzeArticleWithComments({ config, article, comments, country, platform, viralSkill, preferenceContext: buildFullContext('analyze') })
            : await analyzeArticle({ config, article, country, platform, viralSkill, preferenceContext: buildFullContext('analyze') })
          : await analyzeTopic({ config, topic, country, platform, viralSkill, preferenceContext: buildFullContext('analyze') });
      setAngles(nextAngles);
      setSelectedAngleId(nextAngles[0]?.id ?? null);
      if (nextAngles.length === 0) showToast('没有解析出可用角度');
    } catch (err) {
      const message = err instanceof Error ? err.message : '分析失败，请稍后重试。';
      setError(message);
      showToast(message);
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerate() {
    if (!selectedAngle) {
      showToast('请先选择一个角度');
      return;
    }
    if (active !== 'article' && active !== 'topic') return;

    setError('');
    setLoading('generate');
    try {
      const query =
        active === 'article'
          ? `${article}\n${selectedAngle.title}\n${selectedAngle.description}`
          : `${topic}\n${selectedAngle.title}\n${selectedAngle.description}`;
      const viralSkill = buildViralSkillContext(combinedViralExamples, query);
      const nextResult =
        active === 'article'
          ? await generateFromArticle({
              config,
              article,
              angle: selectedAngle,
              country,
              platform,
              viralSkill,
              preferenceContext: buildFullContext('generate'),
            })
          : await generateFromTopic({
              config,
              topic,
              angle: selectedAngle,
              country,
              platform,
              viralSkill,
              preferenceContext: buildFullContext('generate'),
            });
      setResult(nextResult);
      setFactCheckStatuses({});
      setPostHistory([]);
      setContentResearchResult(null);
      setContentResearchError('');
      // 自动触发内容审查
      const enabledGuides = guideSkills.skills.filter((s) => s.enabled);
      if (enabledGuides.length > 0) {
        setReviewLoading(true);
        reviewContentWithSkills({
          config,
          title: nextResult.title,
          post: nextResult.post,
          tags: nextResult.tags,
          platform,
          reviewSkills: enabledGuides,
          styleSkillName: styleSkills.activeSkill?.name,
        })
          .then((report) => setReviewReport(report))
          .catch(() => setReviewReport(null))
          .finally(() => setReviewLoading(false));
      } else {
        setReviewReport(null);
      }
      history.add({
        country,
        topic,
        article,
        platform,
        angle: selectedAngle.title,
        scene,
        title: nextResult.title,
        post: nextResult.post,
        tags: nextResult.tags,
        chat: nextResult.chat,
        factChecks: nextResult.factChecks,
      });
      showToast('已生成并自动保存');
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败，请稍后重试。';
      setError(message);
      showToast(message);
    } finally {
      setLoading(null);
    }
  }

  async function performReview(title: string, post: string, tags: string[]) {
    const enabledGuides = guideSkills.skills.filter((s) => s.enabled);
    if (enabledGuides.length === 0) {
      setReviewReport(null);
      return;
    }
    setReviewLoading(true);
    try {
      const report = await reviewContentWithSkills({
        config,
        title,
        post,
        tags,
        platform,
        reviewSkills: enabledGuides,
        styleSkillName: styleSkills.activeSkill?.name,
      });
      setReviewReport(report);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '审查失败');
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleReReview() {
    const enabledGuides = guideSkills.skills.filter((s) => s.enabled);
    if (enabledGuides.length === 0) {
      showToast('请先在方法论 SKILL 里启用至少一个审查标准');
      return;
    }
    await performReview(result.title, result.post, result.tags);
  }

  async function handleApplySuggestion(suggestion: string, skillName: string) {
    if (!result.post.trim()) {
      showToast('请先生成内容');
      return;
    }
    try {
      const next = await reviseGeneratedContent({
        config,
        mode: 'viral',
        title: result.title,
        post: result.post,
        tags: result.tags,
        instruction:
          `【质检建议 · ${skillName}】${suggestion}\n\n` +
          '只针对这一条建议做最小必要修改：其他段落、结构、语气和已有信息尽量保持不变，' +
          '不要顺带改写无关内容，不要明显改变正文长度。',
        country,
        platform,
        angle: selectedAngle?.title,
        sourceContext: active === 'article' ? article : topic,
        preferenceContext: buildFullContext('revise'),
      });
      setSuggestionPreview({
        suggestion,
        skillName,
        beforeTitle: result.title,
        beforePost: result.post,
        after: next,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : '按建议修改失败');
    }
  }

  function handleAcceptSuggestion() {
    if (!suggestionPreview) return;
    const { after } = suggestionPreview;
    rememberPostVersion(result.post);
    setResult((prev) => ({
      ...prev,
      title: after.title,
      post: after.post,
      tags: after.tags,
      factChecks: after.factChecks || prev.factChecks,
    }));
    if (after.factChecks) setFactCheckStatuses({});
    setPolishChanges(after.changes?.length ? after.changes : ['已按质检建议调整标题和正文。']);
    setSuggestionPreview(null);
    showToast('已采纳建议，正在重新质检');
    performReview(after.title, after.post, after.tags);
  }

  function handleCopy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('已复制 ✓');
  }

  function rememberPostVersion(currentPost: string) {
    if (!currentPost.trim()) return;
    setPostHistory((prev) => {
      if (prev[prev.length - 1] === currentPost) return prev;
      return [...prev, currentPost].slice(-20);
    });
  }

  function handlePostChange(value: string) {
    if (value === result.post) return;
    rememberPostVersion(result.post);
    setResult((prev) => ({ ...prev, post: value }));
  }

  function handleRestorePost() {
    setPostHistory((prev) => {
      const previous = prev[prev.length - 1];
      if (!previous) return prev;
      setResult((current) => ({ ...current, post: previous }));
      showToast('已恢复正文上一版');
      return prev.slice(0, -1);
    });
  }

  async function handleRegenerateTitle() {
    if (!result.post.trim()) {
      showToast('请先生成内容');
      return;
    }
    setTitleRegenerating(true);
    try {
      const { title } = await regenerateTitle({
        config,
        post: result.post,
        currentTitle: result.title,
        platform,
        preferenceContext: buildFullContext('title'),
      });
      setResult((prev) => ({ ...prev, title }));
      showToast('已重新生成标题');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '重新生成标题失败');
    } finally {
      setTitleRegenerating(false);
    }
  }

  async function handlePolishField(field: 'title' | 'post') {
    const original = result[field];
    if (!original.trim()) return;
    if (field === 'post') rememberPostVersion(original);
    setPolishingField(field);
    try {
      const { polished, changes } = await polishText({
        config,
        original,
        context:
          field === 'title'
            ? '标题：不是一味更短，而是精准抓住重点、文化差异冲突点或具体疑问；判断用户刷到会不会愿意点进来看'
            : '正文：尽可能简短、真人、少重复，保留核心发现和互动感；判断用户看完会不会愿意点赞或评论；保持 HelloTalk 自然提及',
        preferenceContext: buildFullContext('polish'),
      });
      setResult((prev) => ({ ...prev, [field]: polished }));
      setPolishChanges(changes.length ? changes : ['模型已优化表达，但未返回具体修改点。']);
      learnFromPolish(field);
      showToast(changes.length ? '已润色并生成修改点' : '已润色');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '润色失败');
    } finally {
      setPolishingField(null);
    }
  }

  async function handleReviseContent(instruction: string) {
    const value = instruction.trim();
    if (!value) {
      showToast('请先填写修改方向');
      return false;
    }
    if (!result.title.trim() && !result.post.trim()) {
      showToast('请先生成内容');
      return false;
    }
    setRevisingContent(true);
    try {
      const next = await reviseGeneratedContent({
        config,
        mode: 'viral',
        title: result.title,
        post: result.post,
        tags: result.tags,
        instruction: value,
        country,
        platform,
        angle: selectedAngle?.title,
        sourceContext: active === 'article' ? article : topic,
        preferenceContext: buildFullContext('revise'),
      });
      rememberPostVersion(result.post);
      learnFromInstruction(value);
      setResult((prev) => ({
        ...prev,
        title: next.title,
        post: next.post,
        tags: next.tags,
        factChecks: next.factChecks || prev.factChecks,
      }));
      if (next.factChecks) setFactCheckStatuses({});
      setPolishChanges(next.changes?.length ? next.changes : ['已按你的修改方向调整标题、正文和标签。']);
      showToast('已按修改方向生成新版本');
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : '按方向修改失败');
      return false;
    } finally {
      setRevisingContent(false);
    }
  }

  async function handleRegenerateChat(
    mode: 'fromPost' | 'continueFromEdited',
    instruction?: string,
    scene?: string,
  ) {
    if (!result.post.trim()) {
      showToast('请先生成或填写正文');
      return false;
    }
    setChatLoading(true);
    try {
      const nextChat = await regenerateChat({
        config,
        country,
        platform,
        title: result.title,
        post: result.post,
        angle: selectedAngle?.title,
        scene,
        currentChat: result.chat,
        instruction,
        mode,
        chatSkillContext: chatSkills.skillContext,
      });
      setResult((prev) => ({ ...prev, chat: nextChat }));
      showToast(mode === 'fromPost' ? '聊天记录已根据正文和建议重生成' : '聊天记录已按你的建议重写');
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : '聊天记录重生成失败');
      return false;
    } finally {
      setChatLoading(false);
    }
  }

  async function handleResearchGeneratedContent() {
    if (!result.title.trim() && !result.post.trim()) {
      showToast('请先生成或填写正文');
      return;
    }
    setContentResearchLoading(true);
    setContentResearchError('');
    try {
      const next = await researchGeneratedContent({
        config,
        title: result.title,
        post: result.post,
        country,
        platform,
        question: contentResearchQuestion,
      });
      setContentResearchResult(next);
      showToast('AI 内容检索已完成');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 内容检索失败';
      setContentResearchError(message);
      showToast(message);
    } finally {
      setContentResearchLoading(false);
    }
  }

  async function handleRegenerateChatRow(index: number, instruction?: string, scene?: string) {
    if (!result.post.trim()) {
      showToast('请先生成或填写正文');
      return false;
    }
    setRowLoadingIndex(index);
    try {
      const nextRow = await regenerateChatRow({
        config,
        country,
        platform,
        title: result.title,
        post: result.post,
        angle: selectedAngle?.title,
        scene,
        currentChat: result.chat,
        rowIndex: index,
        instruction,
        chatSkillContext: chatSkills.skillContext,
      });
      setResult((prev) => ({
        ...prev,
        chat: prev.chat.map((row, idx) => (idx === index ? nextRow : row)),
      }));
      showToast('已重生成这一行聊天');
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : '单行聊天重生成失败');
      return false;
    } finally {
      setRowLoadingIndex(null);
    }
  }

  async function handleChatLabGenerate(mode: 'fromPost' | 'continueFromEdited') {
    if (!chatLabPost.trim()) {
      setChatLabError('请先粘贴正文。');
      showToast('请先粘贴正文');
      return false;
    }
    setChatLabError('');
    setChatLabLoading(true);
    try {
      const nextChat = await regenerateChat({
        config,
        country,
        platform,
        title: chatLabTitle,
        post: chatLabPost,
        scene: chatLabScene,
        currentChat: chatLabRows,
        instruction: chatLabInstruction,
        mode,
        chatSkillContext: chatSkills.skillContext,
      });
      setChatLabRows(nextChat);
      showToast(mode === 'fromPost' ? '聊天记录已生成' : '聊天记录已按建议重写');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '聊天记录生成失败';
      setChatLabError(message);
      showToast(message);
      return false;
    } finally {
      setChatLabLoading(false);
    }
  }

  async function handleChatLabRegenerateRow(index: number) {
    if (!chatLabPost.trim()) {
      showToast('请先粘贴正文');
      return false;
    }
    setChatLabRowLoadingIndex(index);
    try {
      const nextRow = await regenerateChatRow({
        config,
        country,
        platform,
        title: chatLabTitle,
        post: chatLabPost,
        scene: chatLabScene,
        currentChat: chatLabRows,
        rowIndex: index,
        instruction: chatLabInstruction,
        chatSkillContext: chatSkills.skillContext,
      });
      setChatLabRows((prev) => prev.map((row, idx) => (idx === index ? nextRow : row)));
      showToast('已重生成这一行聊天');
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : '单行聊天重生成失败');
      return false;
    } finally {
      setChatLabRowLoadingIndex(null);
    }
  }

  async function handleGenerateAppRecommendation() {
    if (!appTopic.trim()) {
      setAppError('请先输入APP推荐主题。');
      showToast('请先输入APP推荐主题');
      return;
    }
    setAppError('');
    setAppLoading(true);
    try {
      const nextResult = await generateAppRecommendation({
        config,
        topic: appTopic,
        material: appMaterial,
        preferenceContext: buildFullContext('generate', 'app'),
      });
      setAppResult(nextResult);
      showToast('APP推荐贴已生成');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'APP推荐贴生成失败';
      setAppError(message);
      showToast(message);
    } finally {
      setAppLoading(false);
    }
  }

  async function handleReviseAppRecommendation(instruction: string) {
    const value = instruction.trim();
    if (!value) {
      showToast('请先填写修改方向');
      return false;
    }
    if (!appResult) {
      showToast('请先生成APP分享贴');
      return false;
    }
    setAppRevising(true);
    setAppError('');
    try {
      const next = await reviseGeneratedContent({
        config,
        mode: 'app',
        title: appResult.title,
        post: appResult.post,
        tags: appResult.tags,
        instruction: value,
        sourceContext: [appTopic, appMaterial ? `素材文档：\n${appMaterial}` : ''].filter(Boolean).join('\n\n'),
        preferenceContext: buildFullContext('revise', 'app'),
      });
      setAppResult({
        title: next.title,
        post: next.post,
        tags: next.tags,
        forbiddenHits: next.forbiddenHits,
      });
      showToast('APP分享贴已按方向修改');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'APP分享贴二次修改失败';
      setAppError(message);
      showToast(message);
      return false;
    } finally {
      setAppRevising(false);
    }
  }

  async function handleGenerateFromDocument(mode: 'first' | 'regenerate') {
    if (!docDocument.trim() && !docBriefing.trim()) {
      setDocError('请先上传/粘贴文档，或填写本次活动说明。');
      showToast('请先填写文档或活动说明');
      return;
    }
    setDocError('');
    setDocLoading(true);
    try {
      const variation = mode === 'regenerate' ? docVariation + 1 : 0;
      const nextResult = await generateFromDocument({
        config,
        document: docDocument,
        briefing: docBriefing,
        country,
        platform,
        includeChat: false,
        variation,
        viralSkill: buildViralSkillContext(combinedViralExamples, docBriefing || docDocument),
        preferenceContext: buildFullContext('generate'),
      });
      setDocResult(nextResult);
      setDocVariation(variation);
      showToast(mode === 'regenerate' ? '已为你换一版' : '已根据文档生成内容');
    } catch (err) {
      const message = err instanceof Error ? err.message : '按文档生成失败';
      setDocError(message);
      showToast(message);
    } finally {
      setDocLoading(false);
    }
  }

  function handleClearDocument() {
    setDocDocument('');
    setDocBriefing('');
    setDocResult(null);
    setDocVariation(0);
    setDocError('');
  }

  function handleSaveConfig(nextConfig: typeof config) {
    setConfig(nextConfig);
    saveConfig(nextConfig);
    showToast('配置已保存');
  }

  function handleDeleteHistory(record: HistoryRecord) {
    if (window.confirm('确定删除这条历史记录？')) {
      history.remove(record.id);
      showToast('已删除');
    }
  }

  function handleClearHistory() {
    if (window.confirm('确定删除全部历史？此操作不可恢复')) {
      history.clear();
      showToast('历史记录已清空');
    }
  }

  function handleRegenerate(record: HistoryRecord) {
    setActive(record.scene);
    setCountry(record.country);
    setPlatform(record.platform);
    setArticle(record.article);
    setTopic(record.topic);
    resetWork();
    setAutoAnalyze(true);
    showToast('已回到创作页，正在重新分析');
  }

  async function handleResearchSearch(target: string) {
    return researchTopic({ config, topic: target });
  }

  function handleUseResearchAngle(
    researchTopicValue: string,
    angleTitle: string,
    angleDescription: string,
  ) {
    setActive('topic');
    setTopic(researchTopicValue);
    setArticle('');
    const manualAngle: Angle = { id: 1, title: angleTitle, description: angleDescription };
    setAngles([manualAngle]);
    setSelectedAngleId(manualAngle.id);
    setResult(emptyResult);
    setFactCheckStatuses({});
    setError('');
    showToast('已切到话题创作，可直接生成');
  }

  function handleManualSave() {
    if (!selectedAngle || !hasResult) return;
    history.add({
      country,
      topic,
      article,
      platform,
      angle: selectedAngle.title,
      scene,
      title: result.title,
      post: result.post,
      tags: result.tags,
      chat: result.chat,
      factChecks: result.factChecks,
    });
    // 自动学习：记录生成 vs 最终保存的差异
    learnFromGeneration({
      country,
      platform,
      angleTitle: selectedAngle.title,
      generatedPost: result.post,
      finalPost: result.post,
      generatedTags: result.tags,
      finalTags: result.tags,
    });
    showToast('已保存到历史记录');
  }

  useEffect(() => {
    if (!autoAnalyze || (active !== 'article' && active !== 'topic')) return;
    setAutoAnalyze(false);
    window.setTimeout(() => handleAnalyze(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAnalyze, active]);

  useEffect(() => {
    applyThemeSettings(themeSettings);
  }, [themeSettings]);

  useEffect(() => {
    getEnabledKnowledgeContext().then((ctx) => {
      setKbContext(truncateKnowledgeContext(ctx));
    });
  }, [kbOpen]);

  function buildFullContext(stage?: GuideStage, module: 'article' | 'app' = 'article') {
    const parts: string[] = [];
    // 1. 风格 SKILL（最高优先级，callChatJson 会自动识别并前置）
    const moduleSkillContext = module === 'app' ? styleSkills.appSkillContext : styleSkills.skillContext;
    if (moduleSkillContext) {
      parts.push(moduleSkillContext);
    }
    // 2. 通用爆文方法论 SKILL（按当前环节自动筛选已启用的）
    const guideContext = guideSkills.buildContext(stage);
    if (guideContext) {
      parts.push(guideContext);
    }
    // 3. 用户偏好
    if (contextString) {
      parts.push(contextString);
    }
    // 4. 知识库
    if (kbContext) {
      parts.push(`\n【知识库背景】\n${kbContext}`);
    }
    return parts.join('\n\n');
  }

  function openThemeDrawer() {
    setThemeDraft(themeSettings);
    setThemeOpen(true);
  }

  function previewTheme(next: ThemeSettings) {
    setThemeDraft(next);
    applyThemeSettings(next);
  }

  function cancelThemeDrawer() {
    applyThemeSettings(themeSettings);
    setThemeDraft(themeSettings);
    setThemeOpen(false);
  }

  function saveThemeDrawer() {
    setThemeSettings(themeDraft);
    saveThemeSettings(themeDraft);
    applyThemeSettings(themeDraft);
    setThemeOpen(false);
    showToast('页面设计已保存');
  }

  return (
    <div className="mac-page-shell">
      <AnimatePresence>{toast && <Toast message={toast} />}</AnimatePresence>
      {isHostedRuntime() && !appPassword && <PasswordGate onUnlock={handleUnlock} />}
      <ChatModal
        open={chatModalOpen}
        rows={result.chat}
        loading={chatLoading}
        rowLoadingIndex={rowLoadingIndex}
        scene={chatScene}
        onSceneChange={setChatScene}
        onClose={() => setChatModalOpen(false)}
        onChange={(rows) => setResult((prev) => ({ ...prev, chat: rows }))}
        onCopy={handleCopy}
        onRegenerate={(instruction, scene) => handleRegenerateChat('fromPost', instruction, scene)}
        onContinue={(instruction, scene) => handleRegenerateChat('continueFromEdited', instruction, scene)}
        onRegenerateRow={handleRegenerateChatRow}
      />
      <ReviewSuggestionPreview
        data={suggestionPreview}
        onClose={() => setSuggestionPreview(null)}
        onApply={handleAcceptSuggestion}
      />
      <div className="mac-app-frame">
        <SideNav active={active} onTabChange={handleTabChange} onHistory={() => setActive('history')} />
        <main className="mac-main">
          <TopBar active={active} onTabChange={handleTabChange} onSettings={() => setSettingsOpen(true)} onTheme={openThemeDrawer} onPreferences={() => setPreferencesOpen(true)} onStyleSkill={() => setStyleSkillOpen(true)} onCover={() => setCoverOpen(true)} onKb={() => setKbOpen(true)} activeSkillName={[styleSkills.activeSkill?.name, styleSkills.appSkill ? `${styleSkills.appSkill.name}（APP）` : '', guideSkills.enabledCount ? `通用方法论×${guideSkills.enabledCount}` : ''].filter(Boolean).join(' + ') || undefined} cloudState={cloudState} />
          <SettingsDrawer
            open={settingsOpen}
            config={config}
            onClose={() => setSettingsOpen(false)}
            onSave={handleSaveConfig}
            showAccessPasswordReset={isHostedRuntime() && Boolean(appPassword)}
            onResetAccessPassword={handleResetAccessPassword}
          />
          <ThemeDrawer
            open={themeOpen}
            settings={themeDraft}
            onClose={cancelThemeDrawer}
            onChange={previewTheme}
            onReset={() => previewTheme(THEME_PRESETS.creamGreen.settings)}
            onSave={saveThemeDrawer}
          />
          <PreferencesDrawer
            open={preferencesOpen}
            prefs={prefs}
            onClose={() => setPreferencesOpen(false)}
            onSaveManual={saveManual}
            onResetManual={resetManual}
            onResetAuto={resetAuto}
          />
          <StyleSkillDrawer
            open={styleSkillOpen}
            skills={styleSkills.skills}
            activeSkillId={styleSkills.activeSkill?.id || null}
            chatSkills={chatSkills.skills}
            activeChatSkillId={chatSkills.activeSkill?.id || null}
            config={config}
            onClose={() => setStyleSkillOpen(false)}
            onActivate={styleSkills.activateSkill}
            onCreate={styleSkills.createSkill}
            onUpdate={styleSkills.updateSkill}
            onDelete={styleSkills.deleteSkill}
            onDuplicate={styleSkills.duplicateSkill}
            onDeactivate={styleSkills.deactivateSkill}
            onChatActivate={chatSkills.activateSkill}
            onChatCreate={chatSkills.createSkill}
            onChatUpdate={chatSkills.updateSkill}
            onChatDelete={chatSkills.deleteSkill}
            onChatDuplicate={chatSkills.duplicateSkill}
            onChatDeactivate={chatSkills.deactivateSkill}
            guideSkills={guideSkills.skills}
            onToggleGuide={guideSkills.toggleSkill}
            onSetAllGuide={guideSkills.setAllEnabled}
            onCreateGuide={guideSkills.createSkill}
            onUpdateGuide={guideSkills.updateSkill}
            onDeleteGuide={guideSkills.deleteSkill}
            onResetGuideBuiltIns={guideSkills.resetBuiltIns}
          />

          {coverOpen && (
            <div className="fixed inset-0 z-50 bg-[#FAF7F2]">
              <CoverGenerator
                initialTitle={result.title}
                onClose={() => setCoverOpen(false)}
              />
            </div>
          )}

          <KnowledgeBaseDrawer open={kbOpen} onClose={() => setKbOpen(false)} />

          {active === 'home' ? (
            <div className="mac-content-scroll">
              <HomePage onNavigate={(tab) => setActive(tab as AppTab)} />
            </div>
          ) : active === 'history' ? (
            <div className="mac-content-scroll">
              <div className="mac-card p-6">
                <HistoryPanel
                  records={history.records}
                  onDelete={handleDeleteHistory}
                  onClear={handleClearHistory}
                  onRegenerate={handleRegenerate}
                  onCopy={handleCopy}
                />
              </div>
            </div>
          ) : active === 'research' ? (
            <div className="mac-content-scroll">
              <div className="mac-card p-6">
                <ResearchView
                  onSearch={handleResearchSearch}
                  onUseAngle={handleUseResearchAngle}
                  onCopy={handleCopy}
                />
              </div>
            </div>
          ) : active === 'app' ? (
            <div className="mac-content-scroll">
              <AppRecommendationView
                topic={appTopic}
                material={appMaterial}
                result={appResult}
                loading={appLoading}
                revising={appRevising}
                error={appError}
                styleSkills={styleSkills.skills.map((s) => ({ id: s.id, name: s.name }))}
                appStyleSkillId={styleSkills.appSkill?.id || null}
                enabledGuideCount={guideSkills.skills.filter((s) => s.enabled).length}
                onSelectAppStyleSkill={(id) => styleSkills.setModuleSkill('app', id)}
                onTopicChange={(value) => {
                  setAppTopic(value);
                  setAppError('');
                }}
                onMaterialChange={(value) => {
                  setAppMaterial(value);
                  setAppError('');
                }}
                onResultChange={setAppResult}
                onGenerate={handleGenerateAppRecommendation}
                onRevise={handleReviseAppRecommendation}
                onClear={() => {
                  setAppTopic('');
                  setAppMaterial('');
                  setAppResult(null);
                  setAppError('');
                }}
                onCopy={handleCopy}
              />
            </div>
          ) : active === 'document' ? (
            <div className="mac-content-scroll">
              <DocumentGeneratorView
                document={docDocument}
                briefing={docBriefing}
                result={docResult}
                variation={docVariation}
                loading={docLoading}
                error={docError}
                country={country}
                platform={platform}
                onDocumentChange={(value) => {
                  setDocDocument(value);
                  setDocError('');
                }}
                onBriefingChange={(value) => {
                  setDocBriefing(value);
                  setDocError('');
                }}
                onCountryChange={setCountry}
                onPlatformChange={setPlatform}
                onGenerate={() => handleGenerateFromDocument('first')}
                onRegenerate={() => handleGenerateFromDocument('regenerate')}
                onClear={handleClearDocument}
                onCopy={handleCopy}
              />
            </div>
          ) : active === 'chat' ? (
            <div className="mac-content-scroll">
              <ChatLabView
                country={country}
                platform={platform}
                title={chatLabTitle}
                post={chatLabPost}
                rows={chatLabRows}
                loading={chatLabLoading}
                rowLoadingIndex={chatLabRowLoadingIndex}
                instruction={chatLabInstruction}
                scene={chatLabScene}
                error={chatLabError}
                onCountryChange={setCountry}
                onPlatformChange={setPlatform}
                onTitleChange={setChatLabTitle}
                onPostChange={setChatLabPost}
                onInstructionChange={setChatLabInstruction}
                onSceneChange={setChatLabScene}
                onClearPost={() => {
                  setChatLabTitle('');
                  setChatLabPost('');
                  setChatLabInstruction('');
                  setChatLabScene('');
                  setChatLabRows([]);
                  setChatLabError('');
                }}
                onChange={setChatLabRows}
                onCopy={handleCopy}
                onGenerate={() => handleChatLabGenerate('fromPost')}
                onContinue={() => handleChatLabGenerate('continueFromEdited')}
                onRegenerateRow={handleChatLabRegenerateRow}
              />
            </div>
          ) : (
            <div className="mac-workspace">
              <InputCard
                scene={scene}
                article={article}
                topic={topic}
                comments={comments}
                country={country}
                platform={platform}
                loading={loading}
                error={error}
                onArticleChange={(value) => {
                  setArticle(value);
                  resetWork();
                }}
                onTopicChange={(value) => {
                  setTopic(value);
                  resetWork();
                }}
                onCommentsChange={setComments}
                onCountryChange={(value) => {
                  setCountry(value);
                  resetWork();
                }}
                onPlatformChange={(value) => {
                  setPlatform(value);
                  resetWork();
                }}
                onAnalyze={handleAnalyze}
                onClear={() => {
                  if (scene === 'article') setArticle('');
                  else setTopic('');
                  resetWork();
                }}
              />
              <DynamicCard
                stage={stage}
                angles={angles}
                selectedAngleId={selectedAngleId}
                loading={loading}
                result={result}
                factCheckStatuses={factCheckStatuses}
                polishChanges={polishChanges}
                polishingField={polishingField}
                titleRegenerating={titleRegenerating}
                revisingContent={revisingContent}
                chatLoading={chatLoading}
                rowLoadingIndex={rowLoadingIndex}
                canRestorePost={postHistory.length > 0}
                contentResearchQuestion={contentResearchQuestion}
                contentResearchResult={contentResearchResult}
                contentResearchLoading={contentResearchLoading}
                contentResearchError={contentResearchError}
                styleSkillName={styleSkills.activeSkill?.name}
                chatSkillName={chatSkills.activeSkill?.name}
                enabledGuideSkills={guideSkills.skills.filter((s) => s.enabled)}
                reviewReport={reviewReport}
                reviewLoading={reviewLoading}
                onSelectAngle={setSelectedAngleId}
                onGenerate={handleGenerate}
                onAddCustomAngle={handleAddCustomAngle}
                onBack={() => {
                  setResult(emptyResult);
                  setFactCheckStatuses({});
                }}
                onCopy={handleCopy}
                onTitleChange={(value) => setResult((prev) => ({ ...prev, title: value }))}
                onPostChange={handlePostChange}
                onRestorePost={handleRestorePost}
                onChatChange={(rows) => setResult((prev) => ({ ...prev, chat: rows }))}
                onContentResearchQuestionChange={(value) => {
                  setContentResearchQuestion(value);
                  setContentResearchError('');
                }}
                onResearchContent={handleResearchGeneratedContent}
                onPolishField={handlePolishField}
                onRegenerateTitle={handleRegenerateTitle}
                onReviseContent={handleReviseContent}
                onRegenerateChat={(instruction) => handleRegenerateChat('fromPost', instruction)}
                onContinueChat={(instruction) => handleRegenerateChat('continueFromEdited', instruction)}
                onRegenerateChatRow={handleRegenerateChatRow}
                onMarkFactCheck={(index, status) =>
                  setFactCheckStatuses((prev) => ({ ...prev, [index]: status }))
                }
                onSave={handleManualSave}
                onOpenChatModal={() => setChatModalOpen(true)}
                onOpenCover={() => setCoverOpen(true)}
                onReReview={handleReReview}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav active={active} onTabChange={handleTabChange} onHistory={() => setActive('history')} />
    </div>
  );
}
