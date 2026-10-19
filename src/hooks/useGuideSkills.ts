import { useCallback, useEffect, useState } from 'react';
import type { GuideSkill, GuideSkillStore, GuideStage } from '../types';
import { createBuiltInGuideSkills } from '../data/guideSkills';

const STORAGE_KEY = 'ht-guide-skills-v1';

// 单个方法论 skill 注入上限 & 单次注入总上限，避免 token 溢出
const MAX_GUIDE_CHARS_PER_SKILL = 4000;
const MAX_GUIDE_CHARS_TOTAL = 12000;

function generateId(): string {
  return `guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 合并内置 skill：保留用户对内置项的启用状态与内容改动，同时补充新版本新增的内置项
function mergeBuiltIns(stored: GuideSkill[]): GuideSkill[] {
  const byId = new Map(stored.map((s) => [s.id, s]));
  const builtIns = createBuiltInGuideSkills().map((builtIn) => {
    const prev = byId.get(builtIn.id);
    if (!prev) return builtIn;
    return { ...builtIn, enabled: prev.enabled };
  });
  const customs = stored.filter((s) => !s.builtIn);
  return [...builtIns, ...customs];
}

function readStore(): GuideSkillStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GuideSkillStore;
      const skills = Array.isArray(parsed.skills) ? parsed.skills : [];
      return { skills: mergeBuiltIns(skills), version: parsed.version || 1 };
    }
  } catch {
    // ignore
  }
  return { skills: createBuiltInGuideSkills(), version: 1 };
}

function writeStore(store: GuideSkillStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function buildGuideSkillContext(skills: GuideSkill[], stage?: GuideStage): string {
  const active = skills.filter((s) => s.enabled && (!stage || s.appliesTo.includes(stage)));
  if (active.length === 0) return '';

  const parts: string[] = [];
  parts.push(`【通用爆文方法论 SKILL（已启用 ${active.length} 个）】`);
  parts.push(
    '以下是平台通用的爆文方法论，作为创作参考依据，用于提升选题、标题和正文的爆款概率。与「当前激活风格 SKILL」冲突时，以风格 SKILL 为准。',
  );

  let total = 0;
  for (const skill of active) {
    let body = skill.content.trim();
    if (body.length > MAX_GUIDE_CHARS_PER_SKILL) {
      body = `${body.slice(0, MAX_GUIDE_CHARS_PER_SKILL)}…（已截断）`;
    }
    if (total + body.length > MAX_GUIDE_CHARS_TOTAL) break;
    total += body.length;
    parts.push(`— 【${skill.name}】${skill.description ? `（${skill.description}）` : ''}\n${body}`);
  }

  return `\n\n${parts.join('\n\n')}\n`;
}

export function useGuideSkills() {
  const [store, setStore] = useState<GuideSkillStore>(() => readStore());

  useEffect(() => {
    writeStore(store);
  }, [store]);

  const buildContext = useCallback(
    (stage?: GuideStage) => buildGuideSkillContext(store.skills, stage),
    [store.skills],
  );

  const toggleSkill = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  }, []);

  const setAllEnabled = useCallback((enabled: boolean) => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => ({ ...s, enabled })),
    }));
  }, []);

  const createSkill = useCallback(
    (data: { name: string; description?: string; content: string; appliesTo?: GuideStage[] }) => {
      const skill: GuideSkill = {
        id: generateId(),
        name: data.name,
        description: data.description || '',
        content: data.content,
        appliesTo: data.appliesTo || ['analyze', 'generate', 'title', 'revise', 'polish'],
        builtIn: false,
        source: '自定义导入',
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      setStore((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
      return skill;
    },
    [],
  );

  const updateSkill = useCallback((id: string, updates: Partial<GuideSkill>) => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id),
    }));
  }, []);

  const resetBuiltIns = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      skills: [...createBuiltInGuideSkills(), ...prev.skills.filter((s) => !s.builtIn)],
    }));
  }, []);

  return {
    skills: store.skills,
    enabledCount: store.skills.filter((s) => s.enabled).length,
    buildContext,
    toggleSkill,
    setAllEnabled,
    createSkill,
    updateSkill,
    deleteSkill,
    resetBuiltIns,
  };
}
