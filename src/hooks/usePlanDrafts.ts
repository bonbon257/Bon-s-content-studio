import { useCallback, useEffect, useState } from 'react';
import type { PlanDraft } from '../types';

// 选题草稿：策划台的资产，每个选题从角度、策划案到正文全程留痕
const KEY = 'ht-plan-drafts';

function loadDrafts(): PlanDraft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function usePlanDrafts() {
  const [drafts, setDrafts] = useState<PlanDraft[]>(loadDrafts);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(drafts));
    } catch {
      // ignore
    }
  }, [drafts]);

  const upsertDraft = useCallback((draft: PlanDraft) => {
    setDrafts((prev) => {
      const exists = prev.some((item) => item.id === draft.id);
      const next = exists ? prev.map((item) => (item.id === draft.id ? draft : item)) : [draft, ...prev];
      return [...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }, []);

  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { drafts, upsertDraft, removeDraft };
}
