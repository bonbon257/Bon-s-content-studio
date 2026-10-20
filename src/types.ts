export type Country =
  | '美国'
  | '英国'
  | '日本'
  | '韩国'
  | '德国'
  | '法国'
  | '西班牙'
  | '意大利'
  | '俄罗斯'
  | '泰国'
  | '巴西'
  | '马来西亚'
  | '新加坡';

export type Platform = '小红书' | '抖音';

export type Scene = 'article' | 'topic';

export type AppView = 'create' | 'history' | 'research';

export interface Angle {
  id: number;
  title: string;
  description: string;
}

export interface ChatRow {
  target: '中国用户' | '外国用户' | string;
  chinese: string;
  foreign: string;
}

export type FactCheckLevel = 'confirmed' | 'uncertain' | 'softened';

export interface FactCheckItem {
  level: FactCheckLevel;
  claim: string;
  note: string;
}

export interface GenerationResult {
  title: string;
  post: string;
  tags: string[];
  chat: ChatRow[];
  factChecks?: FactCheckItem[];
  reasoning?: string;
}

export interface AppRecommendationResult {
  title: string;
  post: string;
  tags: string[];
  forbiddenHits?: string[];
}

export interface ContentRevisionResult {
  title: string;
  post: string;
  tags: string[];
  factChecks?: FactCheckItem[];
  forbiddenHits?: string[];
  changes?: string[];
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  chatApiKey?: string;
  chatBaseUrl?: string;
  chatModel?: string;
}

export interface HistoryRecord {
  id: string;
  country: Country;
  topic: string;
  article: string;
  platform: Platform;
  angle: string;
  scene: Scene;
  title: string;
  post: string;
  tags: string[];
  chat: ChatRow[];
  factChecks?: FactCheckItem[];
  createdAt: string;
}

export interface PolishResult {
  polished: string;
  changes: string[];
}

export interface ResearchAngleSuggestion {
  title: string;
  description: string;
}

export interface ResearchResult {
  topic: string;
  concept: string;
  facts: string[];
  misconceptions: string[];
  angles: ResearchAngleSuggestion[];
  related: string[];
  freshnessNote: string;
}

export interface GeneratedContentResearchResult {
  summary: string;
  angles: string[];
  risks: string[];
  insertableLines: string[];
}

export interface ResearchHistoryRecord {
  id: string;
  topic: string;
  result: ResearchResult;
  createdAt: string;
}

export interface AutoLearnedPreferences {
  countryFrequency: Record<string, number>;
  platformFrequency: Record<string, number>;
  angleKeywords: Record<string, number>;
  instructionKeywords: Record<string, number>;
  tagAdditions: Record<string, number>;
  tagRemovals: Record<string, number>;
  avgLengthDelta: number;
  lengthSampleCount: number;
  polishDirections: Record<string, number>;
  lastUpdated: string;
}

export interface ManualPreferences {
  writingStyle: string;
  targetLength: number;
  requiredTags: string[];
  forbiddenTags: string[];
  anglePreference: string;
  globalInstruction: string;
  friendPersona: string;
}

export interface UserPreferences {
  auto: AutoLearnedPreferences;
  manual: ManualPreferences;
  version: number;
}

// 风格 SKILL —— 从爆文中提炼的完整写作风格模板
export interface StyleSkill {
  id: string;
  name: string;
  description: string;
  // 风格规则（高权重注入）
  styleRules: string;
  // 标题模式
  titlePattern: string;
  // 开头模式
  openingPattern: string;
  // 正文结构
  structurePattern: string;
  // 语气风格
  toneStyle: string;
  // 结尾模式
  endingPattern: string;
  // 必带标签
  requiredTags: string[];
  // 禁用标签
  forbiddenTags: string[];
  // 目标字数
  targetLength: number;
  // 参考爆文样本
  samples: string[];
  // 全局附加指令
  globalInstruction: string;
  // 外国朋友人设
  friendPersona: string;
  // 是否为当前激活的 SKILL
  active: boolean;
  // 创建时间
  createdAt: string;
  // 更新时间
  updatedAt: string;
}

export interface StyleSkillStore {
  skills: StyleSkill[];
  version: number;
}

// 聊天记录风格 SKILL —— 专门控制对话生成的风格、人设、节奏
export interface ChatStyleSkill {
  id: string;
  name: string;
  description: string;
  // 对话轮数偏好
  roundCount: number;
  // 中国用户人设
  chinesePersona: string;
  // 外国用户人设（通用，会结合具体国家调整）
  foreignPersona: string;
  // 对话节奏
  pace: string;
  // 开场方式
  openingStyle: string;
  // 追问模式
  followUpStyle: string;
  // 语气风格
  toneStyle: string;
  // 语言难度（简单日常/地道表达/深度讨论）
  languageLevel: string;
  // 核心对话规则
  chatRules: string;
  // 常用表达/口头禅
  commonPhrases: string;
  // 参考聊天样本
  samples: string[];
  // 全局附加指令
  globalInstruction: string;
  // 是否激活
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatStyleSkillStore {
  skills: ChatStyleSkill[];
  version: number;
}

// 通用爆文方法论 SKILL —— 从插件市场引入的"方法论文档"型 skill
// 与 StyleSkill（从自己爆文提炼的风格模板）并列，可同时启用多个
export type GuideStage = 'analyze' | 'generate' | 'title' | 'revise' | 'polish';

export interface GuideSkill {
  id: string;
  name: string;
  description: string;
  // SKILL.md 原文（去掉 frontmatter）
  content: string;
  // 该 skill 适用于哪些生成环节
  appliesTo: GuideStage[];
  // 是否内置（来自插件市场打包）
  builtIn: boolean;
  // 来源说明 / 作者
  source: string;
  // 是否启用（可多选）
  enabled: boolean;
  createdAt: string;
}

export interface GuideSkillStore {
  skills: GuideSkill[];
  version: number;
}
