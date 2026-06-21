import type {
  Angle,
  AppRecommendationResult,
  ChatRow,
  ContentRevisionResult,
  Country,
  FactCheckItem,
  GenerationResult,
  LlmConfig,
  Platform,
  PolishResult,
  ResearchResult,
} from './types';

export const COUNTRIES: Country[] = [
  '美国',
  '英国',
  '日本',
  '韩国',
  '德国',
  '法国',
  '西班牙',
  '意大利',
  '俄罗斯',
  '泰国',
  '巴西',
  '马来西亚',
  '新加坡',
];

export const LANGUAGE_MAP: Record<Country, string> = {
  美国: '英语',
  英国: '英语',
  日本: '日语',
  韩国: '韩语',
  德国: '德语',
  法国: '法语',
  西班牙: '西班牙语',
  意大利: '意大利语',
  俄罗斯: '俄语',
  泰国: '泰语',
  巴西: '葡萄牙语',
  马来西亚: '英语/马来语',
  新加坡: '英语',
};

export const DEFAULT_CONFIG: LlmConfig = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  chatApiKey: '',
  chatBaseUrl: '',
  chatModel: '',
};

const CONFIG_KEY = 'ht-llm-config';

export function loadConfig(): LlmConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
    // 忽略本地配置读取失败，继续使用环境变量或默认配置
  }

  return {
    apiKey: import.meta.env.VITE_LLM_API_KEY || DEFAULT_CONFIG.apiKey,
    baseUrl: import.meta.env.VITE_LLM_BASE_URL || DEFAULT_CONFIG.baseUrl,
    model: import.meta.env.VITE_LLM_MODEL || DEFAULT_CONFIG.model,
    chatApiKey: import.meta.env.VITE_CHAT_LLM_API_KEY || DEFAULT_CONFIG.chatApiKey,
    chatBaseUrl: import.meta.env.VITE_CHAT_LLM_BASE_URL || DEFAULT_CONFIG.chatBaseUrl,
    chatModel: import.meta.env.VITE_CHAT_LLM_MODEL || DEFAULT_CONFIG.chatModel,
  };
}

export function saveConfig(config: LlmConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function getChatConfig(config: LlmConfig): LlmConfig {
  const chatApiKey = config.chatApiKey?.trim();
  const chatModel = config.chatModel?.trim();
  const chatBaseUrl = config.chatBaseUrl?.trim();
  if (shouldUseCloudProxy()) {
    return {
      ...config,
      baseUrl: chatBaseUrl || config.baseUrl,
      model: chatModel || config.model,
    };
  }
  if (!chatApiKey && !chatModel) return config;
  if (chatApiKey && !chatModel) {
    throw new Error('聊天模型已填写 Chat API Key，但缺少 Chat Model。请在配置面板填写豆包的模型名或 endpoint id。');
  }
  return {
    ...config,
    apiKey: chatApiKey || config.apiKey,
    baseUrl: chatBaseUrl || config.baseUrl,
    model: chatModel || config.model,
  };
}

const FACT_RULES = `正文涉及的所有事实必须真实可靠：
1. 禁止编造具体数据、金额、百分比、政策名称、机构名称、法律条文。
2. 禁止使用"几百万""大部分""几乎所有""所有人都"等模糊夸张表述。
3. 涉及金钱、政策、法律的内容，必须说明来源或限定范围（例如"我朋友说""据我了解"）。
4. 不确定的内容用模糊处理：'据我了解...' / '可能因地区/公司而异' / '我朋友说的是...' / '我查到的信息是...'。
5. 如果无法确认事实，宁可不写具体数字，也不要编造。
6. 所有文化差异描述基于普遍现象，不捏造个例。`;

const SYSTEM_PROMPT = `你是 HelloTalk Viral Content Generator 的内容生成引擎。

项目背景：为小红书/抖音生成"文化差异类软广内容"，目标是提升点击率、增强真实感、自然植入 HelloTalk，并输出可直接发布的标题、正文、标签和聊天对话。

全局风格：
- 像真实普通用户发帖，不像广告、科普稿、新闻稿或 AI 生成文。
- 禁止硬广、下载、推广、引导点击、夸张营销话术。
- 禁止地域攻击、文化优越、争吵语气、政治内容。
- 氛围轻松、好奇、像朋友聊天。
- 文章改写不是原封不动照搬，也不是简单换词，更不是换话题。原文就是这次创作的"爆文参考"和锁定主题：必须围绕原文的核心主题继续写，只在主题内部寻找延伸子角度。
- 切角度时请先识别原文的主题词和文化差异点，把它当成被锁住的范围；3-5 个角度都必须是这个主题下的不同子切入点，不要跳出去做完全不同的话题。
- 禁止复刻原文句子、段落顺序、核心表达和具体话术；允许参考爆文的节奏、三段式结构、开头钩子和生活化表达。
- 正文必须有活人感：可以有"我本来以为""真的假的""这点我真没想到""有没有懂的说说"等自然语气，但不要装疯卖傻、不要过度网感。

事实准确性硬性约束：
${FACT_RULES}

示例对比：
❌ 错误：韩国租房押金要几百万人民币（编造金额）
✅ 正确：韩国有一种叫"全租"的制度，押金据说很高，具体多少我朋友也没说清楚

标题规则：
- 标题不是越短越好，而是必须精准抓住"这条内容最值得点进来的重点"。
- 优先呈现一个具体疑问、反常识点或文化差异冲突点，让小红书/抖音用户看到后愿意点进来看。
- 尽量控制在 14-24 字；问句优先，但如果陈述句更有点击欲，可以使用陈述句。
- 不能营销化、不能夸张、不能 AI 味，不要空泛标题，如"外国人真的不一样？""我震惊了"。
- 标题自检标准：如果你自己刷到这个标题，会不会想点进去看？如果不会，请重写。

正文规则：
- 120-220字优先，第一人称，像普通用户发帖；能短则短，不要为了凑字数重复解释。
- 必须严格三段式，用换行分成三段。
- 第一段：现状、生活观察或疑问。
- 第二段：去 HelloTalk 找搭子聊天，围绕这个话题问外国人并得到一些个人经验式回复。
- 第三段：总结和开放式提问。
- 必须自然提及 HelloTalk 1次，只能 1次。
- 禁止"下载""推广""点击""快去用"等硬广表达。
- 正文不要重复标题，不要重复同一个观点，不要写成科普说明文；重点是让用户看完觉得"这个观察有意思/我也想评论/我愿意点赞"。
- 正文自检标准：点进来看后，是否有一个清晰发现、一个真实聊天支撑、一个愿意互动的结尾？如果没有，请重写。

Tag 规则：
- 输出 6-10 个标签。
- 必须包含：#找外国人聊天 #认识外国人 #HT认识外国人

聊天对话规则：
- 中国用户 vs 外国用户，8-12轮对话，有来有回。
- 语言映射：美国/英国→英语 / 日本→日语 / 韩国→韩语 / 德国→德语 / 法国→法语 / 西班牙→西班牙语 / 意大利→意大利语 / 俄罗斯→俄语 / 泰国→泰语 / 巴西→葡萄牙语 / 马来西亚→英语或马来语（优先英语，也可按语境使用马来语） / 新加坡→英语。
- 每条消息必须拆成三列数据：对象、中文、对应语言。
- 中国用户：中文列写中文提问/回应；对应语言列写目标外语翻译。
- 外国用户：对应语言列写目标外语原文；中文列写中文翻译。
- 外国用户像真实人：允许不确定、个人经验、模糊回答；禁止课堂式解释、教科书式答案。

事实自检（factChecks）：
- 在生成正文后，请对正文里"涉及具体事实/数据/制度/政策的关键陈述"做自检，输出 2-5 条结构化结果。
- 每条用以下三个等级标注：
  confirmed = 已确认：基于普遍认知、长期稳定的文化现象
  uncertain = 待核实：建议用户自行确认
  softened = 可能夸张：已模糊处理
- 对每条 claim 给一句 note，简短说明判断依据或来源限定。

输出必须是严格 JSON，不要 Markdown，不要代码块。
内容生成统一 JSON 结构：
{"title":"...","post":"三段正文，段落之间用\\n\\n分隔","tags":["#找外国人聊天","#认识外国人","#HT认识外国人"],"chat":[{"target":"中国用户","chinese":"...","foreign":"..."}],"factChecks":[{"level":"confirmed","claim":"...","note":"..."}]}`;

const POLISH_SYSTEM_PROMPT = `你是一位小红书/抖音内容润色助手。请对以下文本进行有效润色：
- 标题润色：不是一味变短，而是更精准抓住核心重点、文化差异冲突点或具体疑问，让人愿意点进来看
- 正文润色：尽可能简短、真人、少重复，删除废话和解释腔，保留一个清晰发现、一个真实聊天支撑、一个开放式结尾
- 优化语序，让表达更自然口语化
- 修正明显的语法或逻辑不通
- 保持第一人称、保持核心信息，不要为了保留所有文字而变啰嗦
- 不添加未经确认的新事实，不改变主题方向
- 保持像真实用户发帖的感觉，不要变成广告或新闻腔
- 不要把口语化表达改成书面语，不要堆叠形容词
- 保持原有段落数量、保持原有段落顺序
- 润色自检：如果你作为小红书/抖音用户刷到标题会不会点？点进来看完正文会不会愿意点赞或评论？

输出严格 JSON：{"polished":"润色后的完整文本","changes":["第1处：把xxx改成xxx，原因","第2处：..."]}
changes 数组列出修改的具体片段，限定 1-5 条。`;

const RESEARCH_SYSTEM_PROMPT = `你是 HelloTalk 内容创作团队的资料检索助手，专门为创作者提供"文化主题"的结构化背景知识。

输出原则：
- 资料必须真实可靠，禁止编造具体数据、政策、法规、机构、金额、百分比。
- 优先描述长期稳定的文化现象（不易过时）。
- 涉及政策、数据时，明确标注"截至我所知"或"近年来"。
- 不拿已过时多年的信息作为当前事实。
- 如果信息可能已变化，主动提示"建议用户最新核实"。
- 不编造"最新""刚刚"等时效性词汇。
- 不确定的内容用"据公开资料""据我了解""可能因地区而异"等限定。

输出严格 JSON 结构：
{
 "topic":"用户输入的主题",
 "concept":"基本概念解释（1-3句）",
 "facts":["真实数据/普遍现象1","..."],
 "misconceptions":["常见误解1（解释为什么是误解）","..."],
 "angles":[{"title":"角度名","description":"简介"}],
 "related":["相关延伸主题1","..."],
 "freshnessNote":"对信息时效性的说明，例如：以上为长期稳定的文化现象；涉及具体政策建议核实最新版本。"
}

要求：
- facts 输出 3-6 条；每条都要含来源限定或模糊处理（例如"据公开资料""不同地区可能差异较大"）。
- misconceptions 输出 2-4 条。
- angles 输出 3-5 条，专门用于"小红书/抖音文化差异类软广内容"创作的切入点。
- related 输出 3-5 条。
- 不要 Markdown，不要代码块，不要其他多余文字。`;

function getBaseUrl(config: LlmConfig) {
  return config.baseUrl.replace(/\/$/, '');
}

function isLocalRuntime() {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function shouldUseCloudProxy() {
  return !isLocalRuntime();
}

function getStoredAppPassword() {
  try {
    return localStorage.getItem('ht-app-password') || '';
  } catch {
    return '';
  }
}

function extractJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('模型返回内容不是有效 JSON，请重试或更换模型。');
    }
    return JSON.parse(match[0]) as T;
  }
}

async function callChatJson<T>(
  config: LlmConfig,
  userPrompt: string,
  options?: { systemPrompt?: string; temperature?: number; useChatModel?: boolean },
): Promise<T> {
  const useProxy = shouldUseCloudProxy();
  if (!useProxy && !config.apiKey.trim()) {
    throw new Error('缺少 LLM API Key，请在 .env.local 中配置 VITE_LLM_API_KEY。');
  }

  const body = {
    model: config.model,
    temperature: options?.temperature ?? 0.82,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: options?.systemPrompt ?? SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    useChatModel: Boolean(options?.useChatModel),
  };

  const response = await fetch(useProxy ? '/api/chat' : `${getBaseUrl(config)}/chat/completions`, {
    method: 'POST',
    headers: useProxy
      ? {
          'Content-Type': 'application/json',
          'x-app-password': getStoredAppPassword(),
        }
      : {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${useProxy ? '云端代理' : 'LLM API'} 请求失败：${response.status} ${errorText.slice(0, 240)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM API 没有返回内容。');
  }
  return extractJson<T>(content);
}

function normalizeAngles(payload: { angles?: Angle[] }): Angle[] {
  const angles = Array.isArray(payload.angles) ? payload.angles : [];
  return angles.slice(0, 5).map((angle, index) => ({
    id: Number(angle.id) || index + 1,
    title: String(angle.title || `切入点${index + 1}`).slice(0, 40),
    description: String(angle.description || '').slice(0, 160),
  }));
}

function formatViralSkill(viralSkill?: string) {
  const skill = String(viralSkill || '').trim();
  if (!skill) {
    return '爆文素材 Skill：暂无额外样本。';
  }

  return skill;
}

export async function analyzeArticle(params: {
  config: LlmConfig;
  article: string;
  country: Country;
  platform: Platform;
  viralSkill?: string;
}): Promise<Angle[]> {
  const payload = await callChatJson<{ angles: Angle[] }>(
    params.config,
    `场景一：文章改写模式。
硬性任务：这是"原文改写"，不是自由选题。必须锁定原文主题，禁止跳到同国家下的其他文化话题。

请先在内部完成 3 步判断，不要输出判断过程：
1. 抽取原文主题锚点：原文具体在讲什么对象/制度/行为/生活场景/矛盾点。
2. 抽取原文文化差异点：这个主题和目标国家/地区有什么认知反差。
3. 只在这个主题锚点内部找 3-5 个延展子角度。

角度生成硬性限制：
- 每个角度都必须能回答："它和原文主题锚点有什么直接关系？"
- 每个角度标题或描述里必须出现原文主题锚点相关词，不能只写宽泛话题。
- 可以换切入人群、生活场景、评论区争议、个人疑问，但不能换主题。
- 如果原文讲租房，就不能跳到饮食/职场/婚恋/教育；如果原文讲饮食，就不能跳到租房/工资/移民。
- 宁可少输出角度，也不要输出跳题角度。

每个角度描述必须包含："围绕原文的【具体主题】..."，说明它在原文主题下的具体延展方向。必须基于真实社会现象，不要编造具体数据。
国家：${params.country}
平台：${params.platform}
目标外语：${LANGUAGE_MAP[params.country]}
${formatViralSkill(params.viralSkill)}
返回格式：{"angles":[{"id":1,"title":"必须贴合原文主题的角度名","description":"围绕原文的【具体主题】..."}]}
原文：
${params.article}`,
  );
  return normalizeAngles(payload);
}

export async function analyzeTopic(params: {
  config: LlmConfig;
  topic: string;
  country: Country;
  platform: Platform;
  viralSkill?: string;
}): Promise<Angle[]> {
  const payload = await callChatJson<{ angles: Angle[] }>(
    params.config,
    `场景二：话题创作模式。
请基于真实考据和常见社会现象，分析话题的 3-5 个可能切入点，每个附带简要说明。
禁止编造具体数据、政策、法规；不确定的地方请使用模糊表述。
话题：${params.topic}
国家：${params.country}
平台：${params.platform}
目标外语：${LANGUAGE_MAP[params.country]}
${formatViralSkill(params.viralSkill)}
返回格式：{"angles":[{"id":1,"title":"生活成本","description":"首尔等大城市生活成本和租房制度可能让外国人感到压力。"}]}`,
  );
  return normalizeAngles(payload);
}

function normalizeFactChecks(items?: FactCheckItem[]): FactCheckItem[] {
  if (!Array.isArray(items)) return [];
  const allowed = new Set(['confirmed', 'uncertain', 'softened']);
  return items
    .map((item) => {
      const level = String(item?.level || '').trim();
      return {
        level: (allowed.has(level) ? level : 'uncertain') as FactCheckItem['level'],
        claim: String(item?.claim || '').trim(),
        note: String(item?.note || '').trim(),
      };
    })
    .filter((item) => item.claim)
    .slice(0, 6);
}

function normalizeResult(payload: GenerationResult): GenerationResult {
  const rawChat = Array.isArray(payload.chat) ? payload.chat : [];
  const rawTags = Array.isArray(payload.tags) ? payload.tags : [];
  const requiredTags = ['#找外国人聊天', '#认识外国人', '#HT认识外国人'];

  return {
    title: String(payload.title || '').trim(),
    post: String(payload.post || '').trim(),
    tags: Array.from(
      new Set([...requiredTags, ...rawTags.map((tag) => String(tag || '').trim()).filter(Boolean)]),
    ).slice(0, 10),
    chat: rawChat.map((row) => ({
      target: String(row?.target || '').trim(),
      chinese: String(row?.chinese || '').trim(),
      foreign: String(row?.foreign || '').trim(),
    })),
    factChecks: normalizeFactChecks(payload.factChecks),
  };
}

function normalizeTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag || '').trim())
        .filter(Boolean)
        .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)),
    ),
  ).slice(0, 10);
}

const APP_RECOMMENDATION_SYSTEM_PROMPT = `你是小红书真人分享类博主，专门写"我自己用过觉得不错的APP"这种生活向分享内容。

你不是广告写手，不是测评号，不是工具号。你写的内容必须像一个真实用户在小红书随手发的笔记。

核心心法：
- 角度：站在"想搜这个软件的人"的视角写。看完愿意点开APP Store去下载，而不是觉得"这是广告"。
- 真人感优先：开头给一点真实生活背景，例如"马上要去日本玩想救一下日语""最近被外教课打击到想加练口语"等，不要太长，但要让读者觉得"这就是我"。
- 全文像发给朋友的安利语气，不要像电商详情页或者营销号。

硬性要求：
1. 只输出小红书贴文。
2. 标题必须和用户输入的主题强相关，不超过 20 个中文字符；不要起得像广告标题。
3. 正文不含空格和标点时大约 150-220 字，最低 100 字。
4. 正文必须采用固定结构：先写一小段真实背景/小困扰，再用"1、2、3"分别写至少 3 个 APP 的优点和适合场景；每个 APP 都要有明确优点，不能只列名字。
5. 全文必须自然提到至少 3 个 APP，HelloTalk 必须出现，且必须排在第 1 个或第 2 个被提到，不允许排在第 3 个及以后；其它 APP 按不同功能分工，禁止出现同类型跨国交友/陌生人语言交换竞品（Tandem、YeeTalk、Yeetalk、Hello Pal、Speaky、Ablo、MEEFF、Slowly、Bottled）。
6. 不要写"APP合集"这种词，不要像工具号测评；即使使用 1、2、3 结构，也要像真人在分享自己怎么用。
7. 标签至少 3 个，必须包含 #认识外国人 #找外国人聊天，其余标签贴合主题。
8. 严格禁止出现以下违禁词（出现一次都不行，请用同义换说法）：最、神器、推荐、种草、必备、安利、爆款、第一、首选、绝绝子、yyds、强推、力荐、好物、必入、首推、神级、无敌、巅峰。
   - 把"推荐"换成"分享 / 我自己在用 / 我用得最顺手的几个"；
   - 把"神器"换成"挺好用的小工具 / 顺手的小帮手"；
   - 把"种草"换成"我现在在用 / 用下来感觉还行"；
   - 把"最"换成"我个人觉得 / 我自己用下来"；
   - 标题和正文都要避开以上词。
9. 不要写"下载""点击""快去用""一键""通通拿下""赶紧冲"等硬广动作。
10. 不要写错字、乱码、堆叠特殊符号、AI腔；可以用一个表情，但不要堆 emoji。

输出严格 JSON：
{"title":"不超过20字的小红书标题","post":"小红书正文，可以用换行分段","tags":["#认识外国人","#找外国人聊天","#..."]}`;

const FORBIDDEN_APP_NAMES = ['tandem', 'yeetalk', 'hello pal', 'speaky', 'ablo', 'meeff', 'slowly', 'bottled'];
const FORBIDDEN_WORDS = ['最', '神器', '推荐', '种草', '必备', '安利', '爆款', '第一', '首选', '绝绝子', 'yyds', '强推', '力荐', '好物', '必入', '首推', '神级', '无敌', '巅峰'];

function countChineseTextLength(text: string) {
  return String(text || '').replace(/[\s\p{P}\p{S}]/gu, '').length;
}

function findForbiddenHits(text: string): string[] {
  const value = String(text || '');
  const lower = value.toLowerCase();
  const hits: string[] = [];
  for (const word of FORBIDDEN_WORDS) {
    if (word === word.toLowerCase() && /^[a-z]+$/i.test(word)) {
      if (lower.includes(word.toLowerCase())) hits.push(word);
    } else if (value.includes(word)) {
      hits.push(word);
    }
  }
  return Array.from(new Set(hits));
}

function ensureHelloTalkMention(post: string, topic: string): string {
  const text = String(post || '');
  if (/hellotalk/i.test(text)) return text;
  const insert = `我自己一直在用 HelloTalk 直接和母语者聊真实场景，比对着课本背句子顺手很多，关于${topic || '这件事'}的表达也是这样磨出来的。`;
  return text.trim() ? `${text.trim()}\n\n${insert}` : insert;
}

function containsForbiddenAppName(text: string): boolean {
  const lower = String(text || '').toLowerCase();
  return FORBIDDEN_APP_NAMES.some((name) => lower.includes(name));
}

function normalizeAppRecommendation(payload: AppRecommendationResult, topic: string): AppRecommendationResult {
  let title = String(payload?.title || `想搞定${topic}的真人分享`).replace(/\s+/g, '').trim();
  if (title.length > 20) title = title.slice(0, 20);

  let post = String(payload?.post || '').trim();
  if (containsForbiddenAppName(post)) {
    // 直接清掉竞品提及，避免推荐到禁止的同类竞品
    for (const name of FORBIDDEN_APP_NAMES) {
      const re = new RegExp(name, 'gi');
      post = post.replace(re, 'HelloTalk');
    }
  }
  post = ensureHelloTalkMention(post, topic);

  if (countChineseTextLength(post) < 100) {
    post = `${post}\n\n说回正题，${topic || '这件事'}对我来说本来就是边用边摸索的过程，工具只是顺手的帮手，关键还是每天有没有真的用上。如果你也在折腾这块，欢迎在评论区聊聊你现在是怎么练的，我也想抄抄作业。`;
  }

  const rawTags = Array.isArray(payload?.tags) ? payload.tags : [];
  const tags = Array.from(
    new Set(
      ['#认识外国人', '#找外国人聊天', ...rawTags.map((tag) => String(tag || '').trim()).filter(Boolean)].map((tag) =>
        tag.startsWith('#') ? tag : `#${tag}`,
      ),
    ),
  ).slice(0, 8);

  const forbiddenHits = Array.from(new Set([...findForbiddenHits(title), ...findForbiddenHits(post)]));

  return { title, post, tags, forbiddenHits };
}

export async function generateAppRecommendation(params: {
  config: LlmConfig;
  topic: string;
  material?: string;
}): Promise<AppRecommendationResult> {
  const payload = await callChatJson<AppRecommendationResult>(
    params.config,
    `请根据用户输入主题，生成一篇小红书 APP 真人分享贴。

主题：${params.topic}

素材文档 / 参考资料：
${params.material?.trim() || '用户未提供素材，请按常识选择不属于竞品的工具。'}

生成前请自行检查：
- 是否像真人分享，而不是广告或工具号测评？
- 是否有一点真实背景铺垫，但不啰嗦？
- 是否按"背景 + 1、2、3 分别写 APP 优点"的结构输出？
- 是否自然提到至少 3 个 APP？
- HelloTalk 是否出现，且在第 1 个或第 2 个被提到？
- 是否避开 Tandem、YeeTalk 等同类跨国交友/陌生人社交/语言交换竞品？
- 正文去掉空格和标点后是否至少 100 字，约 150-220 字？
- 标题是否不超过 20 字？
- 标签是否包含 #认识外国人 #找外国人聊天？
- 标题和正文是否避开违禁词：最、神器、推荐、种草、必备、安利等？

请严格输出 JSON，不要 Markdown。`,
    { systemPrompt: APP_RECOMMENDATION_SYSTEM_PROMPT, temperature: 0.72 },
  );
  return normalizeAppRecommendation(payload, params.topic);
}

export async function reviseGeneratedContent(params: {
  config: LlmConfig;
  mode: 'viral' | 'app';
  title: string;
  post: string;
  tags: string[];
  instruction: string;
  country?: Country;
  platform?: Platform;
  angle?: string;
  sourceContext?: string;
}): Promise<ContentRevisionResult> {
  const isApp = params.mode === 'app';
  const payload = await callChatJson<ContentRevisionResult>(
    params.config,
    `请根据用户的"修改方向"对当前内容做二次改写。这不是普通润色，必须按用户想呈现的方向重构重点、开头、表达和信息取舍。

内容类型：${isApp ? '小红书 APP 真人分享贴' : '文化差异类小红书/抖音软广内容'}
${params.country ? `国家：${params.country}` : ''}
${params.platform ? `平台：${params.platform}` : ''}
${params.angle ? `原角度：${params.angle}` : ''}
${params.sourceContext ? `原始上下文：${params.sourceContext}` : ''}

用户修改方向：
${params.instruction}

当前标题：
${params.title}

当前正文：
${params.post}

当前标签：
${params.tags.join(' ')}

通用要求：
- 必须保留当前内容的核心主题，不要跳到无关话题。
- 可以调整立意、开头、论述重点、语气和结尾互动。
- 不新增未经确认的具体数据、政策、法律、金额、百分比。
- 标题要更贴合修改方向，并让用户刷到愿意点开。
- 正文要像真人写的，少重复、少解释腔，不要硬广。
- 标签保留必要标签，并根据新方向微调。

${isApp ? `APP真人分享额外要求：
- 输出只保留标题、正文、标签。
- 正文 100-220 字，开头可以有一点真实场景铺垫。
- 正文必须保持"背景 + 1、2、3 分别写至少 3 个 APP 优点"的结构，每个 APP 都要写清楚适合什么场景。
- HelloTalk 必须自然出现，且不能排在第 3 个及以后被提到。
- 禁止出现同类竞品：Tandem、YeeTalk、Hello Pal、Speaky、Ablo、MEEFF、Slowly、Bottled。
- 标题和正文严格禁止出现这些词：最、神器、推荐、种草、必备、安利、爆款、第一、首选、绝绝子、yyds、强推、力荐、好物、必入、首推、神级、无敌、巅峰。` : `文化差异内容额外要求：
- 自然提到 HelloTalk 一次，不能像硬广。
- 正文优先 120-220 字。
- 如果用户要求增加内容，也要保持简洁和真人感。
- 必带标签 #找外国人聊天 #认识外国人 #HT认识外国人。
- 输出 factChecks 2-5 条，对新增或保留的关键事实做自检。`}

输出严格 JSON：
{"title":"修改后的标题","post":"修改后的正文","tags":["#标签"],"factChecks":[{"level":"confirmed","claim":"...","note":"..."}],"changes":["改动说明1","改动说明2"]}`,
    { systemPrompt: isApp ? APP_RECOMMENDATION_SYSTEM_PROMPT : SYSTEM_PROMPT, temperature: 0.55 },
  );

  const result: ContentRevisionResult = {
    title: String(payload?.title || params.title).trim(),
    post: String(payload?.post || params.post).trim(),
    tags: normalizeTags(payload?.tags).length ? normalizeTags(payload?.tags) : normalizeTags(params.tags),
    factChecks: Array.isArray(payload?.factChecks) ? payload.factChecks.slice(0, 5) : undefined,
    changes: Array.isArray(payload?.changes)
      ? payload.changes.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
      : [],
  };

  if (isApp) {
    const normalized = normalizeAppRecommendation(result as AppRecommendationResult, params.sourceContext || 'APP');
    return {
      ...normalized,
      changes: result.changes,
    };
  }

  return {
    ...result,
    title: result.title || params.title,
    post: result.post || params.post,
    tags: result.tags.length ? result.tags : normalizeTags(params.tags),
  };
}

export async function generateFromArticle(params: {
  config: LlmConfig;
  article: string;
  angle: Angle;
  country: Country;
  platform: Platform;
  viralSkill?: string;
}): Promise<GenerationResult> {
  const payload = await callChatJson<GenerationResult>(
    params.config,
    `请基于"文章改写模式"生成完整内容，并附带事实自检 factChecks。
国家：${params.country}
平台：${params.platform}
目标外语：${LANGUAGE_MAP[params.country]}
选定角度：${params.angle.title} - ${params.angle.description}
${formatViralSkill(params.viralSkill)}
原文是本次创作的爆文参考和锁定主题：请继续围绕原文的核心主题写，禁止跳到无关话题；只在"选定角度"给出的子切片下做延展。
如果选定角度和原文主题存在偏离，必须以原文主题为准，把角度拉回原文主题内部，不允许改写成同国家下的其他文化话题。
${FACT_RULES}
标题必须精准抓住原文主题下最值得点进来的重点，不要只追求更短；要让小红书/抖音用户刷到时愿意点进来看。
正文尽量简短，120-220字优先，减少重复表达，不写解释腔；要让用户看完觉得有意思、愿意点赞或评论。
正文必须三段式：第一段现状或疑问；第二段去 HelloTalk 找搭子聊天探讨话题；第三段总结并抛出开放式问题。
输出前自检：标题是否有具体重点？正文是否真人、简短、不重复？如果不成立，先重写再输出。
请输出 6-10 个 tags，必带 #找外国人聊天 #认识外国人 #HT认识外国人。
聊天对话必须是数组，用三列字段 target/chinese/foreign 表示"对象/中文/对应语言"。
factChecks 输出 2-5 条对正文关键陈述的自检，level 取值 confirmed/uncertain/softened。
请严格输出 JSON：{"title":"...","post":"...","tags":["#找外国人聊天"],"chat":[{"target":"中国用户","chinese":"...","foreign":"..."}],"factChecks":[{"level":"confirmed","claim":"...","note":"..."}]}
原文：
${params.article}`,
  );
  return normalizeResult(payload);
}

export async function generateFromTopic(params: {
  config: LlmConfig;
  topic: string;
  angle: Angle;
  country: Country;
  platform: Platform;
  viralSkill?: string;
}): Promise<GenerationResult> {
  const payload = await callChatJson<GenerationResult>(
    params.config,
    `请基于"话题创作模式"生成完整内容，并附带事实自检 factChecks。
话题：${params.topic}
国家：${params.country}
平台：${params.platform}
目标外语：${LANGUAGE_MAP[params.country]}
选定切入点：${params.angle.title} - ${params.angle.description}
${formatViralSkill(params.viralSkill)}
${FACT_RULES}
必须自然提及 HelloTalk 1次。禁止硬广。
标题必须精准抓住话题里最值得点进来的重点，不要只追求更短；要让小红书/抖音用户刷到时愿意点进来看。
正文尽量简短，120-220字优先，减少重复表达，不写解释腔；要让用户看完觉得有意思、愿意点赞或评论。
正文必须三段式。输出前自检：标题是否有具体重点？正文是否真人、简短、不重复？如果不成立，先重写再输出。
tags 6-10 条，必带 #找外国人聊天 #认识外国人 #HT认识外国人。
factChecks 输出 2-5 条对正文关键陈述的自检，level 取值 confirmed/uncertain/softened。
请严格输出 JSON：{"title":"...","post":"...","tags":["#找外国人聊天"],"chat":[{"target":"中国用户","chinese":"...","foreign":"..."}],"factChecks":[{"level":"confirmed","claim":"...","note":"..."}]}`,
  );
  return normalizeResult(payload);
}

export async function polishText(params: {
  config: LlmConfig;
  original: string;
  context?: string;
}): Promise<PolishResult> {
  const payload = await callChatJson<PolishResult>(
    params.config,
    `请润色以下文本，保持原意、原结构、原信息量，但必须做出能被用户感知的优化。
${params.context ? `场景：${params.context}` : ''}
要求：
- 至少优化 2 处表达，除非原文少于 12 个字。
- 保留事实与核心含义，不新增未经确认的信息。
- 如果是小红书/抖音正文，要尽可能简短、真人、少重复；删掉废话、套话、重复解释。
- 如果是标题，不要一味变短，要更精准抓住核心重点、文化差异冲突点或具体疑问；用户刷到后要愿意点进来看。
- 判断标准：你作为小红书/抖音用户，看到这个标题会不会点？点进来看完正文会不会愿意点赞？如果不会，请继续优化。
原文：
${params.original}

输出 JSON：{"polished":"润色后的完整文本","changes":["第1处：把xxx改成xxx，原因..."]}`,
    { systemPrompt: POLISH_SYSTEM_PROMPT, temperature: 0.4 },
  );

  const polished = String(payload?.polished || '').trim();
  const rawChanges = Array.isArray(payload?.changes) ? payload.changes : [];
  const changes = rawChanges.map((c) => String(c || '').trim()).filter(Boolean).slice(0, 5);
  return {
    polished: polished || params.original,
    changes,
  };
}

function normalizeChatRows(rows?: ChatRow[]): ChatRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      target: String(row?.target || '').trim() || '外国用户',
      chinese: String(row?.chinese || '').trim(),
      foreign: String(row?.foreign || '').trim(),
    }))
    .filter((row) => row.chinese || row.foreign)
    .slice(0, 12);
}

export async function regenerateChat(params: {
  config: LlmConfig;
  country: Country;
  platform: Platform;
  title: string;
  post: string;
  angle?: string;
  currentChat?: ChatRow[];
  instruction?: string;
  mode: 'fromPost' | 'continueFromEdited';
}): Promise<ChatRow[]> {
  const payload = await callChatJson<{ chat: ChatRow[] }>(
    getChatConfig(params.config),
    `请根据当前标题、正文和已编辑聊天内容，重新生成聊天记录。
国家：${params.country}
平台：${params.platform}
目标外语：${LANGUAGE_MAP[params.country]}
角度：${params.angle || '未提供'}
模式：${params.mode === 'fromPost' ? '根据当前正文完整重生成聊天' : '根据当前最新正文和修改建议，整份重写聊天记录，不要续写，不要追加到尾部'}
用户对聊天记录的修改建议 / 想要方向：
${params.instruction?.trim() || '未提供，请根据正文和当前聊天自行优化。'}

标题：
${params.title}

正文：
${params.post}

当前已编辑聊天记录：
${JSON.stringify(params.currentChat || [], null, 2)}

规则：
1. 输出 8-12 行聊天，必须是三列：target/chinese/foreign。
2. 中国用户：chinese 写中文，foreign 写目标外语翻译。
3. 外国用户：foreign 写目标外语，chinese 写中文翻译。
4. 这不是翻译任务。必须根据“当前最新正文”和“用户修改建议/想要方向”重构整份对话内容、追问逻辑、回应重点和后续走向。
5. 如果用户选择重写，必须输出一份完整新聊天记录，不要只在原聊天后面追加内容；当前已编辑聊天记录只作为风格参考。
6. 对话要自然，有来有回，有追问、有澄清、有个人经验，不要像教科书解释。
7. 严禁新增具体数字、政策、法规；不确定内容用“可能因地区而异”等模糊处理。
8. 如果用户建议和正文冲突，以用户建议为主，但不要偏离文化差异和 HelloTalk 聊天场景。

请严格输出 JSON：{"chat":[{"target":"中国用户","chinese":"...","foreign":"..."}]}`,
    { temperature: 0.65, useChatModel: true },
  );
  return normalizeChatRows(payload.chat);
}

export async function regenerateChatRow(params: {
  config: LlmConfig;
  country: Country;
  platform: Platform;
  title: string;
  post: string;
  angle?: string;
  currentChat: ChatRow[];
  rowIndex: number;
  instruction?: string;
}): Promise<ChatRow> {
  const currentRow = params.currentChat[params.rowIndex];
  const payload = await callChatJson<{ row: ChatRow }>(
    getChatConfig(params.config),
    `请只重生成聊天记录中的第 ${params.rowIndex + 1} 行，不要重写其他行。
国家：${params.country}
平台：${params.platform}
目标外语：${LANGUAGE_MAP[params.country]}
角度：${params.angle || '未提供'}
用户对本行/聊天的修改建议：
${params.instruction?.trim() || '未提供，请根据上下文优化这一行。'}

标题：
${params.title}

正文：
${params.post}

完整聊天上下文：
${JSON.stringify(params.currentChat, null, 2)}

当前需要调整的这一行：
${JSON.stringify(currentRow || {}, null, 2)}

规则：
1. 只输出替换第 ${params.rowIndex + 1} 行的单行 JSON。
2. 必须结合前后文，让这一行承接自然，不要只翻译原句。
3. 如果用户修改建议提到方向，以建议为主；若未提供建议，则根据正文和上下文重写得更自然。
4. 中国用户：chinese 写中文，foreign 写目标外语翻译；外国用户：foreign 写目标外语，chinese 写中文翻译。
5. 不新增具体数字、政策、法规；不确定内容用模糊说法。

请严格输出 JSON：{"row":{"target":"中国用户或外国用户","chinese":"...","foreign":"..."}}`,
    { temperature: 0.68, useChatModel: true },
  );
  return normalizeChatRows([payload.row])[0] || currentRow || { target: '外国用户', chinese: '', foreign: '' };
}

function normalizeResearch(payload: ResearchResult, fallbackTopic: string): ResearchResult {
  return {
    topic: String(payload?.topic || fallbackTopic).trim() || fallbackTopic,
    concept: String(payload?.concept || '').trim(),
    facts: (Array.isArray(payload?.facts) ? payload.facts : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 8),
    misconceptions: (Array.isArray(payload?.misconceptions) ? payload.misconceptions : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 6),
    angles: (Array.isArray(payload?.angles) ? payload.angles : [])
      .map((a) => ({
        title: String(a?.title || '').trim().slice(0, 40),
        description: String(a?.description || '').trim().slice(0, 200),
      }))
      .filter((a) => a.title)
      .slice(0, 5),
    related: (Array.isArray(payload?.related) ? payload.related : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 6),
    freshnessNote: String(payload?.freshnessNote || '建议用户自行核实最新政策与数据。').trim(),
  };
}

export async function researchTopic(params: {
  config: LlmConfig;
  topic: string;
}): Promise<ResearchResult> {
  const payload = await callChatJson<ResearchResult>(
    params.config,
    `请为以下文化主题提供结构化背景资料：
主题：${params.topic}

要求：基本概念、真实数据/普遍现象（带来源限定）、常见误解、3-5 个适合"小红书/抖音文化差异类软广内容"切入的角度建议、相关话题延伸、信息时效性说明。
不要编造具体数字、不要使用"最新/刚刚"等时效词、不确定的内容必须模糊处理。`,
    { systemPrompt: RESEARCH_SYSTEM_PROMPT, temperature: 0.5 },
  );
  return normalizeResearch(payload, params.topic);
}
