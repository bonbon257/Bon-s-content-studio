import { Sparkles, Plus, X, Trash2, Copy, Check, Wand2, ChevronDown, ChevronUp, Save, BookMarked, Upload, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { StyleSkill, GuideSkill, GuideStage } from '../types';
import type { ExtractedStyleSkill } from '../llm';
import { extractStyleFromSamples } from '../llm';
import type { LlmConfig } from '../types';
import { GUIDE_STAGE_LABELS } from '../data/guideSkills';

type ViewMode = 'list' | 'create' | 'edit' | 'extract';
type GuideViewMode = 'list' | 'import' | 'edit';
type SkillTab = 'style' | 'guide';

const ALL_STAGES: GuideStage[] = ['analyze', 'generate', 'title', 'revise', 'polish'];

export function StyleSkillDrawer({
  open,
  skills,
  activeSkillId,
  config,
  onClose,
  onActivate,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  onDeactivate,
  guideSkills,
  onToggleGuide,
  onSetAllGuide,
  onCreateGuide,
  onUpdateGuide,
  onDeleteGuide,
  onResetGuideBuiltIns,
}: {
  open: boolean;
  skills: StyleSkill[];
  activeSkillId: string | null;
  config: LlmConfig;
  onClose: () => void;
  onActivate: (id: string) => void;
  onCreate: (data: Partial<StyleSkill> & { name: string }) => void;
  onUpdate: (id: string, data: Partial<StyleSkill>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDeactivate: () => void;
  guideSkills: GuideSkill[];
  onToggleGuide: (id: string) => void;
  onSetAllGuide: (enabled: boolean) => void;
  onCreateGuide: (data: { name: string; description?: string; content: string; appliesTo?: GuideStage[] }) => void;
  onUpdateGuide: (id: string, data: Partial<GuideSkill>) => void;
  onDeleteGuide: (id: string) => void;
  onResetGuideBuiltIns: () => void;
}) {
  const [tab, setTab] = useState<SkillTab>('style');
  const [view, setView] = useState<ViewMode>('list');
  const [editingSkill, setEditingSkill] = useState<StyleSkill | null>(null);
  const [extractText, setExtractText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [guideView, setGuideView] = useState<GuideViewMode>('list');
  const [editingGuide, setEditingGuide] = useState<GuideSkill | null>(null);
  const [guideImportText, setGuideImportText] = useState('');
  const [guideImportError, setGuideImportError] = useState('');

  if (!open) return null;

  function handleBack() {
    setView('list');
    setEditingSkill(null);
    setExtractText('');
    setExtractError('');
  }

  function handleGuideBack() {
    setGuideView('list');
    setEditingGuide(null);
    setGuideImportText('');
    setGuideImportError('');
  }

  function handleImportGuide() {
    const raw = guideImportText.trim();
    if (!raw) {
      setGuideImportError('请粘贴 SKILL.md 内容');
      return;
    }
    // 解析可选的 frontmatter（--- name/description ---）
    const frontmatter = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    let name = '';
    let description = '';
    let content = raw;
    if (frontmatter) {
      name = (frontmatter[1].match(/^name:\s*(.+)$/m)?.[1] || '').trim();
      description = (frontmatter[1].match(/^description:\s*(.+)$/m)?.[1] || '').trim();
      content = raw.slice(frontmatter[0].length).trim();
    }
    if (!name) {
      const firstLine = content.split('\n').find((line) => line.trim());
      name = (firstLine || '导入的方法论').replace(/^#+\s*/, '').trim().slice(0, 30) || '导入的方法论';
    }
    onCreateGuide({ name, description, content });
    handleGuideBack();
  }

  async function handleExtract() {
    const samples = extractText
      .split(/\n---\n|#{1,6}\s*样本|\n\n(?=【)/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    if (samples.length < 1) {
      setExtractError('请至少粘贴 1 篇爆文样本');
      return;
    }

    setExtracting(true);
    setExtractError('');

    try {
      const result = await extractStyleFromSamples({
        config,
        samples,
      });
      setEditingSkill({
        id: '',
        name: result.name,
        description: result.description,
        styleRules: result.styleRules,
        titlePattern: result.titlePattern,
        openingPattern: result.openingPattern,
        structurePattern: result.structurePattern,
        toneStyle: result.toneStyle,
        endingPattern: result.endingPattern,
        requiredTags: result.requiredTags,
        forbiddenTags: result.forbiddenTags,
        targetLength: result.targetLength,
        samples,
        globalInstruction: result.globalInstruction,
        friendPersona: result.friendPersona,
        active: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setView('create');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : '提炼失败');
    } finally {
      setExtracting(false);
    }
  }

  function handleSaveNewSkill() {
    if (!editingSkill) return;
    onCreate({
      name: editingSkill.name,
      description: editingSkill.description,
      styleRules: editingSkill.styleRules,
      titlePattern: editingSkill.titlePattern,
      openingPattern: editingSkill.openingPattern,
      structurePattern: editingSkill.structurePattern,
      toneStyle: editingSkill.toneStyle,
      endingPattern: editingSkill.endingPattern,
      requiredTags: editingSkill.requiredTags,
      forbiddenTags: editingSkill.forbiddenTags,
      targetLength: editingSkill.targetLength,
      samples: editingSkill.samples,
      globalInstruction: editingSkill.globalInstruction,
      friendPersona: editingSkill.friendPersona,
    });
    handleBack();
  }

  function handleUpdateSkill() {
    if (!editingSkill) return;
    onUpdate(editingSkill.id, {
      name: editingSkill.name,
      description: editingSkill.description,
      styleRules: editingSkill.styleRules,
      titlePattern: editingSkill.titlePattern,
      openingPattern: editingSkill.openingPattern,
      structurePattern: editingSkill.structurePattern,
      toneStyle: editingSkill.toneStyle,
      endingPattern: editingSkill.endingPattern,
      requiredTags: editingSkill.requiredTags,
      forbiddenTags: editingSkill.forbiddenTags,
      targetLength: editingSkill.targetLength,
      samples: editingSkill.samples,
      globalInstruction: editingSkill.globalInstruction,
      friendPersona: editingSkill.friendPersona,
    });
    onActivate(editingSkill.id);
    handleBack();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 transition-opacity" onClick={handleBack} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[#E8E4DE] bg-[#FAF7F2] shadow-xl"
        style={{ animation: 'slideInRight 0.2s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-3 pt-6">
          <div className="flex items-center gap-2">
            {tab === 'guide' ? (
              <BookMarked className="h-5 w-5 text-[#FF9F43]" />
            ) : (
              <Sparkles className="h-5 w-5 text-[#FF9F43]" />
            )}
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {tab === 'guide'
                ? guideView === 'list'
                  ? '通用爆文方法论'
                  : guideView === 'import'
                    ? '导入方法论'
                    : '编辑方法论'
                : (
                  <>
                    {view === 'list' && '风格 SKILL'}
                    {view === 'create' && '创建 SKILL'}
                    {view === 'edit' && '编辑 SKILL'}
                    {view === 'extract' && '从爆文提炼'}
                  </>
                )}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="mac-icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 border-b border-[#E8E4DE] px-6">
          <button
            type="button"
            onClick={() => {
              setTab('style');
              handleBack();
            }}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'style' ? 'bg-[#FFF7ED] text-[#FF9F43]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            我的风格 SKILL
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('guide');
              handleGuideBack();
            }}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === 'guide' ? 'bg-[#FFF7ED] text-[#FF9F43]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            通用方法论（{guideSkills.filter((s) => s.enabled).length}/{guideSkills.length}）
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'style' && (
            <>
          {view === 'list' && (
            <SkillListView
              skills={skills}
              activeSkillId={activeSkillId}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
              onEdit={(skill) => {
                setEditingSkill(skill);
                setView('edit');
              }}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onCreateManual={() => {
                setEditingSkill({
                  id: '',
                  name: '',
                  description: '',
                  styleRules: '',
                  titlePattern: '',
                  openingPattern: '',
                  structurePattern: '',
                  toneStyle: '',
                  endingPattern: '',
                  requiredTags: [],
                  forbiddenTags: [],
                  targetLength: 150,
                  samples: [],
                  globalInstruction: '',
                  friendPersona: '',
                  active: false,
                  createdAt: '',
                  updatedAt: '',
                });
                setView('create');
              }}
              onExtract={() => setView('extract')}
            />
          )}

          {(view === 'create' || view === 'edit') && editingSkill && (
            <SkillEditor
              skill={editingSkill}
              isNew={view === 'create'}
              onChange={(updates) =>
                setEditingSkill((prev) => (prev ? { ...prev, ...updates } : prev))
              }
              onSave={view === 'create' ? handleSaveNewSkill : handleUpdateSkill}
              onCancel={handleBack}
            />
          )}

          {view === 'extract' && (
            <ExtractView
              extractText={extractText}
              setExtractText={setExtractText}
              extracting={extracting}
              error={extractError}
              onExtract={handleExtract}
              onCancel={handleBack}
            />
          )}
            </>
          )}

          {tab === 'guide' && guideView === 'list' && (
            <GuideListView
              guides={guideSkills}
              onToggle={onToggleGuide}
              onSetAll={onSetAllGuide}
              onImport={() => setGuideView('import')}
              onResetBuiltIns={onResetGuideBuiltIns}
              onEdit={(guide) => {
                setEditingGuide(guide);
                setGuideView('edit');
              }}
              onDelete={onDeleteGuide}
            />
          )}

          {tab === 'guide' && guideView === 'import' && (
            <GuideImportView
              text={guideImportText}
              setText={setGuideImportText}
              error={guideImportError}
              onImport={handleImportGuide}
              onCancel={handleGuideBack}
            />
          )}

          {tab === 'guide' && guideView === 'edit' && editingGuide && (
            <GuideEditor
              guide={editingGuide}
              onUpdate={(updates) =>
                setEditingGuide((prev) => (prev ? { ...prev, ...updates } : prev))
              }
              onSave={() => {
                onUpdateGuide(editingGuide.id, {
                  name: editingGuide.name,
                  description: editingGuide.description,
                  content: editingGuide.content,
                  appliesTo: editingGuide.appliesTo,
                });
                handleGuideBack();
              }}
              onCancel={handleGuideBack}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

// ==================== SKILL 列表 ====================

function SkillListView({
  skills,
  activeSkillId,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateManual,
  onExtract,
}: {
  skills: StyleSkill[];
  activeSkillId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
  onEdit: (skill: StyleSkill) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCreateManual: () => void;
  onExtract: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* 创建按钮区 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onExtract}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-[#FF9F43]/40 bg-[#FF9F43]/5 p-4 text-sm font-semibold text-[#FF9F43] transition hover:bg-[#FF9F43]/10"
        >
          <Wand2 className="h-5 w-5" />
          从爆文提炼
        </button>
        <button
          type="button"
          onClick={onCreateManual}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-[#E8E4DE] bg-white/50 p-4 text-sm font-semibold text-[#6B6B6B] transition hover:bg-white"
        >
          <Plus className="h-5 w-5" />
          手动创建
        </button>
      </div>

      {/* 当前激活状态 */}
      {activeSkillId && (
        <div className="rounded-2xl border border-[#FF9F43]/30 bg-[#FFF7ED] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF9F43]" />
              <span className="text-sm font-bold text-[#1A1A1A]">当前激活</span>
            </div>
            <button
              type="button"
              onClick={onDeactivate}
              className="text-xs text-[#FF9F43] hover:underline"
            >
              停用
            </button>
          </div>
          <p className="text-sm text-[#6B6B6B]">
            {skills.find((s) => s.id === activeSkillId)?.name || '未知'}
          </p>
        </div>
      )}

      {/* SKILL 列表 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1A1A1A]">我的 SKILL（{skills.length}）</h3>
        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E8E4DE] bg-white/50 py-8 text-center">
            <p className="text-sm text-[#6B6B6B]">还没有风格 SKILL</p>
            <p className="mt-1 text-xs text-[#B8B5CC]">
              从爆文提炼或手动创建，生成的内容会严格遵循你的风格
            </p>
          </div>
        ) : (
          skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isActive={skill.id === activeSkillId}
              onActivate={() => onActivate(skill.id)}
              onEdit={() => onEdit(skill)}
              onDelete={() => onDelete(skill.id)}
              onDuplicate={() => onDuplicate(skill.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SkillCard({
  skill,
  isActive,
  onActivate,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  skill: StyleSkill;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        isActive
          ? 'border-[#FF9F43]/40 bg-[#FFF7ED]'
          : 'border-[#E8E4DE] bg-white hover:border-[#FF9F43]/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[#1A1A1A]">{skill.name}</h4>
            {isActive && (
              <span className="rounded-full bg-[#FF9F43]/20 px-2 py-0.5 text-xs font-semibold text-[#FF9F43]">
                使用中
              </span>
            )}
          </div>
          {skill.description && (
            <p className="mt-1 text-xs text-[#6B6B6B]">{skill.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {skill.targetLength && (
              <span className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-[10px] text-[#6B6B6B]">
                {skill.targetLength}字
              </span>
            )}
            {skill.requiredTags.length > 0 && (
              <span className="rounded-full bg-[#C9EBCA]/50 px-2 py-0.5 text-[10px] text-[#2D7A3A]">
                {skill.requiredTags.length}个必带标签
              </span>
            )}
            {skill.samples.length > 0 && (
              <span className="rounded-full bg-[#FFE4C4]/50 px-2 py-0.5 text-[10px] text-[#B86B00]">
                {skill.samples.length}篇样本
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onActivate}
          className={`rounded-lg p-2 transition ${
            isActive
              ? 'bg-[#FF9F43] text-white'
              : 'bg-[#F5F0E8] text-[#6B6B6B] hover:bg-[#FF9F43]/20 hover:text-[#FF9F43]'
          }`}
          title={isActive ? '已激活' : '激活此 SKILL'}
        >
          <Check className="h-4 w-4" />
        </button>
      </div>

      {/* 展开详情 */}
      <div className="mt-3 border-t border-[#E8E4DE]/50 pt-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-xs text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          <span>{expanded ? '收起详情' : '查看详情'}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 text-xs">
            {skill.titlePattern && (
              <div>
                <span className="font-semibold text-[#1A1A1A]">标题：</span>
                <span className="text-[#6B6B6B]">{skill.titlePattern}</span>
              </div>
            )}
            {skill.toneStyle && (
              <div>
                <span className="font-semibold text-[#1A1A1A]">语气：</span>
                <span className="text-[#6B6B6B]">{skill.toneStyle}</span>
              </div>
            )}
            {skill.structurePattern && (
              <div>
                <span className="font-semibold text-[#1A1A1A]">结构：</span>
                <span className="text-[#6B6B6B]">{skill.structurePattern}</span>
              </div>
            )}
            {skill.styleRules && (
              <div>
                <span className="font-semibold text-[#1A1A1A]">核心规则：</span>
                <p className="mt-1 whitespace-pre-wrap text-[#6B6B6B]">{skill.styleRules}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onActivate}
          disabled={isActive}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
            isActive
              ? 'cursor-default bg-[#FF9F43]/15 text-[#FF9F43]'
              : 'bg-[#FF9F43] text-white hover:bg-[#FF9F43]/90'
          }`}
        >
          {isActive ? '使用中' : '应用'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-[#F5F0E8] px-3 py-1.5 text-xs font-medium text-[#6B6B6B] transition hover:bg-[#EDE6D8]"
        >
          编辑
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-lg bg-[#F5F0E8] p-1.5 text-[#6B6B6B] transition hover:bg-[#EDE6D8]"
          title="复制"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-red-50 p-1.5 text-red-400 transition hover:bg-red-100"
          title="删除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ==================== SKILL 编辑器 ====================

function SkillEditor({
  skill,
  isNew,
  onChange,
  onSave,
  onCancel,
}: {
  skill: StyleSkill;
  isNew: boolean;
  onChange: (updates: Partial<StyleSkill>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [newReqTag, setNewReqTag] = useState('');
  const [newForbTag, setNewForbTag] = useState('');

  function addTag(type: 'required' | 'forbidden') {
    const tag = type === 'required' ? newReqTag.trim() : newForbTag.trim();
    if (!tag) return;
    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    const current = type === 'required' ? skill.requiredTags : skill.forbiddenTags;
    if (!current.includes(normalized)) {
      onChange({
        [type === 'required' ? 'requiredTags' : 'forbiddenTags']: [...current, normalized],
      });
    }
    if (type === 'required') setNewReqTag('');
    else setNewForbTag('');
  }

  function removeTag(type: 'required' | 'forbidden', index: number) {
    const current = type === 'required' ? skill.requiredTags : skill.forbiddenTags;
    onChange({
      [type === 'required' ? 'requiredTags' : 'forbiddenTags']: current.filter(
        (_, i) => i !== index,
      ),
    });
  }

  const canSave = skill.name.trim().length > 0;

  return (
    <div className="space-y-5">
      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">SKILL 名称</label>
        <input
          value={skill.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="例如：反常识提问风"
          className="mac-input"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">一句话描述</label>
        <input
          value={skill.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="这个风格的核心特征"
          className="mac-input"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
          目标字数：{skill.targetLength} 字
        </label>
        <input
          type="range"
          min={80}
          max={300}
          step={10}
          value={skill.targetLength}
          onChange={(e) => onChange({ targetLength: Number(e.target.value) })}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-[#6B6B6B]">
          <span>80字</span>
          <span>150字</span>
          <span>300字</span>
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">标题模式</label>
        <textarea
          value={skill.titlePattern}
          onChange={(e) => onChange({ titlePattern: e.target.value })}
          rows={2}
          placeholder="例如：用'为什么...？'句式，长度 15-20 字，抛出反常识疑问"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">开头模式</label>
        <textarea
          value={skill.openingPattern}
          onChange={(e) => onChange({ openingPattern: e.target.value })}
          rows={2}
          placeholder="例如：先描述一个普遍现象，然后用反问句引出话题"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">正文结构</label>
        <textarea
          value={skill.structurePattern}
          onChange={(e) => onChange({ structurePattern: e.target.value })}
          rows={2}
          placeholder="例如：三段式 —— 第一段抛出现象/疑问，第二段引入外国朋友的观点，第三段总结提问"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">语气风格</label>
        <textarea
          value={skill.toneStyle}
          onChange={(e) => onChange({ toneStyle: e.target.value })}
          rows={2}
          placeholder="例如：口语化、像跟朋友聊天、带点吐槽感、句子短、少用成语"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">结尾模式</label>
        <textarea
          value={skill.endingPattern}
          onChange={(e) => onChange({ endingPattern: e.target.value })}
          rows={2}
          placeholder="例如：以开放式问题结尾，引导评论区讨论"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">核心风格规则</label>
        <textarea
          value={skill.styleRules}
          onChange={(e) => onChange({ styleRules: e.target.value })}
          rows={3}
          placeholder="3-5 条最关键的写作要求，每条具体可执行。这是最高优先级规则。"
          className="mac-textarea !min-h-[80px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">必带标签</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {skill.requiredTags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-[#C9EBCA] px-3 py-1 text-xs font-semibold text-[#1A1A1A]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag('required', i)}
                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newReqTag}
            onChange={(e) => setNewReqTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag('required')}
            placeholder="输入标签，按回车添加"
            className="mac-input flex-1"
          />
          <button type="button" onClick={() => addTag('required')} className="mac-mini-btn">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">禁用标签</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {skill.forbiddenTags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-[#F5D5D5] px-3 py-1 text-xs font-semibold text-[#1A1A1A]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag('forbidden', i)}
                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newForbTag}
            onChange={(e) => setNewForbTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag('forbidden')}
            placeholder="输入标签，按回车添加"
            className="mac-input flex-1"
          />
          <button type="button" onClick={() => addTag('forbidden')} className="mac-mini-btn">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">外国朋友人设</label>
        <textarea
          value={skill.friendPersona}
          onChange={(e) => onChange({ friendPersona: e.target.value })}
          rows={2}
          placeholder="例如：美国女生，性格开朗，喜欢吐槽，说话直接"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">全局附加指令</label>
        <textarea
          value={skill.globalInstruction}
          onChange={(e) => onChange({ globalInstruction: e.target.value })}
          rows={3}
          placeholder="任何时候都要遵守的铁律。例如：不要用问句结尾；不要出现「说实话」「其实」"
          className="mac-textarea !min-h-[80px]"
        />
      </section>

      {skill.samples.length > 0 && (
        <section>
          <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
            参考样本（{skill.samples.length}篇）
          </label>
          <div className="space-y-2">
            {skill.samples.map((s, i) => (
              <div key={i} className="rounded-xl bg-white p-3 text-xs text-[#6B6B6B]">
                <p className="mb-1 font-semibold text-[#1A1A1A]">样本 {i + 1}</p>
                <p className="line-clamp-3 whitespace-pre-wrap">{s.slice(0, 100)}...</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className="mac-secondary-btn">
          取消
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="mac-primary-btn disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isNew ? '创建 SKILL' : '保存并应用'}
        </button>
      </div>
    </div>
  );
}

// ==================== 从爆文提炼 ====================

function ExtractView({
  extractText,
  setExtractText,
  extracting,
  error,
  onExtract,
  onCancel,
}: {
  extractText: string;
  setExtractText: (v: string) => void;
  extracting: boolean;
  error: string;
  onExtract: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#FF9F43]/20 bg-[#FFF7ED] p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
          <Wand2 className="h-4 w-4 text-[#FF9F43]" />
          如何使用
        </h3>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#6B6B6B]">
          <li>粘贴 2-5 篇你认为效果最好的爆文</li>
          <li>每篇之间用 <code className="rounded bg-white px-1 py-0.5">---</code> 分隔</li>
          <li>AI 会自动分析共同风格，生成可复用的 SKILL</li>
          <li>提炼后你可以手动调整再保存</li>
        </ol>
      </div>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">粘贴爆文样本</label>
        <textarea
          value={extractText}
          onChange={(e) => setExtractText(e.target.value)}
          rows={12}
          placeholder={`第一篇爆文标题和正文...\n\n---\n\n第二篇爆文标题和正文...\n\n---\n\n第三篇...`}
          className="mac-textarea !min-h-[240px] !font-mono !text-xs"
        />
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className="mac-secondary-btn">
          取消
        </button>
        <button
          type="button"
          onClick={onExtract}
          disabled={extracting || !extractText.trim()}
          className="mac-primary-btn disabled:opacity-50"
        >
          {extracting ? (
            <>
              <span className="animate-spin">⏳</span>
              提炼中...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              开始提炼
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ==================== 通用方法论：列表 ====================

function GuideListView({
  guides,
  onToggle,
  onSetAll,
  onImport,
  onResetBuiltIns,
  onEdit,
  onDelete,
}: {
  guides: GuideSkill[];
  onToggle: (id: string) => void;
  onSetAll: (enabled: boolean) => void;
  onImport: () => void;
  onResetBuiltIns: () => void;
  onEdit: (guide: GuideSkill) => void;
  onDelete: (id: string) => void;
}) {
  const enabledCount = guides.filter((g) => g.enabled).length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#FF9F43]/20 bg-[#FFF7ED] p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
          <BookMarked className="h-4 w-4 text-[#FF9F43]" />
          通用爆文方法论
        </h3>
        <p className="text-xs leading-relaxed text-[#6B6B6B]">
          来自插件市场「小红书内容创作技能包」的通用方法论，可
          <span className="font-semibold text-[#1A1A1A]">同时启用多个</span>
          。系统会按当前环节（选题 / 生成正文 / 生成标题 / 改写 / 润色）自动挑选相关的启用项注入，避免无关内容干扰。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onImport} className="mac-secondary-btn !py-2 text-xs">
          <Upload className="h-3.5 w-3.5" />
          导入 SKILL.md / 粘贴文本
        </button>
        <button type="button" onClick={() => onSetAll(true)} className="mac-secondary-btn !py-2 text-xs">
          全部启用
        </button>
        <button type="button" onClick={() => onSetAll(false)} className="mac-secondary-btn !py-2 text-xs">
          全部停用
        </button>
        <button
          type="button"
          onClick={onResetBuiltIns}
          className="mac-secondary-btn !py-2 text-xs"
          title="用内置版本覆盖被修改过的内置方法论"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          恢复内置
        </button>
      </div>

      <p className="text-xs text-[#6B6B6B]">
        已启用 {enabledCount} / {guides.length} 个
      </p>

      <div className="space-y-3">
        {guides.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function GuideCard({
  guide,
  onToggle,
  onEdit,
  onDelete,
}: {
  guide: GuideSkill;
  onToggle: (id: string) => void;
  onEdit: (guide: GuideSkill) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition ${
        guide.enabled ? 'border-[#FF9F43]/40' : 'border-[#E8E4DE]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-[#1A1A1A]">{guide.name}</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                guide.builtIn ? 'bg-[#FFF7ED] text-[#FF9F43]' : 'bg-[#F2F0EC] text-[#6B6B6B]'
              }`}
            >
              {guide.builtIn ? '内置' : '自定义'}
            </span>
          </div>
          {guide.description && (
            <p className="mt-1 text-xs leading-relaxed text-[#6B6B6B]">{guide.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {guide.appliesTo.map((stage) => (
              <span key={stage} className="rounded-full bg-[#F2F0EC] px-2 py-0.5 text-[10px] text-[#6B6B6B]">
                {GUIDE_STAGE_LABELS[stage]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => onToggle(guide.id)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              guide.enabled ? 'bg-[#FF9F43]' : 'bg-[#D9D4CC]'
            }`}
            title={guide.enabled ? '点击停用' : '点击启用'}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                guide.enabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
          <span
            className={`text-[10px] font-semibold ${
              guide.enabled ? 'text-[#FF9F43]' : 'text-[#6B6B6B]'
            }`}
          >
            {guide.enabled ? '已应用' : '未应用'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-[#F2F0EC] pt-2 text-xs">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? '收起内容' : '查看内容'}
        </button>
        <button type="button" onClick={() => onEdit(guide)} className="text-[#6B6B6B] hover:text-[#1A1A1A]">
          编辑
        </button>
        {!guide.builtIn && (
          <button
            type="button"
            onClick={() => onDelete(guide.id)}
            className="ml-auto flex items-center gap-1 text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        )}
      </div>

      {expanded && (
        <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#FAF7F2] p-3 text-[11px] leading-relaxed text-[#4A4A4A]">
          {guide.content}
        </pre>
      )}
    </div>
  );
}

// ==================== 通用方法论：导入 ====================

function GuideImportView({
  text,
  setText,
  error,
  onImport,
  onCancel,
}: {
  text: string;
  setText: (v: string) => void;
  error: string;
  onImport: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#FF9F43]/20 bg-[#FFF7ED] p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
          <Upload className="h-4 w-4 text-[#FF9F43]" />
          如何使用
        </h3>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#6B6B6B]">
          <li>把任意 skill 的 SKILL.md 内容整段粘贴到下面</li>
          <li>带 YAML frontmatter（<code className="rounded bg-white px-1 py-0.5">--- name / description ---</code>）会自动识别名称与说明</li>
          <li>也可以直接粘贴一段你自己的写作方法论</li>
          <li>导入后默认对所有环节生效，可在列表里编辑适用范围</li>
        </ol>
      </div>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">粘贴 SKILL.md 或方法论文本</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={'---\nname: 我的选题方法论\ndescription: 一句话说明\n---\n\n# 标题\n\n正文内容...'}
          className="mac-textarea !min-h-[240px] !font-mono !text-xs"
        />
      </section>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className="mac-secondary-btn">
          取消
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={!text.trim()}
          className="mac-primary-btn disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          导入
        </button>
      </div>
    </div>
  );
}

// ==================== 通用方法论：编辑 ====================

function GuideEditor({
  guide,
  onUpdate,
  onSave,
  onCancel,
}: {
  guide: GuideSkill;
  onUpdate: (updates: Partial<GuideSkill>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">名称</label>
        <input
          value={guide.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="mac-input"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">说明</label>
        <input
          value={guide.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="mac-input"
          placeholder="一句话说明这个方法论解决什么问题"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">适用环节</label>
        <div className="flex flex-wrap gap-2">
          {ALL_STAGES.map((stage) => {
            const checked = guide.appliesTo.includes(stage);
            return (
              <button
                key={stage}
                type="button"
                onClick={() =>
                  onUpdate({
                    appliesTo: checked
                      ? guide.appliesTo.filter((s) => s !== stage)
                      : [...guide.appliesTo, stage],
                  })
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  checked
                    ? 'border-[#FF9F43] bg-[#FFF7ED] text-[#FF9F43]'
                    : 'border-[#E8E4DE] text-[#6B6B6B]'
                }`}
              >
                {GUIDE_STAGE_LABELS[stage]}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">方法论内容</label>
        <textarea
          value={guide.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          rows={14}
          className="mac-textarea !min-h-[280px] !font-mono !text-xs"
        />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} className="mac-secondary-btn">
          取消
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!guide.name.trim() || !guide.content.trim()}
          className="mac-primary-btn disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          保存
        </button>
      </div>

      {guide.builtIn && (
        <p className="text-xs text-[#6B6B6B]">提示：这是内置方法论，修改后可点列表里的「恢复内置」还原。</p>
      )}
    </div>
  );
}
