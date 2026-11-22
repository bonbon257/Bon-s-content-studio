import { Loader2, RefreshCw, Wand2 } from 'lucide-react';
import type { AestheticReview } from '../types';

interface AestheticPanelProps {
  review: AestheticReview | null;
  loading: boolean;
  optimizing: boolean;
  onReview: () => void;
  onOptimize: () => void;
}

function scoreColor(score: number) {
  if (score >= 8) return '#2E7D32';
  if (score >= 6) return '#B0771A';
  return '#D93025';
}

// 审美四维质检：利他性 / 信息密度 / 不像广告 / 素人感
export function AestheticPanel({ review, loading, optimizing, onReview, onOptimize }: AestheticPanelProps) {
  return (
    <div className="mb-4 rounded-2xl border border-[#EEEAE4] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#1A1A1A]">内容审美质检</p>
          <p className="mt-0.5 text-[11px] text-[#8A8A8A]">只评内容好不好看，不评合规</p>
        </div>
        <div className="flex items-center gap-2">
          {review && (
            <button type="button" onClick={onOptimize} disabled={optimizing || loading} className="mac-secondary-btn !px-3 !py-1.5 !text-xs">
              {optimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              按建议优化
            </button>
          )}
          <button type="button" onClick={onReview} disabled={loading || optimizing} className="mac-clear-btn flex items-center gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {review ? '重新评审' : '开始评审'}
          </button>
        </div>
      </div>

      {loading && !review && <p className="mt-3 text-xs text-[#8A8A8A]">评审中…</p>}

      {review && (
        <div className="mt-3">
          <p className="text-xs leading-5 text-[#4A4A4A]">
            <span className="font-bold" style={{ color: scoreColor(review.overallScore) }}>
              {review.overallScore.toFixed(1)} 分
            </span>
            {review.summary ? ` · ${review.summary}` : ''}
          </p>
          <div className="mt-3 grid gap-3">
            {review.dimensions.map((dimension) => (
              <div key={dimension.key}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#1A1A1A]">{dimension.label}</span>
                  <span className="font-semibold" style={{ color: scoreColor(dimension.score) }}>
                    {dimension.score}/10
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[#F0EDE8]">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${dimension.score * 10}%`, backgroundColor: scoreColor(dimension.score) }}
                  />
                </div>
                {dimension.issue && dimension.issue !== '无明显问题' && (
                  <p className="mt-1 text-[11px] leading-5 text-[#6B6B6B]">问题：{dimension.issue}</p>
                )}
                {dimension.suggestion && (
                  <p className="mt-0.5 text-[11px] leading-5 text-[#8A8A8A]">建议：{dimension.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
