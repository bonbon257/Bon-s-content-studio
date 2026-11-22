import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import type { ContentPlan } from '../types';

interface PlanEditorProps {
  plan: ContentPlan;
  verticalName: string;
  generating: boolean;
  onChange: (plan: ContentPlan) => void;
  onConfirm: () => void;
  onBack: () => void;
}

function toLines(items: string[]) {
  return items.join('\n');
}

function fromLines(text: string) {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

// 策划案编辑器：生成正文之前必须经人确认，真实细节只能由用户填写
export function PlanEditor({ plan, verticalName, generating, onChange, onConfirm, onBack }: PlanEditorProps) {
  const evidenceCount = plan.evidence.filter((item) => item.trim()).length;
  const canConfirm = evidenceCount > 0 && plan.selectedTitle.trim().length > 0 && plan.takeaways.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mac-kicker">Content plan</p>
          <h2 className="mt-1 text-2xl font-bold text-[#1A1A1A]">先确认策划案，再写正文</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B6B6B]">
            赛道：{verticalName}。下面每一项都可以改，AI 会严格按你确认的版本写。
          </p>
        </div>
        <button type="button" onClick={onBack} className="mac-clear-btn flex shrink-0 items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          返回选题
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mac-label">写给谁（目标人群）</span>
          <input
            value={plan.audience}
            onChange={(e) => onChange({ ...plan, audience: e.target.value })}
            className="mac-input"
          />
        </label>
        <label>
          <span className="mac-label">什么场景</span>
          <input
            value={plan.scenario}
            onChange={(e) => onChange({ ...plan, scenario: e.target.value })}
            className="mac-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="mac-label">痛点 / 情绪</span>
        <textarea
          value={plan.painPoint}
          onChange={(e) => onChange({ ...plan, painPoint: e.target.value })}
          rows={2}
          className="mac-textarea !min-h-[64px]"
        />
      </label>

      <label className="block">
        <span className="mac-label">利他清单：用户看完能带走什么（每行一条）</span>
        <textarea
          value={toLines(plan.takeaways)}
          onChange={(e) => onChange({ ...plan, takeaways: fromLines(e.target.value) })}
          rows={3}
          className="mac-textarea !min-h-[88px]"
        />
      </label>

      <div>
        <span className="mac-label">选一个标题（也可自己改）</span>
        <div className="grid gap-2">
          {plan.titleOptions.map((title, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange({ ...plan, selectedTitle: title })}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                plan.selectedTitle === title
                  ? 'border-[#1A1A1A] bg-[#F5F3EF] font-semibold text-[#1A1A1A]'
                  : 'border-[#E8E4DE] bg-white text-[#4A4A4A] hover:border-[#1A1A1A]'
              }`}
            >
              {title}
            </button>
          ))}
        </div>
        <input
          value={plan.selectedTitle}
          onChange={(e) => onChange({ ...plan, selectedTitle: e.target.value })}
          placeholder="最终标题，可直接修改"
          className="mac-input mt-2"
        />
      </div>

      <label className="block">
        <span className="mac-label">正文大纲（每行一条）</span>
        <textarea
          value={toLines(plan.outline)}
          onChange={(e) => onChange({ ...plan, outline: fromLines(e.target.value) })}
          rows={4}
          className="mac-textarea !min-h-[110px]"
        />
      </label>

      <div className="rounded-2xl border border-[#F0D9A8] bg-[#FFFBF2] p-4">
        <span className="mac-label">我的真实细节与证据（必填，每行一条）</span>
        <p className="mb-2 text-[11px] leading-5 text-[#8A6D3B]">
          这里只能写你真实经历过的事。AI 不允许编造证据，没填就不会生成——这是内容不像广告的关键。
        </p>
        {plan.evidenceSuggestions.length > 0 && (
          <p className="mb-2 text-[11px] leading-5 text-[#8A6D3B]">
            建议补充：{plan.evidenceSuggestions.join('；')}
          </p>
        )}
        <textarea
          value={toLines(plan.evidence)}
          onChange={(e) => onChange({ ...plan, evidence: fromLines(e.target.value) })}
          placeholder={'例如：我自己 3 月买的，实付 269 元\n连续背了两周，每天通勤 40 分钟\n和我之前那款比，肩带明显不勒'}
          rows={4}
          className="mac-textarea !min-h-[110px] !bg-white"
        />
        {evidenceCount === 0 && <p className="mt-1 text-[11px] text-[#B0771A]">至少填 1 条真实细节才能生成。</p>}
      </div>

      <label className="block">
        <span className="mac-label">结尾互动</span>
        <input value={plan.cta} onChange={(e) => onChange({ ...plan, cta: e.target.value })} className="mac-input" />
      </label>

      <button type="button" onClick={onConfirm} disabled={!canConfirm || generating} className="mac-primary-btn w-full">
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            按策划案生成中...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            确认策划案，生成正文
          </>
        )}
      </button>
    </div>
  );
}
