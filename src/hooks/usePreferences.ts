import { useMemo, useState } from 'react';
import type { AutoLearnedPreferences, ManualPreferences, UserPreferences } from '../types';

const PREFERENCES_KEY = 'ht-user-preferences-v1';

const DEFAULT_MANUAL: ManualPreferences = {
  writingStyle: '',
  targetLength: 150,
  requiredTags: [],
  forbiddenTags: [],
  anglePreference: '',
  globalInstruction: '',
  friendPersona: '',
};

const DEFAULT_AUTO: AutoLearnedPreferences = {
  countryFrequency: {},
  platformFrequency: {},
  angleKeywords: {},
  instructionKeywords: {},
  tagAdditions: {},
  tagRemovals: {},
  avgLengthDelta: 0,
  lengthSampleCount: 0,
  polishDirections: {},
  lastUpdated: new Date().toISOString(),
};

function readPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserPreferences;
      return {
        auto: { ...DEFAULT_AUTO, ...parsed.auto },
        manual: { ...DEFAULT_MANUAL, ...parsed.manual },
        version: parsed.version || 1,
      };
    }
  } catch {
    // ignore
  }
  return {
    auto: { ...DEFAULT_AUTO },
    manual: { ...DEFAULT_MANUAL },
    version: 1,
  };
}

function writePreferences(prefs: UserPreferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

function getTopItems(record: Record<string, number>, limit: number): string[] {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    '的', '了', '和', '是', '在', '我', '有', '个', '不', '这', '为', '之', '与', '及',
    '把', '被', '让', '给', '向', '到', '从', '对', '将', '把', '让', '给', '向', '到',
    '从', '对', '将', '把', '让', '给', '向', '到', '从', '对', '将',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if',
    'because', 'although', 'though', 'while', 'where', 'when', 'that',
    'which', 'who', 'whom', 'whose', 'what', 'whatever', 'whoever',
    'whomever', 'whichever', 'this', 'these', 'those', 'it', 'its',
    'they', 'them', 'their', 'theirs', 'themselves', 'he', 'him', 'his',
    'himself', 'she', 'her', 'hers', 'herself', 'we', 'us', 'our',
    'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'i', 'me', 'my', 'mine', 'myself', 'one', 'ones', 'oneself',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));
}

export function buildPreferenceContext(prefs: UserPreferences): string {
  const parts: string[] = [];

  // 手动规则（高优先级）
  if (prefs.manual.writingStyle.trim()) {
    parts.push(`用户写作风格偏好：${prefs.manual.writingStyle.trim()}`);
  }
  if (prefs.manual.targetLength && prefs.manual.targetLength !== 150) {
    parts.push(`用户偏好正文长度：约 ${prefs.manual.targetLength} 字`);
  }
  if (prefs.manual.requiredTags.length) {
    parts.push(`用户必带标签：${prefs.manual.requiredTags.join(' ')}`);
  }
  if (prefs.manual.forbiddenTags.length) {
    parts.push(`用户禁用标签：${prefs.manual.forbiddenTags.join(' ')}`);
  }
  if (prefs.manual.anglePreference.trim()) {
    parts.push(`用户角度偏好：${prefs.manual.anglePreference.trim()}`);
  }
  if (prefs.manual.globalInstruction.trim()) {
    parts.push(`用户全局指令：${prefs.manual.globalInstruction.trim()}`);
  }
  if (prefs.manual.friendPersona.trim()) {
    parts.push(`用户偏好的外国朋友人设：${prefs.manual.friendPersona.trim()}`);
  }

  // 自动学习（低优先级，作为参考）
  const topCountries = getTopItems(prefs.auto.countryFrequency, 3);
  if (topCountries.length) {
    parts.push(`用户常用国家（自动学习）：${topCountries.join('、')}`);
  }

  const topPlatforms = getTopItems(prefs.auto.platformFrequency, 2);
  if (topPlatforms.length) {
    parts.push(`用户常用平台（自动学习）：${topPlatforms.join('、')}`);
  }

  const topAngleKeywords = getTopItems(prefs.auto.angleKeywords, 5);
  if (topAngleKeywords.length) {
    parts.push(`用户偏好的角度关键词（自动学习）：${topAngleKeywords.join('、')}`);
  }

  const topInstructions = getTopItems(prefs.auto.instructionKeywords, 5);
  if (topInstructions.length) {
    parts.push(`用户常见修改方向（自动学习）：${topInstructions.join('、')}`);
  }

  if (prefs.auto.avgLengthDelta !== 0 && prefs.auto.lengthSampleCount >= 3) {
    const direction = prefs.auto.avgLengthDelta < 0 ? '偏短' : '偏长';
    parts.push(
      `用户正文长度倾向（自动学习）：生成后倾向于改${direction}约 ${Math.abs(Math.round(prefs.auto.avgLengthDelta))} 字`,
    );
  }

  const topTagAdditions = getTopItems(prefs.auto.tagAdditions, 3);
  if (topTagAdditions.length) {
    parts.push(`用户常添加的标签（自动学习）：${topTagAdditions.join('、')}`);
  }

  const topTagRemovals = getTopItems(prefs.auto.tagRemovals, 3);
  if (topTagRemovals.length) {
    parts.push(`用户常删除的标签（自动学习）：${topTagRemovals.join('、')}`);
  }

  return parts.length
    ? `\n\n【用户偏好记忆】\n${parts.join('\n')}\n\n以上偏好仅供参考，不要僵化执行，核心仍是生成高质量、有真人感的内容。`
    : '';
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => readPreferences());

  function saveManual(manual: Partial<ManualPreferences>) {
    setPrefs((prev) => {
      const next: UserPreferences = {
        ...prev,
        manual: { ...prev.manual, ...manual },
      };
      writePreferences(next);
      return next;
    });
  }

  function resetManual() {
    setPrefs((prev) => {
      const next: UserPreferences = {
        ...prev,
        manual: { ...DEFAULT_MANUAL },
      };
      writePreferences(next);
      return next;
    });
  }

  function resetAuto() {
    setPrefs((prev) => {
      const next: UserPreferences = {
        ...prev,
        auto: { ...DEFAULT_AUTO },
      };
      writePreferences(next);
      return next;
    });
  }

  function learnFromGeneration(params: {
    country: string;
    platform: string;
    angleTitle: string;
    generatedPost: string;
    finalPost: string;
    generatedTags: string[];
    finalTags: string[];
  }) {
    setPrefs((prev) => {
      const auto = { ...prev.auto };

      // Country
      auto.countryFrequency = {
        ...auto.countryFrequency,
        [params.country]: (auto.countryFrequency[params.country] || 0) + 1,
      };

      // Platform
      auto.platformFrequency = {
        ...auto.platformFrequency,
        [params.platform]: (auto.platformFrequency[params.platform] || 0) + 1,
      };

      // Angle keywords
      const angleKeywords = extractKeywords(params.angleTitle);
      for (const kw of angleKeywords) {
        auto.angleKeywords = {
          ...auto.angleKeywords,
          [kw]: (auto.angleKeywords[kw] || 0) + 1,
        };
      }

      // Length delta
      const generatedLen = params.generatedPost.replace(/[\s\p{P}\p{S}]/gu, '').length;
      const finalLen = params.finalPost.replace(/[\s\p{P}\p{S}]/gu, '').length;
      const delta = finalLen - generatedLen;
      const newCount = auto.lengthSampleCount + 1;
      auto.avgLengthDelta = (auto.avgLengthDelta * auto.lengthSampleCount + delta) / newCount;
      auto.lengthSampleCount = newCount;

      // Tag changes
      const genSet = new Set(params.generatedTags.map((t) => t.toLowerCase()));
      const finalSet = new Set(params.finalTags.map((t) => t.toLowerCase()));

      for (const tag of params.finalTags) {
        if (!genSet.has(tag.toLowerCase())) {
          auto.tagAdditions = {
            ...auto.tagAdditions,
            [tag]: (auto.tagAdditions[tag] || 0) + 1,
          };
        }
      }

      for (const tag of params.generatedTags) {
        if (!finalSet.has(tag.toLowerCase())) {
          auto.tagRemovals = {
            ...auto.tagRemovals,
            [tag]: (auto.tagRemovals[tag] || 0) + 1,
          };
        }
      }

      auto.lastUpdated = new Date().toISOString();

      const next: UserPreferences = { ...prev, auto };
      writePreferences(next);
      return next;
    });
  }

  function learnFromInstruction(instruction: string) {
    if (!instruction.trim()) return;
    setPrefs((prev) => {
      const keywords = extractKeywords(instruction);
      const auto = { ...prev.auto };
      for (const kw of keywords) {
        auto.instructionKeywords = {
          ...auto.instructionKeywords,
          [kw]: (auto.instructionKeywords[kw] || 0) + 1,
        };
      }
      auto.lastUpdated = new Date().toISOString();
      const next: UserPreferences = { ...prev, auto };
      writePreferences(next);
      return next;
    });
  }

  function learnFromPolish(field: 'title' | 'post') {
    setPrefs((prev) => {
      const auto = { ...prev.auto };
      const direction = field === 'title' ? '润色标题' : '润色正文';
      auto.polishDirections = {
        ...auto.polishDirections,
        [direction]: (auto.polishDirections[direction] || 0) + 1,
      };
      auto.lastUpdated = new Date().toISOString();
      const next: UserPreferences = { ...prev, auto };
      writePreferences(next);
      return next;
    });
  }

  const contextString = useMemo(() => buildPreferenceContext(prefs), [prefs]);

  return {
    prefs,
    contextString,
    saveManual,
    resetManual,
    resetAuto,
    learnFromGeneration,
    learnFromInstruction,
    learnFromPolish,
  };
}
