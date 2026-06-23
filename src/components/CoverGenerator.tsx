import { Download, ImageIcon, LayoutTemplate, RefreshCw, Type } from 'lucide-react';
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

type CoverStyle = 'bigtext' | 'split' | 'center' | 'qa' | 'list';

const STYLES: { key: CoverStyle; label: string; desc: string }[] = [
  { key: 'bigtext', label: '大字报', desc: '大标题+高亮+emoji' },
  { key: 'split', label: '左右分栏', desc: '左标题右补充' },
  { key: 'center', label: '居中聚焦', desc: '居中+装饰线' },
  { key: 'qa', label: '问答式', desc: '提问+大答案' },
  { key: 'list', label: '列表式', desc: '数字列表+标题' },
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

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  preset: (typeof PRESETS)[0],
) {
  ctx.save();
  ctx.font = `bold ${Math.floor(width * 0.35)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = preset.watermark;
  ctx.globalAlpha = 0.12;
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
}

function drawHighlightText(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  highlightWords: string[],
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  let currentX = x;
  const lowerLine = line.toLowerCase();
  const matched = highlightWords.find((hw) => lowerLine.includes(hw.toLowerCase()));

  if (!matched) {
    ctx.fillStyle = preset.text;
    ctx.fillText(line, x, y);
    return;
  }

  const idx = line.toLowerCase().indexOf(matched.toLowerCase());
  const before = line.slice(0, idx);
  const hl = line.slice(idx, idx + matched.length);
  const after = line.slice(idx + matched.length);

  if (before) {
    ctx.fillStyle = preset.text;
    ctx.fillText(before, currentX, y);
    currentX += ctx.measureText(before).width;
  }

  const hwWidth = ctx.measureText(hl).width;
  ctx.save();
  ctx.fillStyle = preset.highlight;
  ctx.globalAlpha = 0.6;
  roundRect(ctx, currentX - 4, y + fontSize * 0.1, hwWidth + 8, fontSize * 0.85, 6);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = preset.text;
  ctx.fillText(hl, currentX, y);
  currentX += hwWidth;

  if (after) {
    ctx.fillStyle = preset.text;
    ctx.fillText(after, currentX, y);
  }
}

function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  width: number,
  height: number,
  preset: (typeof PRESETS)[0],
) {
  if (!emoji) return;
  ctx.save();
  ctx.font = `${Math.floor(width * 0.12)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(emoji, width - width * 0.1, height - width * 0.1);
  ctx.restore();
}

function drawBigtext(
  canvas: HTMLCanvasElement,
  title: string,
  highlightWords: string[],
  emoji: string,
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  const ctx = canvas.getContext('2d')!;
  const width = 900;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = preset.bg;
  ctx.fillRect(0, 0, width, height);
  drawWatermark(ctx, width, height, preset);

  ctx.save();
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const paddingX = width * 0.1;
  const paddingY = height * 0.22;
  const maxW = width - paddingX * 2;
  const lineHeight = fontSize * 1.35;

  const lines = wrapText(ctx, title, maxW);
  lines.forEach((line, i) => {
    drawHighlightText(ctx, line, paddingX, paddingY + i * lineHeight, highlightWords, preset, fontSize);
  });
  ctx.restore();

  drawEmoji(ctx, emoji, width, height, preset);
}

function drawSplit(
  canvas: HTMLCanvasElement,
  title: string,
  subtitle: string,
  highlightWords: string[],
  emoji: string,
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  const ctx = canvas.getContext('2d')!;
  const width = 900;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = preset.bg;
  ctx.fillRect(0, 0, width, height);
  drawWatermark(ctx, width, height, preset);

  // Left: big title
  ctx.save();
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const leftX = width * 0.08;
  const topY = height * 0.18;
  const leftW = width * 0.5;
  const lineHeight = fontSize * 1.3;

  const lines = wrapText(ctx, title, leftW);
  lines.forEach((line, i) => {
    drawHighlightText(ctx, line, leftX, topY + i * lineHeight, highlightWords, preset, fontSize);
  });
  ctx.restore();

  // Right: subtitle in a rounded box
  if (subtitle) {
    ctx.save();
    const boxX = width * 0.58;
    const boxY = height * 0.25;
    const boxW = width * 0.34;

    ctx.fillStyle = preset.highlight;
    ctx.globalAlpha = 0.25;
    roundRect(ctx, boxX - 12, boxY - 12, boxW + 24, 200, 16);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = `normal ${Math.floor(fontSize * 0.45)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = preset.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const subLines = wrapText(ctx, subtitle, boxW);
    subLines.slice(0, 6).forEach((line, i) => {
      ctx.fillText(line, boxX, boxY + i * fontSize * 0.65);
    });
    ctx.restore();
  }

  // Divider line
  ctx.save();
  ctx.strokeStyle = preset.highlight;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.54, height * 0.2);
  ctx.lineTo(width * 0.54, height * 0.7);
  ctx.stroke();
  ctx.restore();

  drawEmoji(ctx, emoji, width, height, preset);
}

function drawCenter(
  canvas: HTMLCanvasElement,
  title: string,
  highlightWords: string[],
  emoji: string,
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  const ctx = canvas.getContext('2d')!;
  const width = 900;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = preset.bg;
  ctx.fillRect(0, 0, width, height);
  drawWatermark(ctx, width, height, preset);

  // Decorative quote marks
  ctx.save();
  ctx.font = `bold ${Math.floor(fontSize * 1.8)}px "PingFang SC", serif`;
  ctx.fillStyle = preset.highlight;
  ctx.globalAlpha = 0.4;
  ctx.textAlign = 'center';
  ctx.fillText('"', width / 2, height * 0.12);
  ctx.restore();

  ctx.save();
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const maxW = width * 0.75;
  const lineHeight = fontSize * 1.4;
  const lines = wrapText(ctx, title, maxW);
  const totalH = lines.length * lineHeight;
  const startY = (height - totalH) / 2;

  lines.forEach((line, i) => {
    // For center alignment, we draw each line centered
    // But highlight needs left-aligned within the centered block
    // Simplified: just draw centered text, highlight is approximate
    const matched = highlightWords.find((hw) => line.toLowerCase().includes(hw.toLowerCase()));
    if (matched) {
      const idx = line.toLowerCase().indexOf(matched.toLowerCase());
      const before = line.slice(0, idx);
      const hl = line.slice(idx, idx + matched.length);
      const after = line.slice(idx + matched.length);
      const fullWidth = ctx.measureText(line).width;
      let cx = width / 2 - fullWidth / 2;

      if (before) {
        ctx.fillStyle = preset.text;
        ctx.textAlign = 'left';
        ctx.fillText(before, cx, startY + i * lineHeight);
        cx += ctx.measureText(before).width;
      }

      const hwW = ctx.measureText(hl).width;
      ctx.save();
      ctx.fillStyle = preset.highlight;
      ctx.globalAlpha = 0.6;
      roundRect(ctx, cx - 4, startY + i * lineHeight + fontSize * 0.1, hwW + 8, fontSize * 0.85, 6);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = preset.text;
      ctx.textAlign = 'left';
      ctx.fillText(hl, cx, startY + i * lineHeight);
      cx += hwW;

      if (after) {
        ctx.fillStyle = preset.text;
        ctx.fillText(after, cx, startY + i * lineHeight);
      }
    } else {
      ctx.fillStyle = preset.text;
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    }
  });
  ctx.restore();

  // Bottom decorative line
  ctx.save();
  ctx.strokeStyle = preset.highlight;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(width * 0.35, height * 0.78);
  ctx.lineTo(width * 0.65, height * 0.78);
  ctx.stroke();
  ctx.restore();

  drawEmoji(ctx, emoji, width, height, preset);
}

function drawQA(
  canvas: HTMLCanvasElement,
  question: string,
  answer: string,
  highlightWords: string[],
  emoji: string,
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  const ctx = canvas.getContext('2d')!;
  const width = 900;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = preset.bg;
  ctx.fillRect(0, 0, width, height);
  drawWatermark(ctx, width, height, preset);

  // Question label
  ctx.save();
  ctx.font = `normal ${Math.floor(fontSize * 0.4)}px "PingFang SC", sans-serif`;
  ctx.fillStyle = preset.highlight;
  ctx.globalAlpha = 0.8;
  ctx.textAlign = 'left';
  ctx.fillText('你知道吗？', width * 0.1, height * 0.15);
  ctx.restore();

  // Question text
  ctx.save();
  ctx.font = `bold ${Math.floor(fontSize * 0.65)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = preset.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const qLines = wrapText(ctx, question, width * 0.8);
  qLines.forEach((line, i) => {
    ctx.fillText(line, width * 0.1, height * 0.2 + i * fontSize * 0.85);
  });
  ctx.restore();

  // Big answer
  ctx.save();
  ctx.font = `bold ${Math.floor(fontSize * 1.1)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const aLines = wrapText(ctx, answer, width * 0.8);
  aLines.forEach((line, i) => {
    drawHighlightText(ctx, line, width * 0.1, height * 0.38 + i * fontSize * 1.25, highlightWords, preset, Math.floor(fontSize * 1.1));
  });
  ctx.restore();

  // Bottom hint
  ctx.save();
  ctx.font = `normal ${Math.floor(fontSize * 0.35)}px "PingFang SC", sans-serif`;
  ctx.fillStyle = preset.text;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'center';
  ctx.fillText('—— 左滑查看详情 ——', width / 2, height * 0.72);
  ctx.restore();

  drawEmoji(ctx, emoji, width, height, preset);
}

function drawList(
  canvas: HTMLCanvasElement,
  title: string,
  items: string[],
  highlightWords: string[],
  emoji: string,
  preset: (typeof PRESETS)[0],
  fontSize: number,
) {
  const ctx = canvas.getContext('2d')!;
  const width = 900;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = preset.bg;
  ctx.fillRect(0, 0, width, height);
  drawWatermark(ctx, width, height, preset);

  // Title
  ctx.save();
  ctx.font = `bold ${Math.floor(fontSize * 0.75)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = preset.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const tLines = wrapText(ctx, title, width * 0.8);
  tLines.forEach((line, i) => {
    drawHighlightText(ctx, line, width * 0.1, height * 0.12 + i * fontSize * 0.95, highlightWords, preset, Math.floor(fontSize * 0.75));
  });
  ctx.restore();

  // Items
  const itemFontSize = Math.floor(fontSize * 0.55);
  ctx.save();
  ctx.font = `bold ${itemFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const startY = height * 0.28;
  const itemH = fontSize * 1.1;

  items.slice(0, 5).forEach((item, idx) => {
    const y = startY + idx * itemH;

    // Number circle
    ctx.save();
    ctx.fillStyle = preset.highlight;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(width * 0.12, y + itemFontSize * 0.5, itemFontSize * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = `bold ${Math.floor(itemFontSize * 0.8)}px "PingFang SC", sans-serif`;
    ctx.fillStyle = preset.bg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(idx + 1), width * 0.12, y + itemFontSize * 0.5);
    ctx.restore();

    // Item text
    ctx.font = `normal ${itemFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = preset.text;
    const itemLines = wrapText(ctx, item, width * 0.7);
    itemLines.slice(0, 2).forEach((line, li) => {
      ctx.fillText(line, width * 0.18, y + li * itemFontSize * 1.2);
    });
  });
  ctx.restore();

  drawEmoji(ctx, emoji, width, height, preset);
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
  const [style, setStyle] = useState<CoverStyle>('bigtext');
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [listItems, setListItems] = useState('');
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

    switch (style) {
      case 'bigtext':
        drawBigtext(canvas, title, words, emoji, preset, fontSize);
        break;
      case 'split':
        drawSplit(canvas, title, subtitle, words, emoji, preset, fontSize);
        break;
      case 'center':
        drawCenter(canvas, title, words, emoji, preset, fontSize);
        break;
      case 'qa':
        drawQA(canvas, question || title, answer || title, words, emoji, preset, fontSize);
        break;
      case 'list':
        drawList(
          canvas,
          title,
          listItems
            .split(/[\n;；]/)
            .map((s) => s.trim())
            .filter(Boolean),
          words,
          emoji,
          preset,
          fontSize,
        );
        break;
    }
  }, [style, title, subtitle, question, answer, listItems, highlightWords, emoji, preset, fontSize]);

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
          {/* Style selector */}
          <section>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A]">
              <LayoutTemplate className="h-4 w-4 text-[#6B6B6B]" />
              排版风格
            </label>
            <div className="grid grid-cols-1 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStyle(s.key)}
                  className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                    style === s.key
                      ? 'border-[#F0B8B8] bg-[#FDF8F5]'
                      : 'border-transparent bg-[#FAF7F2] hover:border-[#E8E4DE]'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-[#1A1A1A]">{s.label}</div>
                    <div className="text-xs text-[#6B6B6B]">{s.desc}</div>
                  </div>
                  {style === s.key && <span className="text-[#F0B8B8]">●</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Title */}
          <section>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A]">
              <Type className="h-4 w-4 text-[#6B6B6B]" />
              {style === 'qa' ? '问题' : style === 'list' ? '列表标题' : '封面标题'}
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              placeholder="输入标题"
              className="mac-textarea !min-h-[80px]"
            />
          </section>

          {/* Style-specific fields */}
          {style === 'split' && (
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
                右侧补充文字
              </label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={3}
                placeholder="输入右侧补充内容"
                className="mac-textarea !min-h-[80px]"
              />
            </section>
          )}

          {style === 'qa' && (
            <>
              <section>
                <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
                  提问（可选，留空用标题）
                </label>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="输入问题"
                  className="mac-input"
                />
              </section>
              <section>
                <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
                  答案（大字号显示）
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={3}
                  placeholder="输入答案"
                  className="mac-textarea !min-h-[80px]"
                />
              </section>
            </>
          )}

          {style === 'list' && (
            <section>
              <label className="mb-2 block text-sm font-bold text-[#1A1A1A]">
                列表项（每行一个，最多5个）
              </label>
              <textarea
                value={listItems}
                onChange={(e) => setListItems(e.target.value)}
                rows={5}
                placeholder="例如：&#10;发现1：...&#10;发现2：...&#10;发现3：..."
                className="mac-textarea !min-h-[120px]"
              />
            </section>
          )}

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
