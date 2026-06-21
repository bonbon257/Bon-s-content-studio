// 主题系统：4 套预设 + 自定义微调，写到 localStorage，并以 CSS 变量覆盖关键色
export type ThemePresetId = 'creamGreen' | 'sakuraPink' | 'businessBlue' | 'darkInk';
export type ThemeDensity = 'comfortable' | 'compact' | 'roomy';
export type ThemeFontFamily = 'modern' | 'rounded' | 'serif' | 'handwriting';

export interface ThemeSettings {
  presetId: ThemePresetId;
  accentColor: string; // 主强调色
  bgColor: string; // 页面背景
  panelColor: string; // 卡片底色
  inkColor: string; // 主要文字
  density: ThemeDensity;
  fontFamily: ThemeFontFamily;
  radius: number; // 圆角，单位 px
}

export const THEME_PRESETS: Record<ThemePresetId, { name: string; settings: ThemeSettings }> = {
  creamGreen: {
    name: '米白绿（默认）',
    settings: {
      presetId: 'creamGreen',
      accentColor: '#D9461F',
      bgColor: '#D4E8E0',
      panelColor: '#FAF7F2',
      inkColor: '#171411',
      density: 'comfortable',
      fontFamily: 'modern',
      radius: 20,
    },
  },
  sakuraPink: {
    name: '樱花粉',
    settings: {
      presetId: 'sakuraPink',
      accentColor: '#E2557A',
      bgColor: '#FBE6E5',
      panelColor: '#FFF7F6',
      inkColor: '#3B1F2A',
      density: 'comfortable',
      fontFamily: 'rounded',
      radius: 22,
    },
  },
  businessBlue: {
    name: '蓝灰商务',
    settings: {
      presetId: 'businessBlue',
      accentColor: '#2A6FB8',
      bgColor: '#E5ECF2',
      panelColor: '#FFFFFF',
      inkColor: '#162133',
      density: 'compact',
      fontFamily: 'modern',
      radius: 14,
    },
  },
  darkInk: {
    name: '暗色',
    settings: {
      presetId: 'darkInk',
      accentColor: '#F2A65A',
      bgColor: '#1B1D24',
      panelColor: '#252834',
      inkColor: '#F2EFE7',
      density: 'comfortable',
      fontFamily: 'modern',
      radius: 18,
    },
  },
};

const STORAGE_KEY = 'app-theme-settings';

export function loadThemeSettings(): ThemeSettings {
  if (typeof window === 'undefined') return THEME_PRESETS.creamGreen.settings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return THEME_PRESETS.creamGreen.settings;
    const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
    return {
      ...THEME_PRESETS.creamGreen.settings,
      ...parsed,
    } as ThemeSettings;
  } catch {
    return THEME_PRESETS.creamGreen.settings;
  }
}

export function saveThemeSettings(settings: ThemeSettings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 忽略写入失败
  }
}

const FONT_FAMILY_MAP: Record<ThemeFontFamily, string> = {
  modern:
    '"Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  rounded:
    '"Nunito", "Quicksand", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
  serif:
    '"Fraunces", "Source Han Serif SC", "Songti SC", Georgia, serif',
  handwriting:
    '"Caveat", "Kalam", "Ma Shan Zheng", "PingFang SC", cursive',
};

const DENSITY_SCALE: Record<ThemeDensity, { spacing: number; fontScale: number }> = {
  compact: { spacing: 0.85, fontScale: 0.95 },
  comfortable: { spacing: 1, fontScale: 1 },
  roomy: { spacing: 1.15, fontScale: 1.05 },
};

export function applyThemeSettings(settings: ThemeSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.style.setProperty('--app-accent', settings.accentColor);
  root.style.setProperty('--app-bg', settings.bgColor);
  root.style.setProperty('--app-panel', settings.panelColor);
  root.style.setProperty('--app-ink', settings.inkColor);
  root.style.setProperty('--app-radius', `${settings.radius}px`);

  const density = DENSITY_SCALE[settings.density];
  root.style.setProperty('--app-density-spacing', String(density.spacing));
  root.style.setProperty('--app-density-font-scale', String(density.fontScale));

  root.style.setProperty('--app-font-family', FONT_FAMILY_MAP[settings.fontFamily]);

  root.dataset.theme = settings.presetId;
  body.dataset.theme = settings.presetId;
  body.style.background = settings.bgColor;
  body.style.color = settings.inkColor;
  body.style.fontFamily = FONT_FAMILY_MAP[settings.fontFamily];
}
