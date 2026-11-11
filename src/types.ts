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

export type Platform = '小红书' | '抖音' | '公众号';

export type Scene = 'article' | 'topic';

export type AppView = 'create' | 'history' | 'research';

// ===================== 通用内容种草生成器 =====================
// 底座从「文化差异改写器」抽象成可扩展的种草生成器：
// 平台 × 赛道 × 入口方式 三个维度都由配置驱动，不再写死在代码里。

// 创作入口：
// - idea：先给一个想法/产品，再产出选题方向与内容
// - reference：先给一篇别人的爆款，拆解后生成去重新文 / 可复用模板
export type EntryMode = 'idea' | 'reference';

export type VerticalId = string;

// 参考样例的使用方式：
// - structure-only：只学结构、节奏、开头钩子，内容必须基于 brief 重写
// - rewrite-allowed：允许适度沿用参考样例的表达方式
export type ReferenceMode = 'structure-only' | 'rewrite-allowed';

export interface BriefField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

// 用户创作简报：一个 idea + 参考样例 + 自己的补充信息
export interface Brief {
  entryMode: EntryMode;
  vertical: VerticalId;
  idea: string;
  references: string[];
  referenceMode: ReferenceMode;
  myNotes: string;
  // 赛道结构化字段，键对应 VerticalConfig.briefFields[].key
  fields: Record<string, string>;
}

export interface VerticalConfig {
  id: VerticalId;
  name: string;
  tagline: string;
  // 是否为内置赛道（内置不可删除）
  builtIn?: boolean;
  // 赛道专属输入项（如目的地、天数、预算）
  briefFields: BriefField[];
  // 切换赛道时参考模式的默认值
  referenceModeDefault: ReferenceMode;
  // 角度分析规则
  angleStrategy: string;
  // 正文写法规则
  bodyGuidance: string;
  // 标签规则
  tagGuidance: string;
  // 质检时的赛道专项检查项
  reviewRubric: string;
  // 是否沿用「国家 / 目标外语」维度（仅文化差异赛道需要）
  useCountryDimension: boolean;
}

// 平台写法配置：同一篇内容发小红书/抖音/公众号，规则完全不同
export interface PlatformConfig {
  id: Platform;
  name: string;
  titleRule: string;
  bodyRule: string;
  tagRule: string;
  // 平台特有的格式要求（是否分段、是否用 emoji、是否带话题等）
  formatRule: string;
}

// 参考爆文拆解结果
export interface ReferenceDeconstruction {
  // 标题公式
  titleFormula: string;
  // 开头钩子
  openingHook: string;
  // 段落结构骨架
  structure: string[];
  // 情绪触发点
  emotionalTriggers: string[];
  // 语气与表达风格
  toneStyle: string;
  // 结尾 / 互动引导方式
  cta: string;
  // 可复用的写作模板
  reusableTemplate: string;
  // 去重改写建议
  dedupeTips: string[];
}

export interface ContentTemplate {
  id: string;
  name: string;
  vertical: VerticalId;
  platform: Platform;
  deconstruction: ReferenceDeconstruction;
  createdAt: string;
}

export interface TemplateStore {
  templates: ContentTemplate[];
  version: number;
}

export interface Angle {
  id: number;
  title: string;
  description: string;
  // 以下为「情绪种草」增强字段（通用入口产出，旧流程可以不填）
  audience?: string;
  emotionHook?: string;
  whyViral?: string;
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

// 单个方法论 SKILL 的审查结果
export interface SkillReviewResult {
  skillId: string;
  skillName: string;
  score: number; // 0-10
  status: 'pass' | 'warning' | 'fail';
  summary: string;
  items: {
    name: string;
    pass: boolean;
    detail: string;
  }[];
  suggestions: string[];
}

// 完整的内容审查报告
export interface ContentReviewReport {
  overallScore: number;
  overallStatus: 'pass' | 'warning' | 'fail';
  reviews: SkillReviewResult[];
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

// 风格 SKILL 可应用的功能模块（同一模块同时只生效一个）
export type StyleSkillModule = 'article' | 'app';

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
  // 该 SKILL 当前生效的功能模块（每个模块同时只认一个）
  appliesTo?: StyleSkillModule[];
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
