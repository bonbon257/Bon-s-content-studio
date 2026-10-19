import type { GuideSkill, GuideStage } from '../types';

// 内置通用爆文方法论 Skill
// 内容来自 TRAE 插件市场「小红书内容创作技能包」(xhs-content-skills v1.0.0)
// 作者：尹稚（止戈）/ YinZhi（Zhige），License: MIT
// 打包进生成器后无需 Trae 运行时，直接作为提示词上下文注入。

import contentStrategyEngine from './guide-skills/content-strategy-engine.md?raw';
import contentScorer from './guide-skills/content-scorer.md?raw';
import xhsComplianceCheck from './guide-skills/xhs-compliance-check.md?raw';
import xhsContentWriter from './guide-skills/xhs-content-writer.md?raw';
import xhsCoverStrategy from './guide-skills/xhs-cover-strategy.md?raw';
import xhsHumanizer from './guide-skills/xhs-humanizer.md?raw';
import xhsPublishEngine from './guide-skills/xhs-publish-engine.md?raw';
import xhsTitleAnalyzer from './guide-skills/xhs-title-analyzer.md?raw';
import xhsTopicPlanner from './guide-skills/xhs-topic-planner.md?raw';

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

interface GuideSkillSeed {
  id: string;
  name: string;
  description: string;
  raw: string;
  appliesTo: GuideStage[];
  enabled: boolean;
}

const SEEDS: GuideSkillSeed[] = [
  {
    id: 'builtin-content-strategy-engine',
    name: '内容策略引擎',
    description: '总控：协调选题→写作→封面→诊断→合规→去痕→评分→发布的完整流程',
    raw: contentStrategyEngine,
    appliesTo: ['analyze', 'generate'],
    enabled: false,
  },
  {
    id: 'builtin-xhs-topic-planner',
    name: '选题策划',
    description: '选题三问+五类方向+关键词公式+笔记简报模板+30天选题矩阵',
    raw: xhsTopicPlanner,
    appliesTo: ['analyze'],
    enabled: true,
  },
  {
    id: 'builtin-xhs-content-writer',
    name: '标题+正文写作',
    description: '5条硬约束+废词黑名单+8种标题公式+3种正文模板+硬信息注入法则',
    raw: xhsContentWriter,
    appliesTo: ['generate'],
    enabled: true,
  },
  {
    id: 'builtin-xhs-cover-strategy',
    name: '封面策略',
    description: '3原则+4种封面类型+封面文字检查清单+素材分级与改造法',
    raw: xhsCoverStrategy,
    appliesTo: ['generate', 'title'],
    enabled: false,
  },
  {
    id: 'builtin-xhs-title-analyzer',
    name: '标题诊断',
    description: '五维诊断标题（清晰度/痛点/搜索词/情绪钩子/利益承诺），<70分给重写建议',
    raw: xhsTitleAnalyzer,
    appliesTo: ['title'],
    enabled: false,
  },
  {
    id: 'builtin-xhs-compliance-check',
    name: '合规审查',
    description: '扫描 CTA 黑名单、四种诱导互动与敏感词，命中红线直接拦截',
    raw: xhsComplianceCheck,
    appliesTo: ['generate', 'revise'],
    enabled: false,
  },
  {
    id: 'builtin-xhs-humanizer',
    name: '去 AI 痕迹',
    description: '检查句子结构、段落节奏、AI 高频词与 emoji 密度，让内容更像真人',
    raw: xhsHumanizer,
    appliesTo: ['revise', 'polish'],
    enabled: false,
  },
  {
    id: 'builtin-content-scorer',
    name: '内容评分卡',
    description: '格式类型判定、质量快检（≥7项才发）、CES 预估与关键词验证',
    raw: contentScorer,
    appliesTo: ['revise'],
    enabled: false,
  },
  {
    id: 'builtin-xhs-publish-engine',
    name: '发布+冷启动',
    description: '10项发布前自查+冷启动30分钟SOP+8大赛道速查',
    raw: xhsPublishEngine,
    appliesTo: ['revise'],
    enabled: false,
  },
];

export const GUIDE_STAGE_LABELS: Record<GuideStage, string> = {
  analyze: '选题分析',
  generate: '正文生成',
  title: '标题生成',
  revise: '按方向改写',
  polish: '润色',
};

export function createBuiltInGuideSkills(): GuideSkill[] {
  return SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    description: seed.description,
    content: stripFrontmatter(seed.raw),
    appliesTo: seed.appliesTo,
    builtIn: true,
    source: '插件市场 xhs-content-skills v1.0.0 · MIT',
    enabled: seed.enabled,
    createdAt: new Date().toISOString(),
  }));
}
