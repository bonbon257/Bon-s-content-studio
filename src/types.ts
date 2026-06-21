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

export interface ResearchHistoryRecord {
  id: string;
  topic: string;
  result: ResearchResult;
  createdAt: string;
}
