import { useCallback, useEffect, useState } from 'react';
import type { StyleSkill, StyleSkillStore } from '../types';

const STORAGE_KEY = 'ht-style-skills-v1';

function generateId(): string {
  return `skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStore(): StyleSkillStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StyleSkillStore;
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        version: parsed.version || 1,
      };
    }
  } catch {
    // ignore
  }
  return { skills: [], version: 1 };
}

function writeStore(store: StyleSkillStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function buildSkillContext(skill: StyleSkill | null): string {
  if (!skill) return '';

  const parts: string[] = [];

  parts.push(`【当前激活风格 SKILL：${skill.name}】`);
  parts.push(`以下是你必须严格遵守的写作风格规范，优先级高于所有默认规则。`);

  if (skill.titlePattern.trim()) {
    parts.push(`标题模式：${skill.titlePattern.trim()}`);
  }
  if (skill.openingPattern.trim()) {
    parts.push(`开头模式：${skill.openingPattern.trim()}`);
  }
  if (skill.structurePattern.trim()) {
    parts.push(`正文结构：${skill.structurePattern.trim()}`);
  }
  if (skill.toneStyle.trim()) {
    parts.push(`语气风格：${skill.toneStyle.trim()}`);
  }
  if (skill.endingPattern.trim()) {
    parts.push(`结尾模式：${skill.endingPattern.trim()}`);
  }
  if (skill.styleRules.trim()) {
    parts.push(`核心风格规则：${skill.styleRules.trim()}`);
  }
  if (skill.targetLength && skill.targetLength !== 150) {
    parts.push(`正文目标字数：约 ${skill.targetLength} 字`);
  }
  if (skill.requiredTags.length) {
    parts.push(`必带标签：${skill.requiredTags.join(' ')}`);
  }
  if (skill.forbiddenTags.length) {
    parts.push(`禁用标签：${skill.forbiddenTags.join(' ')}`);
  }
  if (skill.friendPersona.trim()) {
    parts.push(`外国朋友人设：${skill.friendPersona.trim()}`);
  }
  if (skill.globalInstruction.trim()) {
    parts.push(`全局附加指令：${skill.globalInstruction.trim()}`);
  }
  if (skill.samples.length) {
    parts.push(`参考爆文样本（学习其风格韵律，不要照搬内容）：\n${skill.samples.map((s, i) => `【样本${i + 1}】${s}`).join('\n')}`);
  }

  parts.push(`以上 SKILL 规则必须严格执行，直接决定输出风格。`);

  return `\n\n${parts.join('\n\n')}\n`;
}

export function useStyleSkills() {
  const [store, setStore] = useState<StyleSkillStore>(() => readStore());

  useEffect(() => {
    writeStore(store);
  }, [store]);

  const activeSkill = store.skills.find((s) => s.active) || null;
  const skillContext = activeSkill ? buildSkillContext(activeSkill) : '';

  const createSkill = useCallback((data: Partial<StyleSkill> & { name: string }) => {
    const now = new Date().toISOString();
    const newSkill: StyleSkill = {
      id: generateId(),
      name: data.name,
      description: data.description || '',
      styleRules: data.styleRules || '',
      titlePattern: data.titlePattern || '',
      openingPattern: data.openingPattern || '',
      structurePattern: data.structurePattern || '',
      toneStyle: data.toneStyle || '',
      endingPattern: data.endingPattern || '',
      requiredTags: data.requiredTags || [],
      forbiddenTags: data.forbiddenTags || [],
      targetLength: data.targetLength || 150,
      samples: data.samples || [],
      globalInstruction: data.globalInstruction || '',
      friendPersona: data.friendPersona || '',
      active: false,
      createdAt: now,
      updatedAt: now,
    };
    setStore((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
    return newSkill;
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<StyleSkill>) => {
    const now = new Date().toISOString();
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: now } : s,
      ),
    }));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id),
    }));
  }, []);

  const activateSkill = useCallback((id: string) => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => ({ ...s, active: s.id === id })),
    }));
  }, []);

  const deactivateSkill = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => ({ ...s, active: false })),
    }));
  }, []);

  const duplicateSkill = useCallback((id: string) => {
    const skill = store.skills.find((s) => s.id === id);
    if (!skill) return;
    const now = new Date().toISOString();
    const newSkill: StyleSkill = {
      ...skill,
      id: generateId(),
      name: `${skill.name}（副本）`,
      active: false,
      createdAt: now,
      updatedAt: now,
    };
    setStore((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
    return newSkill;
  }, [store.skills]);

  return {
    skills: store.skills,
    activeSkill,
    skillContext,
    createSkill,
    updateSkill,
    deleteSkill,
    activateSkill,
    deactivateSkill,
    duplicateSkill,
  };
}
