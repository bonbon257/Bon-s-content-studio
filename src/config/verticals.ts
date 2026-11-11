import type { VerticalConfig, VerticalId } from '../types';

// 赛道配置：把「写什么」从代码里抽出来，新增赛道只需要在这里加一条配置。
export const VERTICALS: VerticalConfig[] = [
  {
    id: 'culture',
    name: '文化差异',
    builtIn: true,
    tagline: '沿用国家维度，写中外文化差异内容',
    briefFields: [],
    referenceModeDefault: 'structure-only',
    angleStrategy:
      '围绕中外文化差异、生活制度、日常习惯的反差找角度；优先高讨论度、有真实反差、容易引发评论的切入点，避免刻板印象和地域攻击。',
    bodyGuidance:
      '正文必须三段式：第一段现状、生活观察或疑问；第二段写「我在 HelloTalk 上认识的一个外国朋友」和我聊起这件事时给的真实回应，只出现一个外国朋友；第三段总结并抛出开放式问题。必须自然提及 HelloTalk 1 次，禁止硬广。',
    tagGuidance: '6-10 个标签，必带 #找外国人聊天 #认识外国人，其余从文化差异、跨文化交流、语言学习等高讨论度标签中选择。',
    reviewRubric:
      '检查文化差异描述是否基于普遍现象而非个例、是否存在刻板印象或文化优越感、HelloTalk 植入是否自然且只出现 1 次、是否只有一个外国朋友。',
    useCountryDimension: true,
  },
  {
    id: 'travel',
    name: '旅游攻略',
    builtIn: true,
    tagline: '从目的地、预算和真实体验写出可落地的攻略',
    briefFields: [
      { key: 'destination', label: '目的地', placeholder: '例如：京都、大理、清迈' },
      { key: 'days', label: '行程天数', placeholder: '例如：4 天 3 晚' },
      { key: 'budget', label: '预算', placeholder: '例如：人均 3500 元（不含机票）' },
      { key: 'companions', label: '同行人', placeholder: '例如：情侣 / 独自 / 带父母' },
      {
        key: 'pitfalls',
        label: '踩过的坑 / 真实体验',
        placeholder: '例如：周末人太多、某家店排队 2 小时、建议早上去',
        multiline: true,
      },
    ],
    referenceModeDefault: 'structure-only',
    angleStrategy:
      '围绕「具体目的地 + 具体人群 + 具体痛点」找角度，例如省钱路线、避坑清单、季节选择、小众玩法、带父母/情侣怎么安排；不要泛泛写「XX 值得去吗」。',
    bodyGuidance:
      '第一人称真实分享，信息密度优先：给出可执行的路线、花费、时间、交通和注意事项；不堆空泛形容词，不写「绝美」「太值了」这类空话。可以分段但不要为了套模板硬凑三段式；不需要提及 HelloTalk。',
    tagGuidance: '6-10 个标签，必须包含目的地相关标签，并带上 #旅游攻略 或 #旅行 之一。',
    reviewRubric:
      '重点检查信息是否可执行（路线/花费/时间/交通是否具体）、地点与价格是否可信且未编造、是否适合用户收藏、有没有空泛的形容词堆砌。',
    useCountryDimension: false,
  },
  {
    id: 'product',
    name: '好物种草',
    builtIn: true,
    tagline: '从真实使用体验写出有说服力的种草',
    briefFields: [
      { key: 'category', label: '品类', placeholder: '例如：通勤双肩包、平价面霜' },
      { key: 'price', label: '价格区间', placeholder: '例如：200-300 元' },
      { key: 'scenario', label: '使用场景', placeholder: '例如：每天通勤 1 小时、长时间对着电脑' },
      {
        key: 'competitors',
        label: '对比过的同类竞品',
        placeholder: '例如：用过 A 牌和 B 牌，最后留下这个',
        multiline: true,
      },
      {
        key: 'experience',
        label: '真实使用体验 / 优缺点',
        placeholder: '例如：背带舒服，但电脑层偏薄；用了 3 个月没有开线',
        multiline: true,
      },
    ],
    referenceModeDefault: 'structure-only',
    angleStrategy:
      '围绕「人群 + 使用场景 + 同类对比 + 真实优缺点」找角度；突出具体使用瞬间和可验证的细节，避免纯夸和通稿式卖点罗列。',
    bodyGuidance:
      '第一人称真实体验：写清楚为什么买、在什么场景用、上手感受、优点和缺点、和同类产品对比的差异。不夸大、不使用绝对化用语，不编造参数和功效；不需要提及 HelloTalk。',
    tagGuidance: '6-10 个标签，必须包含品类词，并带上 #好物分享 或 #真实测评 之一。',
    reviewRubric:
      '重点检查是否有真实体验细节（场景/时长/具体感受）、是否夸大功效或使用绝对化用语、对比是否有依据、整体是否像广告通稿。',
    useCountryDimension: false,
  },
];

const VERTICAL_MAP: Record<VerticalId, VerticalConfig> = VERTICALS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<VerticalId, VerticalConfig>,
);

export function getVertical(id: VerticalId): VerticalConfig {
  return VERTICAL_MAP[id] || VERTICALS[0];
}
