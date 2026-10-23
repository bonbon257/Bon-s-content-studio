import { Brain, Plus, RotateCcw, Save, Tag, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { AutoLearnedPreferences, ManualPreferences, UserPreferences } from '../types';

export function PreferencesDrawer({
  open,
  prefs,
  onClose,
  onSaveManual,
  onResetManual,
  onResetAuto,
}: {
  open: boolean;
  prefs: UserPreferences;
  onClose: () => void;
  onSaveManual: (manual: Partial<ManualPreferences>) => void;
  onResetManual: () => void;
  onResetAuto: () => void;
}) {
  const [draft, setDraft] = useState<ManualPreferences>(prefs.manual);
  const [newRequiredTag, setNewRequiredTag] = useState('');
  const [newForbiddenTag, setNewForbiddenTag] = useState('');

  if (!open) return null;

  function handleSave() {
    onSaveManual(draft);
    onClose();
  }

  function addRequiredTag() {
    const tag = newRequiredTag.trim();
    if (!tag) return;
    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    if (!draft.requiredTags.includes(normalized)) {
      setDraft((prev) => ({ ...prev, requiredTags: [...prev.requiredTags, normalized] }));
    }
    setNewRequiredTag('');
  }

  function removeRequiredTag(index: number) {
    setDraft((prev) => ({
      ...prev,
      requiredTags: prev.requiredTags.filter((_, i) => i !== index),
    }));
  }

  function addForbiddenTag() {
    const tag = newForbiddenTag.trim();
    if (!tag) return;
    const normalized = tag.startsWith('#') ? tag : `#${tag}`;
    if (!draft.forbiddenTags.includes(normalized)) {
      setDraft((prev) => ({ ...prev, forbiddenTags: [...prev.forbiddenTags, normalized] }));
    }
    setNewForbiddenTag('');
  }

  function removeForbiddenTag(index: number) {
    setDraft((prev) => ({
      ...prev,
      forbiddenTags: prev.forbiddenTags.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 transition-opacity" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[#E8E4DE] bg-[#FAF7F2] shadow-xl"
        style={{ animation: 'slideInRight 0.2s ease' }}
      >
        <div className="flex items-center justify-between border-b border-[#E8E4DE] px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#F0B8B8]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">我的偏好</h2>
          </div>
          <button type="button" onClick={onClose} className="mac-icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="space-y-6">
            {/* 写作风格 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
                写作风格偏好
              </label>
              <textarea
                value={draft.writingStyle}
                onChange={(e) => setDraft((prev) => ({ ...prev, writingStyle: e.target.value }))}
                rows={3}
                placeholder="例如：更犀利、吐槽感、少用感叹号、像真人发朋友圈"
                className="mac-textarea !min-h-[80px]"
              />
            </section>

            {/* 正文长度 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
                正文长度目标：{draft.targetLength} 字
              </label>
              <input
                type="range"
                min={100}
                max={200}
                step={10}
                value={draft.targetLength}
                onChange={(e) => setDraft((prev) => ({ ...prev, targetLength: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="mt-1 flex justify-between text-xs text-[#6B6B6B]">
                <span>100字</span>
                <span>150字</span>
                <span>200字</span>
              </div>
            </section>

            {/* 必带标签 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">必带标签</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {draft.requiredTags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#C9EBCA] px-3 py-1 text-xs font-semibold text-[#1A1A1A]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeRequiredTag(i)}
                      className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newRequiredTag}
                  onChange={(e) => setNewRequiredTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRequiredTag()}
                  placeholder="输入标签，按回车添加"
                  className="mac-input flex-1"
                />
                <button type="button" onClick={addRequiredTag} className="mac-mini-btn">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>

            {/* 禁用标签 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">禁用标签</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {draft.forbiddenTags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F5D5D5] px-3 py-1 text-xs font-semibold text-[#1A1A1A]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeForbiddenTag(i)}
                      className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newForbiddenTag}
                  onChange={(e) => setNewForbiddenTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addForbiddenTag()}
                  placeholder="输入标签，按回车添加"
                  className="mac-input flex-1"
                />
                <button type="button" onClick={addForbiddenTag} className="mac-mini-btn">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>

            {/* 角度偏好 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">角度偏好</label>
              <textarea
                value={draft.anglePreference}
                onChange={(e) => setDraft((prev) => ({ ...prev, anglePreference: e.target.value }))}
                rows={2}
                placeholder="例如：优先反常识、生活吐槽、评论区争议"
                className="mac-textarea !min-h-[64px]"
              />
            </section>

            {/* 全局附加指令 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">全局附加指令</label>
              <textarea
                value={draft.globalInstruction}
                onChange={(e) => setDraft((prev) => ({ ...prev, globalInstruction: e.target.value }))}
                rows={3}
                placeholder="例如：不要用问句结尾；外国朋友叫 Emma；正文里不要出现「其实」「说实话」"
                className="mac-textarea !min-h-[80px]"
              />
            </section>

            {/* 外国朋友人设 */}
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">外国朋友人设</label>
              <textarea
                value={draft.friendPersona}
                onChange={(e) => setDraft((prev) => ({ ...prev, friendPersona: e.target.value }))}
                rows={2}
                placeholder="例如：美国女生，性格开朗，喜欢吐槽，说话直接"
                className="mac-textarea !min-h-[64px]"
              />
            </section>

            {/* 自动学习展示 */}
            <section className="rounded-[18px] border border-[#E8E4DE] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-[#6B6B6B]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">自动学习结果</h3>
              </div>
              <AutoLearnedDisplay auto={prefs.auto} />
              <button
                type="button"
                onClick={onResetAuto}
                className="mac-mini-btn mt-3 w-full"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重置自动学习数据
              </button>
            </section>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="border-t border-[#E8E4DE] px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onResetManual} className="mac-secondary-btn">
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </button>
            <button type="button" onClick={handleSave} className="mac-primary-btn">
              <Save className="h-4 w-4" />
              保存偏好
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function AutoLearnedDisplay({ auto }: { auto: AutoLearnedPreferences }) {
  const hasData =
    Object.keys(auto.countryFrequency).length > 0 ||
    Object.keys(auto.angleKeywords).length > 0 ||
    Object.keys(auto.instructionKeywords).length > 0 ||
    auto.lengthSampleCount > 0;

  if (!hasData) {
    return (
      <p className="text-sm text-[#6B6B6B]">
        暂无自动学习数据。多使用几次后，这里会显示程序观察到的你的偏好模式。
      </p>
    );
  }

  function getTop(record: Record<string, number>, limit: number) {
    return Object.entries(record)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }

  return (
    <div className="space-y-2 text-sm">
      {getTop(auto.countryFrequency, 3).length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[#6B6B6B]">常用国家：</span>
          <div className="flex flex-wrap gap-1">
            {getTop(auto.countryFrequency, 3).map(({ key, count }) => (
              <span key={key} className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-xs">
                {key} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {getTop(auto.angleKeywords, 5).length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[#6B6B6B]">角度关键词：</span>
          <div className="flex flex-wrap gap-1">
            {getTop(auto.angleKeywords, 5).map(({ key, count }) => (
              <span key={key} className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-xs">
                {key} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {getTop(auto.instructionKeywords, 5).length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[#6B6B6B]">常见修改方向：</span>
          <div className="flex flex-wrap gap-1">
            {getTop(auto.instructionKeywords, 5).map(({ key, count }) => (
              <span key={key} className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-xs">
                {key} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {auto.lengthSampleCount >= 3 && (
        <div className="flex items-center gap-2">
          <span className="text-[#6B6B6B]">长度倾向：</span>
          <span className="rounded-full bg-[#F5F0E8] px-2 py-0.5 text-xs">
            生成后倾向于改{auto.avgLengthDelta < 0 ? '短' : '长'}约 {Math.abs(Math.round(auto.avgLengthDelta))} 字
            （基于 {auto.lengthSampleCount} 次修改）
          </span>
        </div>
      )}

      {auto.lastUpdated && (
        <p className="mt-2 text-xs text-[#6B6B6B]">
          最后更新：{new Date(auto.lastUpdated).toLocaleString('zh-CN')}
        </p>
      )}
    </div>
  );
}
