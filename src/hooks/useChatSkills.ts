import { useCallback, useEffect, useState } from 'react';
import type { ChatStyleSkill, ChatStyleSkillStore } from '../types';

const STORAGE_KEY = 'ht-chat-style-skills-v1';

function generateId(): string {
  return `chat-skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStore(): ChatStyleSkillStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatStyleSkillStore;
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

function writeStore(store: ChatStyleSkillStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function buildChatSkillContext(skill: ChatStyleSkill | null): string {
  if (!skill) return '';

  const parts: string[] = [];

  parts.push(`【当前激活聊天风格 SKILL：${skill.name}】`);
  parts.push(`以下是你必须严格遵守的聊天对话风格规范，优先级高于所有默认聊天规则。`);

  if (skill.roundCount && skill.roundCount !== 10) {
    parts.push(`对话轮数：约 ${skill.roundCount} 轮`);
  }
  if (skill.chinesePersona.trim()) {
    parts.push(`中国用户人设：${skill.chinesePersona.trim()}`);
  }
  if (skill.foreignPersona.trim()) {
    parts.push(`外国用户人设：${skill.foreignPersona.trim()}`);
  }
  if (skill.pace.trim()) {
    parts.push(`对话节奏：${skill.pace.trim()}`);
  }
  if (skill.openingStyle.trim()) {
    parts.push(`开场方式：${skill.openingStyle.trim()}`);
  }
  if (skill.followUpStyle.trim()) {
    parts.push(`追问模式：${skill.followUpStyle.trim()}`);
  }
  if (skill.toneStyle.trim()) {
    parts.push(`语气风格：${skill.toneStyle.trim()}`);
  }
  if (skill.languageLevel.trim()) {
    parts.push(`语言难度：${skill.languageLevel.trim()}`);
  }
  if (skill.chatRules.trim()) {
    parts.push(`核心对话规则：${skill.chatRules.trim()}`);
  }
  if (skill.commonPhrases.trim()) {
    parts.push(`常用表达/口头禅：${skill.commonPhrases.trim()}`);
  }
  if (skill.globalInstruction.trim()) {
    parts.push(`全局附加指令：${skill.globalInstruction.trim()}`);
  }
  if (skill.samples.length) {
    parts.push(`参考聊天样本（学习其对话节奏和语气，不要照搬内容）：\n${skill.samples.map((s, i) => `【样本${i + 1}】${s}`).join('\n')}`);
  }

  parts.push(`以上聊天 SKILL 规则必须严格执行，直接决定对话风格和人物设定。`);

  return `\n\n${parts.join('\n\n')}\n`;
}

export function useChatSkills() {
  const [store, setStore] = useState<ChatStyleSkillStore>(() => readStore());

  useEffect(() => {
    writeStore(store);
  }, [store]);

  const activeSkill = store.skills.find((s) => s.active) || null;
  const skillContext = activeSkill ? buildChatSkillContext(activeSkill) : '';

  const createSkill = useCallback((data: Partial<ChatStyleSkill> & { name: string }) => {
    const now = new Date().toISOString();
    const newSkill: ChatStyleSkill = {
      id: generateId(),
      name: data.name,
      description: data.description || '',
      roundCount: data.roundCount || 10,
      chinesePersona: data.chinesePersona || '',
      foreignPersona: data.foreignPersona || '',
      pace: data.pace || '',
      openingStyle: data.openingStyle || '',
      followUpStyle: data.followUpStyle || '',
      toneStyle: data.toneStyle || '',
      languageLevel: data.languageLevel || '',
      chatRules: data.chatRules || '',
      commonPhrases: data.commonPhrases || '',
      samples: data.samples || [],
      globalInstruction: data.globalInstruction || '',
      active: false,
      createdAt: now,
      updatedAt: now,
    };
    setStore((prev) => ({ ...prev, skills: [...prev.skills, newSkill] }));
    return newSkill;
  }, []);

  const updateSkill = useCallback((id: string, updates: Partial<ChatStyleSkill>) => {
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
    const newSkill: ChatStyleSkill = {
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
