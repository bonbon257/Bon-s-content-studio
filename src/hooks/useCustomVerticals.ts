import { useEffect, useState } from 'react';
import type { VerticalConfig } from '../types';

const STORAGE_KEY = 'ht-custom-verticals';

function loadVerticals(): VerticalConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.verticals) ? parsed.verticals : [];
  } catch {
    return [];
  }
}

// 自定义赛道：只存用户自己新建的，内置赛道始终来自 config/verticals.ts
export function useCustomVerticals() {
  const [verticals, setVerticals] = useState<VerticalConfig[]>(() => loadVerticals());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ verticals, version: 1 }));
    } catch {
      // 忽略本地存储失败
    }
  }, [verticals]);

  function addVertical(input: Omit<VerticalConfig, 'builtIn'>) {
    const vertical: VerticalConfig = { ...input, builtIn: false };
    setVerticals((prev) => [...prev, vertical]);
    return vertical;
  }

  function removeVertical(id: string) {
    setVerticals((prev) => prev.filter((item) => item.id !== id));
  }

  return { verticals, addVertical, removeVertical };
}
