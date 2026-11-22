import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { CHAT_TONES, type ChatTone } from '../config/tone';

interface ChatTonePanelProps {
  tone: ChatTone;
  onToneChange: (tone: ChatTone) => void;
  // 正文 + 聊天里检测到的和稀泥表达
  hedgeHits: string[];
  // 聊天里命中的数量，大于 0 才允许一键去除
  chatHedgeCount: number;
  removing: boolean;
  onRemoveHedges: () => void;
}

export function ChatTonePanel({
  tone,
  onToneChange,
  hedgeHits,
  chatHedgeCount,
  removing,
  onRemoveHedges,
}: ChatTonePanelProps) {
  const activeTone = CHAT_TONES.find((item) => item.id === tone);
  return (
    <div className="mb-4 rounded-2xl border border-[#EEEAE4] bg-[#FAFAFA] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#1A1A1A]">聊天调性</span>
        <div className="flex gap-2">
          {CHAT_TONES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToneChange(item.id)}
              className={`mac-platform-pill !px-3 !py-1 !text-[11px] ${tone === item.id ? 'is-active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {activeTone && <p className="mt-1.5 text-[11px] leading-5 text-[#8A8A8A]">{activeTone.hint}，点击「重新生成聊天」后生效。</p>}

      {hedgeHits.length > 0 && (
        <div className="mt-3 rounded-xl bg-[#FFF6E8] p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B0771A]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#8A5A0A]">
                检测到 {hedgeHits.length} 处和稀泥表达
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[#8A5A0A]">{hedgeHits.join('、')}</p>
            </div>
          </div>
          {chatHedgeCount > 0 && (
            <button
              type="button"
              onClick={onRemoveHedges}
              disabled={removing}
              className="mac-clear-btn mt-2 flex items-center gap-1 !text-[#8A5A0A]"
            >
              {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              一键去除聊天里的和稀泥
            </button>
          )}
        </div>
      )}
    </div>
  );
}
