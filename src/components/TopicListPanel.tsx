import { Lightbulb, Plus, Trash2 } from 'lucide-react';
import type { PlanDraft, VerticalConfig } from '../types';

// 策划台首屏：我的选题列表，选题是资产而不是一次性输入
function draftTitle(draft: PlanDraft) {
  return (
    draft.plan?.selectedTitle ||
    draft.result?.title ||
    draft.angles.find((item) => item.id === draft.selectedAngleId)?.title ||
    draft.brief.idea.trim().slice(0, 40) ||
    draft.brief.references.find((item) => item.trim())?.slice(0, 40) ||
    '未命名选题'
  );
}

function draftStatus(draft: PlanDraft) {
  if (draft.result?.title) return { label: '已生成', className: 'bg-[#E8F5E9] text-[#2E7D32]' };
  if (draft.plan) return { label: '策划中', className: 'bg-[#FFF3E0] text-[#B4651B]' };
  if (draft.angles.length > 0) return { label: '待策划', className: 'bg-[#EDE9FE] text-[#6D5BD0]' };
  return { label: '草稿', className: 'bg-slate-100 text-slate-500' };
}

export function TopicListPanel({
  drafts,
  verticals,
  onNew,
  onOpen,
  onDelete,
}: {
  drafts: PlanDraft[];
  verticals: VerticalConfig[];
  onNew: () => void;
  onOpen: (draft: PlanDraft) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mac-card p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A689]">CONTENT STUDIO</div>
          <h2 className="mt-1 text-xl font-bold text-[#3D3229]">我的选题</h2>
          <p className="mt-1 text-xs text-slate-400">选题、策划案和正文都存在这里，随时可以回来继续改。</p>
        </div>
        <button type="button" onClick={onNew} className="mac-generate flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> 新建选题
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8DFD3] py-16 text-center">
          <Lightbulb className="mb-3 h-8 w-8 text-[#D8C6B4]" />
          <div className="text-sm font-medium text-slate-500">还没有选题</div>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            从一个 idea 或一篇参考爆文开始，先出选题方向和评分，再确认策划案，最后生成正文。
          </p>
          <button type="button" onClick={onNew} className="mac-generate mt-5">
            新建第一个选题
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {drafts.map((draft) => {
            const status = draftStatus(draft);
            const vertical = verticals.find((item) => item.id === draft.verticalId);
            const angle = draft.angles.find((item) => item.id === draft.selectedAngleId);
            return (
              <div
                key={draft.id}
                className="group relative cursor-pointer rounded-2xl border border-[#EFE6DB] bg-[#FFFCF8] p-4 transition hover:border-[#E0C9B2] hover:shadow-sm"
                onClick={() => onOpen(draft)}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
                  <span className="text-[10px] text-slate-400">
                    {vertical?.name || '自定义'} · {draft.platform}
                  </span>
                  {angle?.score !== undefined && (
                    <span className="ml-auto rounded-full bg-[#FFF3E0] px-1.5 py-0.5 text-[10px] font-bold text-[#B4651B]">
                      {angle.score} 分
                    </span>
                  )}
                </div>
                <div className="line-clamp-2 text-sm font-semibold leading-5 text-[#3D3229]">{draftTitle(draft)}</div>
                {angle?.emotionHook && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{angle.emotionHook}</p>}
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                  <span>更新于 {draft.updatedAt.slice(0, 10)}</span>
                  <button
                    type="button"
                    title="删除选题"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(draft.id);
                    }}
                    className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
