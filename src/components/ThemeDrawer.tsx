import { Palette, X } from 'lucide-react';
import {
  THEME_PRESETS,
  type ThemeDensity,
  type ThemeFontFamily,
  type ThemePresetId,
  type ThemeSettings,
} from '../theme';

const FONT_OPTIONS: { id: ThemeFontFamily; label: string }[] = [
  { id: 'modern', label: '现代无衬线' },
  { id: 'rounded', label: '圆润亲切' },
  { id: 'serif', label: '正式衬线' },
  { id: 'handwriting', label: '手写感' },
];

const DENSITY_OPTIONS: { id: ThemeDensity; label: string }[] = [
  { id: 'compact', label: '紧凑' },
  { id: 'comfortable', label: '舒适' },
  { id: 'roomy', label: '宽松' },
];

export function ThemeDrawer({
  open,
  settings,
  onClose,
  onChange,
  onReset,
  onSave,
}: {
  open: boolean;
  settings: ThemeSettings;
  onClose: () => void;
  onChange: (next: ThemeSettings) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  if (!open) return null;

  function applyPreset(presetId: ThemePresetId) {
    onChange({ ...THEME_PRESETS[presetId].settings });
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30 transition-opacity" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-canvas shadow-xl"
        style={{ animation: 'n-fade-up 0.2s ease' }}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-8 pb-5 pt-8">
          <div>
            <h2 className="n-h2 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              页面设计
            </h2>
            <p className="n-muted mt-1">先预览效果，点击“保存设计”后才会保留到当前浏览器。</p>
          </div>
          <button type="button" onClick={onClose} className="n-btn-ghost" title="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-7">
            <section>
              <p className="mb-3 text-sm font-bold text-ink">预设主题</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(THEME_PRESETS).map(([id, preset]) => {
                  const active = settings.presetId === id;
                  const ps = preset.settings;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => applyPreset(id as ThemePresetId)}
                      className={`flex flex-col items-start gap-2 rounded-[16px] border p-3 text-left transition ${
                        active
                          ? 'border-accent bg-white shadow-paper'
                          : 'border-line/60 bg-white/60 hover:border-accent/60'
                      }`}
                    >
                      <div className="flex w-full gap-1.5">
                        <span className="h-6 flex-1 rounded-md" style={{ background: ps.bgColor }} />
                        <span
                          className="h-6 flex-1 rounded-md border border-black/5"
                          style={{ background: ps.panelColor }}
                        />
                        <span className="h-6 w-6 rounded-md" style={{ background: ps.accentColor }} />
                      </div>
                      <span className="text-xs font-semibold text-ink">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-bold text-ink">自定义颜色</p>
              <div className="grid grid-cols-2 gap-3">
                <ColorField
                  label="主强调色"
                  value={settings.accentColor}
                  onChange={(v) => onChange({ ...settings, accentColor: v })}
                />
                <ColorField
                  label="页面背景"
                  value={settings.bgColor}
                  onChange={(v) => onChange({ ...settings, bgColor: v })}
                />
                <ColorField
                  label="卡片底色"
                  value={settings.panelColor}
                  onChange={(v) => onChange({ ...settings, panelColor: v })}
                />
                <ColorField
                  label="文字颜色"
                  value={settings.inkColor}
                  onChange={(v) => onChange({ ...settings, inkColor: v })}
                />
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-bold text-ink">字体风格</p>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((opt) => {
                  const active = settings.fontFamily === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...settings, fontFamily: opt.id })}
                      className={`rounded-[14px] border px-3 py-2 text-sm transition ${
                        active
                          ? 'border-accent bg-white text-ink shadow-paper'
                          : 'border-line/60 bg-white/60 text-muted hover:text-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-bold text-ink">布局密度</p>
              <div className="grid grid-cols-3 gap-2">
                {DENSITY_OPTIONS.map((opt) => {
                  const active = settings.density === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...settings, density: opt.id })}
                      className={`rounded-[14px] border px-3 py-2 text-sm transition ${
                        active
                          ? 'border-accent bg-white text-ink shadow-paper'
                          : 'border-line/60 bg-white/60 text-muted hover:text-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-3 text-sm font-bold text-ink">圆角大小</p>
              <input
                type="range"
                min={6}
                max={28}
                step={1}
                value={settings.radius}
                onChange={(e) => onChange({ ...settings, radius: Number(e.target.value) })}
                className="w-full"
              />
              <p className="mt-2 text-xs text-muted">当前：{settings.radius}px</p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={onReset} className="n-btn n-btn-ghost justify-center">
                恢复默认
              </button>
              <button type="button" onClick={onClose} className="n-btn n-btn-ghost justify-center">
                取消
              </button>
              <button type="button" onClick={onSave} className="n-btn n-btn-primary col-span-2 justify-center">
                保存设计
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-[12px] border border-line/60 bg-white/70 px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs text-ink focus:outline-none"
        />
      </div>
    </label>
  );
}
