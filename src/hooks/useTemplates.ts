import { useEffect, useState } from 'react';
import type { ContentTemplate } from '../types';

const STORAGE_KEY = 'ht-content-templates';

function loadTemplates(): ContentTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.templates) ? parsed.templates : [];
  } catch {
    return [];
  }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<ContentTemplate[]>(() => loadTemplates());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ templates, version: 1 }));
    } catch {
      // 本地存储失败时忽略，不影响当前会话使用
    }
  }, [templates]);

  function addTemplate(input: Omit<ContentTemplate, 'id' | 'createdAt'>) {
    const template: ContentTemplate = {
      ...input,
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => [template, ...prev].slice(0, 30));
    return template;
  }

  function removeTemplate(id: string) {
    setTemplates((prev) => prev.filter((item) => item.id !== id));
  }

  return { templates, addTemplate, removeTemplate };
}
