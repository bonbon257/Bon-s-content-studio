import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import type {
  Brief,
  ContentTemplate,
  Country,
  Platform,
  ReferenceDeconstruction,
  ReferenceMode,
  VerticalConfig,
} from '../types';
import { COUNTRIES, LANGUAGE_MAP } from '../llm';

const CREATE_PLATFORMS: Platform[] = ['小红书', '抖音', '公众号'];

export interface CreateStudioProps {
  brief: Brief;
  verticals: VerticalConfig[];
  platform: Platform;
  country: Country;
  templates: ContentTemplate[];
  deconstruction: ReferenceDeconstruction | null;
  deconstructing: boolean;
  loading: 'analyze' | 'generate' | null;
  error: string;
  // SKILL 调用状态：方法论 SKILL 始终参与，风格 SKILL 可开关
  useStyleSkill: boolean;
  styleSkillName?: string;
  guideSkillCount: number;
  onToggleUseStyleSkill: () => void;
  onBriefChange: (patch: Partial<Brief>) => void;
  onPlatformChange: (platform: Platform) => void;
  onCountryChange: (country: Country) => void;
  onDeconstruct: () => void;
  onSaveTemplate: () => void;
  onUseTemplate: (id: string) => void;
  onAddVertical: (vertical: Omit<VerticalConfig, 'builtIn'>) => void;
  onRemoveVertical: (id: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export function CreateStudio({
  brief,
  verticals,
  platform,
  country,
  templates,
  deconstruction,
  deconstructing,
  loading,
  error,
  useStyleSkill,
  styleSkillName,
  guideSkillCount,
  onToggleUseStyleSkill,
  onBriefChange,
  onPlatformChange,
  onCountryChange,
  onDeconstruct,
  onSaveTemplate,
  onUseTemplate,
  onAddVertical,
  onRemoveVertical,
  onAnalyze,
  onClear,
}: CreateStudioProps) {
  const vertical = verticals.find((item) => item.id === brief.vertical) || verticals[0];
  // 大入口 → 两个子入口：先选分支，再进入对应表单
  const [branchChosen, setBranchChosen] = useState(false);
  const [verticalFormOpen, setVerticalFormOpen] = useState(false);
  const [newVertical, setNewVertical] = useState({
    name: '',
    fields: '',
    angleStrategy: '',
    bodyGuidance: '',
    tagGuidance: '',
  });
  const [templateId, setTemplateId] = useState('');

  const references = brief.references;
  const filledReferences = references.filter((item) => item.trim());

  function chooseBranch(mode: 'idea' | 'reference') {
    onBriefChange({ entryMode: mode });
    setBranchChosen(true);
  }

  function updateReference(index: number, value: string) {
    const next = [...references];
    next[index] = value;
    onBriefChange({ references: next });
  }

  function addReference() {
    onBriefChange({ references: [...references, ''] });
  }

  function removeReference(index: number) {
    const next = references.filter((_, i) => i !== index);
    onBriefChange({ references: next.length > 0 ? next : [''] });
  }

  function saveCustomVertical() {
    const name = newVertical.name.trim();
    if (!name) return;
    const labels = newVertical.fields
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    const id = `custom-${Date.now()}`;
    onAddVertical({
      id,
      name,
      tagline: '自定义赛道',
      briefFields: labels.map((label, index) => ({
        key: `f${index + 1}`,
        label,
        placeholder: `例如：${label}的具体信息`,
      })),
      referenceModeDefault: 'structure-only',
      angleStrategy:
        newVertical.angleStrategy.trim() ||
        '围绕用户 idea 中的人群、场景和痛点找角度，优先具体、能引发情绪共鸣的方向。',
      bodyGuidance:
        newVertical.bodyGuidance.trim() ||
        '第一人称真实分享，给出具体细节和可验证信息，不写空泛形容词，不夸大。',
      tagGuidance: newVertical.tagGuidance.trim() || '6-10 个标签，包含具体品类/场景词。',
      reviewRubric: '检查信息是否具体可信、是否有真实细节、是否夸大或像广告通稿。',
      useCountryDimension: false,
    });
    onBriefChange({ vertical: id, fields: {} });
    setNewVertical({ name: '', fields: '', angleStrategy: '', bodyGuidance: '', tagGuidance: '' });
    setVerticalFormOpen(false);
  }

  // 大入口首屏：选择子入口
  if (!branchChosen) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mac-card mac-input-card"
      >
        <div>
          <p className="mac-kicker">Content studio</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1A1A]">通用图文生成</h1>
          <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
            面向小红书 / 抖音 / 公众号的通用图文创作入口。先选一个起点，再进入对应的创作流程。
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => chooseBranch('idea')}
            className="flex items-start gap-4 rounded-2xl border border-[#E8E4DE] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#1A1A1A]"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5E6D0]">
              <Lightbulb className="h-5 w-5 text-[#1A1A1A]" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-[#1A1A1A]">从 idea 开始</span>
              <span className="mt-1 block text-sm leading-6 text-[#6B6B6B]">
                我有一个想法或产品，帮我找选题方向、情绪钩子和标题正文。
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseBranch('reference')}
            className="flex items-start gap-4 rounded-2xl border border-[#E8E4DE] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#1A1A1A]"
          >
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D5E8F5]">
              <FileText className="h-5 w-5 text-[#1A1A1A]" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold text-[#1A1A1A]">从参考图文开始</span>
              <span className="mt-1 block text-sm leading-6 text-[#6B6B6B]">
                贴一篇别人的爆款，拆解写法，生成去重新文或可复用模板。
              </span>
            </span>
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-[#FAFAFA] p-4 text-xs leading-6 text-[#6B6B6B]">
          <p className="font-semibold text-[#1A1A1A]">已接入的 SKILL</p>
          <p className="mt-1">
            方法论 SKILL {guideSkillCount} 个参与选题与生成
            {styleSkillName ? `；风格 SKILL「${styleSkillName}」${useStyleSkill ? '已套用' : '未套用'}` : ''}
            。
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mac-card mac-input-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mac-kicker">通用图文生成</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1A1A]">
            {brief.entryMode === 'idea' ? '从 idea 开始' : '从参考图文开始'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
            {brief.entryMode === 'idea'
              ? '选平台和赛道，填一个 idea，先出选题方向，再生成可修改的标题和正文。'
              : '贴一篇参考爆款，先拆解写法，再基于拆解生成去重新文或存成模板。'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBranchChosen(false)}
          className="mac-clear-btn flex shrink-0 items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          切换入口
        </button>
      </div>

      {/* 赛道 */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="mac-label !mb-0">赛道</span>
          <button
            type="button"
            onClick={() => setVerticalFormOpen((prev) => !prev)}
            className="mac-clear-btn flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            自定义赛道
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {verticals.map((item) => (
            <span key={item.id} className="inline-flex items-center">
              <button
                type="button"
                onClick={() =>
                  onBriefChange({ vertical: item.id, fields: {}, referenceMode: item.referenceModeDefault })
                }
                className={`mac-platform-pill ${brief.vertical === item.id ? 'is-active' : ''}`}
              >
                {item.name}
              </button>
              {!item.builtIn && (
                <button
                  type="button"
                  title="删除该赛道"
                  onClick={() => {
                    onRemoveVertical(item.id);
                    if (brief.vertical === item.id) onBriefChange({ vertical: verticals[0].id, fields: {} });
                  }}
                  className="ml-1 text-[#B0B0B0] hover:text-[#D93025]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        {vertical?.tagline && <p className="mt-2 text-xs text-[#8A8A8A]">{vertical.tagline}</p>}
      </div>

      {verticalFormOpen && (
        <div className="mt-3 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-4">
          <p className="text-sm font-semibold text-[#1A1A1A]">新建自定义赛道</p>
          <div className="mt-3 grid gap-2">
            <input
              value={newVertical.name}
              onChange={(e) => setNewVertical((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="赛道名称，例如：母婴好物"
              className="mac-input"
            />
            <input
              value={newVertical.fields}
              onChange={(e) => setNewVertical((prev) => ({ ...prev, fields: e.target.value }))}
              placeholder="结构化字段，用逗号分隔，例如：品类,价格,使用场景"
              className="mac-input"
            />
            <textarea
              value={newVertical.angleStrategy}
              onChange={(e) => setNewVertical((prev) => ({ ...prev, angleStrategy: e.target.value }))}
              placeholder="角度规则（可选）：这个赛道从哪些方向找选题"
              className="mac-textarea !min-h-[70px]"
              rows={2}
            />
            <textarea
              value={newVertical.bodyGuidance}
              onChange={(e) => setNewVertical((prev) => ({ ...prev, bodyGuidance: e.target.value }))}
              placeholder="正文规则（可选）：这个赛道的正文该怎么写"
              className="mac-textarea !min-h-[70px]"
              rows={2}
            />
            <div className="flex gap-2">
              <button type="button" onClick={saveCustomVertical} className="mac-primary-btn flex-1">
                保存赛道
              </button>
              <button
                type="button"
                onClick={() => setVerticalFormOpen(false)}
                className="mac-clear-btn px-3"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 平台 + 国家 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <span className="mac-label">平台</span>
          <div className="flex flex-wrap gap-2">
            {CREATE_PLATFORMS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onPlatformChange(item)}
                className={`mac-platform-pill ${platform === item ? 'is-active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {vertical?.useCountryDimension && (
          <label>
            <span className="mac-label">国家</span>
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value as Country)}
              className="mac-select"
            >
              {COUNTRIES.map((item) => (
                <option key={item} value={item}>
                  {item} · {LANGUAGE_MAP[item]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* SKILL 调用状态 */}
      <div className="mt-4 rounded-2xl bg-[#FAFAFA] px-4 py-3 text-xs leading-6 text-[#6B6B6B]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>方法论 SKILL {guideSkillCount} 个参与选题、生成与评分</span>
          {styleSkillName && (
            <button
              type="button"
              onClick={onToggleUseStyleSkill}
              className={`mac-platform-pill !px-3 !py-1 !text-[11px] ${useStyleSkill ? 'is-active' : ''}`}
            >
              风格 SKILL：{styleSkillName}（{useStyleSkill ? '已套用' : '未套用'}）
            </button>
          )}
        </div>
      </div>

      {/* idea / 参考爆文 */}
      <div className="mt-5">
        {brief.entryMode === 'idea' ? (
          <label>
            <span className="mb-2 flex items-center justify-between">
              <span className="mac-label !mb-0">我的 idea</span>
              {brief.idea && (
                <button type="button" onClick={onClear} className="mac-clear-btn">
                  一键清空
                </button>
              )}
            </span>
            <textarea
              value={brief.idea}
              onChange={(e) => onBriefChange({ idea: e.target.value })}
              placeholder="例如：想种草一款通勤双肩包，主打久背不累、能装电脑，价格 300 左右"
              className="mac-textarea"
            />
          </label>
        ) : (
          <div>
            <span className="mb-2 flex items-center justify-between">
              <span className="mac-label !mb-0">参考爆文</span>
              <button type="button" onClick={addReference} className="mac-clear-btn flex items-center gap-1">
                <Plus className="h-3 w-3" />
                再加一篇
              </button>
            </span>
            <div className="grid gap-2">
              {references.map((reference, index) => (
                <div key={index} className="relative">
                  <textarea
                    value={reference}
                    onChange={(e) => updateReference(index, e.target.value)}
                    placeholder="粘贴一篇你觉得写得好的爆款内容（标题 + 正文）"
                    className="mac-textarea !min-h-[110px]"
                    rows={4}
                  />
                  {references.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReference(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-[#B0B0B0] hover:text-[#D93025]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onDeconstruct}
              disabled={deconstructing || filledReferences.length === 0}
              className="mac-primary-btn mt-3 w-full !bg-[#1A1A1A]"
            >
              {deconstructing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  拆解中...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  拆解这篇爆文
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 参考模式 */}
      {filledReferences.length > 0 && (
        <div className="mt-4">
          <span className="mac-label">参考样例怎么用</span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'structure-only' as ReferenceMode, label: '只学结构，不抄内容' },
              { key: 'rewrite-allowed' as ReferenceMode, label: '允许适度改写' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onBriefChange({ referenceMode: item.key })}
                className={`mac-platform-pill ${brief.referenceMode === item.key ? 'is-active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 赛道结构化字段 */}
      {vertical?.briefFields.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {vertical.briefFields.map((field) => (
            <label key={field.key} className={field.multiline ? 'sm:col-span-2' : ''}>
              <span className="mac-label">{field.label}</span>
              {field.multiline ? (
                <textarea
                  value={brief.fields[field.key] || ''}
                  onChange={(e) =>
                    onBriefChange({ fields: { ...brief.fields, [field.key]: e.target.value } })
                  }
                  placeholder={field.placeholder}
                  className="mac-textarea !min-h-[70px]"
                  rows={2}
                />
              ) : (
                <input
                  value={brief.fields[field.key] || ''}
                  onChange={(e) =>
                    onBriefChange({ fields: { ...brief.fields, [field.key]: e.target.value } })
                  }
                  placeholder={field.placeholder}
                  className="mac-input"
                />
              )}
            </label>
          ))}
        </div>
      )}

      {/* 我的补充想法 */}
      <label className="mt-4 block">
        <span className="mac-label">我的补充想法（可选）</span>
        <textarea
          value={brief.myNotes}
          onChange={(e) => onBriefChange({ myNotes: e.target.value })}
          placeholder="任何你想强调的：真实经历、不能踩的坑、必须提到的点、不想要的表达……"
          className="mac-textarea !min-h-[80px]"
          rows={3}
        />
      </label>

      {/* 拆解结果 */}
      {brief.entryMode === 'reference' && deconstruction && (
        <div className="mt-4 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1A1A1A]">爆文拆解</p>
            <div className="flex gap-2">
              <button type="button" onClick={onSaveTemplate} className="mac-clear-btn">
                存为模板
              </button>
            </div>
          </div>
          <dl className="mt-3 grid gap-2 text-xs leading-5 text-[#4A4A4A]">
            <div>
              <dt className="font-semibold text-[#1A1A1A]">标题公式</dt>
              <dd>{deconstruction.titleFormula}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#1A1A1A]">开头钩子</dt>
              <dd>{deconstruction.openingHook}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#1A1A1A]">结构骨架</dt>
              <dd>
                <ol className="list-decimal pl-4">
                  {deconstruction.structure.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ol>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[#1A1A1A]">情绪触发点</dt>
              <dd>{deconstruction.emotionalTriggers.join('、') || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#1A1A1A]">可复用模板</dt>
              <dd className="whitespace-pre-wrap">{deconstruction.reusableTemplate || '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#1A1A1A]">去重要点</dt>
              <dd>{deconstruction.dedupeTips.join('；') || '—'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* 已存模板 */}
      {brief.entryMode === 'reference' && templates.length > 0 && (
        <div className="mt-4">
          <span className="mac-label">使用已存模板</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mac-select w-full"
              >
                <option value="">选择模板…</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}（{template.platform}）
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            </div>
            <button
              type="button"
              disabled={!templateId}
              onClick={() => onUseTemplate(templateId)}
              className="mac-clear-btn px-3"
            >
              载入
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 rounded-2xl bg-[#F5D5D5] px-4 py-2 text-sm text-[#1A1A1A]">{error}</p>}

      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading !== null}
        className="mac-primary-btn mt-5 w-full"
      >
        {loading === 'analyze' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            分析中...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            分析选题方向
          </>
        )}
      </button>
    </motion.section>
  );
}
