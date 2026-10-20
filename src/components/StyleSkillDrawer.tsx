import { Sparkles, Plus, X, Trash2, Copy, Check, Wand2, ChevronDown, ChevronUp, MessageCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import type { StyleSkill, ChatStyleSkill } from '../types';
import type { ExtractedStyleSkill, ExtractedChatStyleSkill } from '../llm';
import { extractStyleFromSamples, extractChatStyleFromSamples } from '../llm';
import type { LlmConfig } from '../types';

type SkillTab = 'post' | 'chat';
type ViewMode = 'list' | 'create' | 'edit' | 'extract';

export function StyleSkillDrawer({
  open,
  skills,
  activeSkillId,
  chatSkills,
  activeChatSkillId,
  config,
  onClose,
  onActivate,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  onDeactivate,
  onChatActivate,
  onChatCreate,
  onChatUpdate,
  onChatDelete,
  onChatDuplicate,
  onChatDeactivate,
}: {
  open: boolean;
  skills: StyleSkill[];
  activeSkillId: string | null;
  chatSkills: ChatStyleSkill[];
  activeChatSkillId: string | null;
  config: LlmConfig;
  onClose: () => void;
  onActivate: (id: string) => void;
  onCreate: (data: Partial<StyleSkill> & { name: string }) => void;
  onUpdate: (id: string, data: Partial<StyleSkill>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDeactivate: () => void;
  onChatActivate: (id: string) => void;
  onChatCreate: (data: Partial<ChatStyleSkill> & { name: string }) => void;
  onChatUpdate: (id: string, data: Partial<ChatStyleSkill>) => void;
  onChatDelete: (id: string) => void;
  onChatDuplicate: (id: string) => void;
  onChatDeactivate: () => void;
}) {
  const [tab, setTab] = useState<SkillTab>('post');
  const [view, setView] = useState<ViewMode>('list');
  const [editingSkill, setEditingSkill] = useState<StyleSkill | null>(null);
  const [editingChatSkill, setEditingChatSkill] = useState<ChatStyleSkill | null>(null);
  const [extractText, setExtractText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  if (!open) return null;

  function handleBack() {
    setView('list');
    setEditingSkill(null);
    setEditingChatSkill(null);
    setExtractText('');
    setExtractError('');
  }

  async function handleExtract() {
    const samples = extractText
      .split(/\n---\n|#{1,6}\s*样本|\n\n(?=【)/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    if (samples.length < 1) {
      setExtractError('请至少粘贴 1 篇样本');
      return;
    }

    setExtracting(true);
    setExtractError('');

    try {
      if (tab === 'post') {
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
      } else {
        const result = await extractChatStyleFromSamples({
          config,
          samples,
        });
        setEditingChatSkill({
          id: '',
          name: result.name,
          description: result.description,
          roundCount: result.roundCount,
          chinesePersona: result.chinesePersona,
          foreignPersona: result.foreignPersona,
          pace: result.pace,
          openingStyle: result.openingStyle,
          followUpStyle: result.followUpStyle,
          toneStyle: result.toneStyle,
          languageLevel: result.languageLevel,
          chatRules: result.chatRules,
          commonPhrases: result.commonPhrases,
          samples,
          globalInstruction: result.globalInstruction,
          active: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setView('create');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : '提炼失败');
    } finally {
      setExtracting(false);
    }
  }

  function handleSaveNewSkill() {
    if (tab === 'post' && editingSkill) {
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
    } else if (tab === 'chat' && editingChatSkill) {
      onChatCreate({
        name: editingChatSkill.name,
        description: editingChatSkill.description,
        roundCount: editingChatSkill.roundCount,
        chinesePersona: editingChatSkill.chinesePersona,
        foreignPersona: editingChatSkill.foreignPersona,
        pace: editingChatSkill.pace,
        openingStyle: editingChatSkill.openingStyle,
        followUpStyle: editingChatSkill.followUpStyle,
        toneStyle: editingChatSkill.toneStyle,
        languageLevel: editingChatSkill.languageLevel,
        chatRules: editingChatSkill.chatRules,
        commonPhrases: editingChatSkill.commonPhrases,
        samples: editingChatSkill.samples,
        globalInstruction: editingChatSkill.globalInstruction,
      });
    }
    handleBack();
  }

  function handleUpdateSkill() {
    if (tab === 'post' && editingSkill) {
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
    } else if (tab === 'chat' && editingChatSkill) {
      onChatUpdate(editingChatSkill.id, {
        name: editingChatSkill.name,
        description: editingChatSkill.description,
        roundCount: editingChatSkill.roundCount,
        chinesePersona: editingChatSkill.chinesePersona,
        foreignPersona: editingChatSkill.foreignPersona,
        pace: editingChatSkill.pace,
        openingStyle: editingChatSkill.openingStyle,
        followUpStyle: editingChatSkill.followUpStyle,
        toneStyle: editingChatSkill.toneStyle,
        languageLevel: editingChatSkill.languageLevel,
        chatRules: editingChatSkill.chatRules,
        commonPhrases: editingChatSkill.commonPhrases,
        samples: editingChatSkill.samples,
        globalInstruction: editingChatSkill.globalInstruction,
      });
    }
    handleBack();
  }

  const isEdit = view === 'edit';
  const currentActiveName = tab === 'post'
    ? skills.find((s) => s.id === activeSkillId)?.name
    : chatSkills.find((s) => s.id === activeChatSkillId)?.name;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 transition-opacity" onClick={handleBack} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[#E8E4DE] bg-[#FAF7F2] shadow-xl"
        style={{ animation: 'slideInRight 0.2s ease' }}
      >
        {/* Header */}
        <div className="border-b border-[#E8E4DE] px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF9F43]" />
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                {view === 'list' && '风格 SKILL'}
                {view === 'create' && `创建${tab === 'post' ? '正文' : '聊天'}SKILL`}
                {view === 'edit' && `编辑${tab === 'post' ? '正文' : '聊天'}SKILL`}
                {view === 'extract' && `从${tab === 'post' ? '爆文' : '聊天记录'}提炼`}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="mac-icon-btn">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab 切换 */}
          {view === 'list' && (
            <div className="mt-4 flex gap-1 rounded-xl bg-[#F5F0E8] p-1">
              <button
                type="button"
                onClick={() => setTab('post')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                  tab === 'post'
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <FileText className="h-4 w-4" />
                正文风格
              </button>
              <button
                type="button"
                onClick={() => setTab('chat')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                  tab === 'chat'
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                聊天风格
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {view === 'list' && tab === 'post' && (
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
                  id: '', name: '', description: '', styleRules: '',
                  titlePattern: '', openingPattern: '', structurePattern: '',
                  toneStyle: '', endingPattern: '', requiredTags: [],
                  forbiddenTags: [], targetLength: 150, samples: [],
                  globalInstruction: '', friendPersona: '', active: false,
                  createdAt: '', updatedAt: '',
                });
                setView('create');
              }}
              onExtract={() => setView('extract')}
              typeLabel="正文"
              activeName={currentActiveName}
            />
          )}

          {view === 'list' && tab === 'chat' && (
            <SkillListView
              skills={chatSkills.map((s) => ({ id: s.id, name: s.name, description: s.description, sampleCount: s.samples.length, roundCount: s.roundCount }))}
              activeSkillId={activeChatSkillId}
              onActivate={onChatActivate}
              onDeactivate={onChatDeactivate}
              onEdit={(skill: any) => {
                const full = chatSkills.find((s) => s.id === skill.id);
                if (full) {
                  setEditingChatSkill(full);
                  setView('edit');
                }
              }}
              onDelete={onChatDelete}
              onDuplicate={onChatDuplicate}
              onCreateManual={() => {
                setEditingChatSkill({
                  id: '', name: '', description: '', roundCount: 10,
                  chinesePersona: '', foreignPersona: '', pace: '',
                  openingStyle: '', followUpStyle: '', toneStyle: '',
                  languageLevel: '', chatRules: '', commonPhrases: '',
                  samples: [], globalInstruction: '', active: false,
                  createdAt: '', updatedAt: '',
                });
                setView('create');
              }}
              onExtract={() => setView('extract')}
              typeLabel="聊天"
              activeName={currentActiveName}
              isChatType
            />
          )}

          {view === 'create' && tab === 'post' && editingSkill && (
            <PostSkillEditor
              skill={editingSkill}
              isNew
              onChange={(updates) =>
                setEditingSkill((prev) => (prev ? { ...prev, ...updates } : prev))
              }
              onSave={handleSaveNewSkill}
              onCancel={handleBack}
            />
          )}

          {view === 'edit' && tab === 'post' && editingSkill && (
            <PostSkillEditor
              skill={editingSkill}
              isNew={false}
              onChange={(updates) =>
                setEditingSkill((prev) => (prev ? { ...prev, ...updates } : prev))
              }
              onSave={handleUpdateSkill}
              onCancel={handleBack}
            />
          )}

          {view === 'create' && tab === 'chat' && editingChatSkill && (
            <ChatSkillEditor
              skill={editingChatSkill}
              isNew
              onChange={(updates) =>
                setEditingChatSkill((prev) => (prev ? { ...prev, ...updates } : prev))
              }
              onSave={handleSaveNewSkill}
              onCancel={handleBack}
            />
          )}

          {view === 'edit' && tab === 'chat' && editingChatSkill && (
            <ChatSkillEditor
              skill={editingChatSkill}
              isNew={false}
              onChange={(updates) =>
                setEditingChatSkill((prev) => (prev ? { ...prev, ...updates } : prev))
              }
              onSave={handleUpdateSkill}
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
              type={tab === 'post' ? 'post' : 'chat'}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

// ==================== SKILL 列表（通用） ====================

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
  typeLabel,
  activeName,
  isChatType,
}: {
  skills: Array<{ id: string; name: string; description: string; sampleCount?: number; roundCount?: number }>;
  activeSkillId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
  onEdit: (skill: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCreateManual: () => void;
  onExtract: () => void;
  typeLabel: string;
  activeName?: string;
  isChatType?: boolean;
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
          从{isChatType ? '聊天记录' : '爆文'}提炼
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
          <p className="text-sm text-[#6B6B6B]">{activeName || '未知'}</p>
        </div>
      )}

      {/* SKILL 列表 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1A1A1A]">我的{typeLabel}SKILL（{skills.length}）</h3>
        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E8E4DE] bg-white/50 py-8 text-center">
            <p className="text-sm text-[#6B6B6B]">还没有{typeLabel}风格 SKILL</p>
            <p className="mt-1 text-xs text-[#B8B5CC]">
              从{isChatType ? '聊天记录' : '爆文'}提炼或手动创建，生成的内容会严格遵循你的风格
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
              isChatType={isChatType}
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
  isChatType,
}: {
  skill: { id: string; name: string; description: string; sampleCount?: number; roundCount?: number };
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isChatType?: boolean;
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
            {skill.roundCount !== undefined && (
              <span className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-[10px] text-[#6B6B6B]">
                {skill.roundCount}轮对话
              </span>
            )}
            {skill.sampleCount !== undefined && skill.sampleCount > 0 && (
              <span className="rounded-full bg-[#FFE4C4]/50 px-2 py-0.5 text-[10px] text-[#B86B00]">
                {skill.sampleCount}篇样本
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

      {/* 操作按钮 */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-lg bg-[#F5F0E8] py-1.5 text-xs font-medium text-[#6B6B6B] transition hover:bg-[#EDE6D8]"
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

// ==================== 正文风格 SKILL 编辑器 ====================

function PostSkillEditor({
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

      {/* 保存/取消按钮 */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 border-t border-[#E8E4DE] bg-[#FAF7F2] px-6 py-4">
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
            {isNew ? '保存并应用' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 聊天风格 SKILL 编辑器 ====================

function ChatSkillEditor({
  skill,
  isNew,
  onChange,
  onSave,
  onCancel,
}: {
  skill: ChatStyleSkill;
  isNew: boolean;
  onChange: (updates: Partial<ChatStyleSkill>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const canSave = skill.name.trim().length > 0;

  return (
    <div className="space-y-5">
      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">SKILL 名称</label>
        <input
          value={skill.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="例如：轻松吐槽风聊天"
          className="mac-input"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">一句话描述</label>
        <input
          value={skill.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="这个聊天风格的核心特征"
          className="mac-input"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
          对话轮数：约 {skill.roundCount} 轮
        </label>
        <input
          type="range"
          min={6}
          max={15}
          step={1}
          value={skill.roundCount}
          onChange={(e) => onChange({ roundCount: Number(e.target.value) })}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-[#6B6B6B]">
          <span>6轮</span>
          <span>10轮</span>
          <span>15轮</span>
        </div>
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">中国用户人设</label>
        <textarea
          value={skill.chinesePersona}
          onChange={(e) => onChange({ chinesePersona: e.target.value })}
          rows={2}
          placeholder="例如：好奇心强，喜欢追问，说话直接带点吐槽感，偶尔用语气词"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">外国用户人设</label>
        <textarea
          value={skill.foreignPersona}
          onChange={(e) => onChange({ foreignPersona: e.target.value })}
          rows={2}
          placeholder="例如：性格开朗，喜欢分享个人经历，说话幽默，偶尔吐槽自己国家"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">对话节奏</label>
        <textarea
          value={skill.pace}
          onChange={(e) => onChange({ pace: e.target.value })}
          rows={2}
          placeholder="例如：快节奏短句，每轮不超过2句话；你来我往，不冷场"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">开场方式</label>
        <textarea
          value={skill.openingStyle}
          onChange={(e) => onChange({ openingStyle: e.target.value })}
          rows={2}
          placeholder="例如：中国用户先用一个轻松的问题开场，外国朋友用惊讶/认同回应"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">追问模式</label>
        <textarea
          value={skill.followUpStyle}
          onChange={(e) => onChange({ followUpStyle: e.target.value })}
          rows={2}
          placeholder="例如：围绕对方回答中的细节追问，用'真的吗？''为什么？''那你呢？'等自然追问"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">语气风格</label>
        <textarea
          value={skill.toneStyle}
          onChange={(e) => onChange({ toneStyle: e.target.value })}
          rows={2}
          placeholder="例如：朋友闲聊感，轻松带点吐槽，不正式，像真实聊天"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">语言难度</label>
        <textarea
          value={skill.languageLevel}
          onChange={(e) => onChange({ languageLevel: e.target.value })}
          rows={2}
          placeholder="例如：简单日常词汇为主，偶尔用一些地道表达，不要太难的词"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">核心对话规则</label>
        <textarea
          value={skill.chatRules}
          onChange={(e) => onChange({ chatRules: e.target.value })}
          rows={3}
          placeholder="3-5 条最关键的对话规则，每条具体可执行。这是最高优先级规则。"
          className="mac-textarea !min-h-[80px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">常用表达/口头禅</label>
        <textarea
          value={skill.commonPhrases}
          onChange={(e) => onChange({ commonPhrases: e.target.value })}
          rows={2}
          placeholder="例如：中国用户常用'哇''真的假的''厉害了'；外国用户常用'Oh wow''Really?''That's crazy'"
          className="mac-textarea !min-h-[60px]"
        />
      </section>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">全局附加指令</label>
        <textarea
          value={skill.globalInstruction}
          onChange={(e) => onChange({ globalInstruction: e.target.value })}
          rows={3}
          placeholder="任何时候都要遵守的铁律。例如：不要用长句子；不要像老师讲课；每轮对话最多 2 句话"
          className="mac-textarea !min-h-[80px]"
        />
      </section>

      {skill.samples.length > 0 && (
        <section>
          <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
            参考样本（{skill.samples.length}段）
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

      {/* 保存/取消按钮 */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 border-t border-[#E8E4DE] bg-[#FAF7F2] px-6 py-4">
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
            {isNew ? '保存并应用' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 从样本提炼 ====================

function ExtractView({
  extractText,
  setExtractText,
  extracting,
  error,
  onExtract,
  onCancel,
  type,
}: {
  extractText: string;
  setExtractText: (v: string) => void;
  extracting: boolean;
  error: string;
  onExtract: () => void;
  onCancel: () => void;
  type: 'post' | 'chat';
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#FF9F43]/20 bg-[#FFF7ED] p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
          <Wand2 className="h-4 w-4 text-[#FF9F43]" />
          如何使用
        </h3>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-[#6B6B6B]">
          <li>粘贴 2-5 段你认为效果最好的{type === 'post' ? '爆文' : '聊天记录'}</li>
          <li>每段之间用 <code className="rounded bg-white px-1 py-0.5">---</code> 分隔</li>
          <li>AI 会自动分析共同风格，生成可复用的 SKILL</li>
          <li>提炼后你可以手动调整再保存</li>
        </ol>
      </div>

      <section>
        <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">粘贴{type === 'post' ? '爆文' : '聊天记录'}样本</label>
        <textarea
          value={extractText}
          onChange={(e) => setExtractText(e.target.value)}
          rows={12}
          placeholder={type === 'post'
            ? `第一篇爆文标题和正文...\n\n---\n\n第二篇爆文标题和正文...\n\n---\n\n第三篇...`
            : `第一段聊天记录...\n\n---\n\n第二段聊天记录...\n\n---\n\n第三段...`
          }
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
