import { Download, ImageIcon, RefreshCw, Type } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const PRESETS = [
  {
    name: '奶油米白',
    bg: '#FAF7F2',
    text: '#4A3728',
    highlight: '#D4E157',
    watermark: '#E8E4DE',
    watermarkText: '?',
  },
  {
    name: '薄荷清新',
    bg: '#F0F7F4',
    text: '#2D5A4A',
    highlight: '#81C784',
    watermark: '#D4E8E0',
    watermarkText: '✦',
  },
  {
    name: '暖橙活力',
    bg: '#FFF5E6',
    text: '#8B4513',
    highlight: '#FFB74D',
    watermark: '#FFE0B2',
    watermarkText: '★',
  },
  {
    name: '淡紫温柔',
    bg: '#F5F0FA',
    text: '#5D3A7A',
    highlight: '#CE93D8',
    watermark: '#E1D5F0',
    watermarkText: '♡',
  },
  {
    name: '灰蓝高级',
    bg: '#F0F4F8',
    text: '#2C3E50',
    highlight: '#90CAF9',
    watermark: '#D6E4F0',
    watermarkText: '◆',
  },
];

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  for (const char of text) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawCover(
  canvas: HTMLCanvasElement,
  title: string,
  highlightWords: string[],
  emoji: string,
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 900;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  // Background
  ctx.fillStyle = preset.bg;
  ctx.fillRect(0, 0, width, height);

  // Watermark pattern
  ctx.save();
  ctx.font = `bold ${Math.floor(width * 0.35)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = preset.watermark;
  ctx.globalAlpha = 0.15;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (col + 0.5) * (width / 3);
      const y = (row + 0.5) * (height / 3);
      ctx.fillText(preset.watermarkText, x, y);
    }
  }
  ctx.restore();

  // Title
  ctx.save();
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = preset.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const paddingX = width * 0.1;
  const paddingY = height * 0.22;
  const maxTextWidth = width - paddingX * 2;
  const lineHeight = fontSize * 1.35;

  const lines = wrapText(ctx, title, maxTextWidth);

  lines.forEach((line, lineIndex) => {
    let x = paddingX;
    const y = paddingY + lineIndex * lineHeight;

    // Check if any highlight word is in this line
    const lowerLine = line.toLowerCase();
    const matchedHighlight = highlightWords.find((hw) =>
      lowerLine.includes(hw.toLowerCase()),
    );

    if (matchedHighlight) {
      // Draw highlight background for the matched word
      const hwIndex = line.toLowerCase().indexOf(matchedHighlight.toLowerCase());
      const beforeText = line.slice(0, hwIndex);
      const highlightText = line.slice(hwIndex, hwIndex + matchedHighlight.length);
      const afterText = line.slice(hwIndex + matchedHighlight.length);

      // Before text
      if (beforeText) {
        ctx.fillStyle = preset.text;
        ctx.fillText(beforeText, x, y);
        x += ctx.measureText(beforeText).width;
      }

      // Highlight background
      const hwWidth = ctx.measureText(highlightText).width;
      const hwHeight = fontSize * 0.85;
      ctx.save();
      ctx.fillStyle = preset.highlight;
      ctx.globalAlpha = 0.6;
      roundRect(ctx, x - 4, y + fontSize * 0.1, hwWidth + 8, hwHeight, 6);
      ctx.fill();
      ctx.restore();

      // Highlight text
      ctx.fillStyle = preset.text;
      ctx.fillText(highlightText, x, y);
      x += hwWidth;

      // After text
      if (afterText) {
        ctx.fillStyle = preset.text;
        ctx.fillText(afterText, x, y);
      }
    } else {
      ctx.fillStyle = preset.text;
      ctx.fillText(line, x, y);
    }
  });

  ctx.restore();

  // Emoji
  if (emoji) {
    ctx.save();
    ctx.font = `${Math.floor(width * 0.12)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(emoji, width - paddingX, height - paddingX);
    ctx.restore();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function CoverGenerator({
  initialTitle = '',
  onClose,
}: {
  initialTitle?: string;
  onClose?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [highlightWords, setHighlightWords] = useState('');
  const [emoji, setEmoji] = useState('💡');
  const [presetIndex, setPresetIndex] = useState(0);
  const [fontSize, setFontSize] = useState(72);

  const preset = PRESETS[presetIndex];

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const words = highlightWords
      .split(/[,，\s]+/)
      .map((w) => w.trim())
      .filter(Boolean);
    drawCover(canvas, title, words, emoji, preset, fontSize);
  }, [title, highlightWords, emoji, preset, fontSize]);

  useEffect(() => {
    render();
  }, [render]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `小红书封面_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-[#E8E4DE] px-6 py-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#F0B8B8]" />
          <h2 className="text-lg font-bold text-[#1A1A1A]">封面生成器</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="mac-icon-btn">
            ✕
          </button>
        )}
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden p-6">
        {/* Preview */}
        <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-[#E8E4DE] bg-white p-6">
          <div
            className="overflow-hidden rounded-[16px] shadow-lg"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '70vh',
                display: 'block',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="mac-primary-btn mt-4"
          >
            <Download className="h-4 w-4" />
            下载封面
          </button>
        </div>

        {/* Controls */}
        <div className="flex w-80 flex-col gap-5 overflow-y-auto rounded-[24px] border border-[#E8E4DE] bg-white p-5">
          <section>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A]">
              <Type className="h-4 w-4 text-[#6B6B6B]" />
              封面标题
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={4}
              placeholder="输入封面标题，建议14-24字"
              className="mac-textarea !min-h-[100px]"
            />
          </section>

          <section>
            <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
              高亮关键词（用逗号分隔）
            </label>
            <input
              value={highlightWords}
              onChange={(e) => setHighlightWords(e.target.value)}
              placeholder="例如：经理, 会计"
              className="mac-input"
            />
          </section>

          <section>
            <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
              装饰 Emoji
            </label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="输入一个emoji"
              className="mac-input"
              maxLength={2}
            />
          </section>

          <section>
            <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
              配色方案
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPresetIndex(i)}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    i === presetIndex
                      ? 'border-[#F0B8B8] scale-110 shadow'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: p.bg }}
                  title={p.name}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-[#6B6B6B]">{preset.name}</p>
          </section>

          <section>
            <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
              字体大小：{fontSize}px
            </label>
            <input
              type="range"
              min={48}
              max={96}
              step={4}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </section>

          <button
            type="button"
            onClick={render}
            className="mac-secondary-btn"
          >
            <RefreshCw className="h-4 w-4" />
            刷新预览
          </button>
        </div>
      </div>
    </div>
  );
}
