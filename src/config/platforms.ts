import type { Platform, PlatformConfig } from '../types';

// 新增创作板块使用的平台写法配置。
// 注意：现有「文章改写 / 话题创作 / 按文档生成」等模块仍只用小红书、抖音，
// 该配置只服务于新增的「创作工作台」，不改变原有流程。
export const PLATFORMS: PlatformConfig[] = [
  {
    id: '小红书',
    name: '小红书',
    titleRule: '标题 14-22 字，突出具体利益点、人群或反差，不要空泛；适当使用问句或数字。',
    bodyRule: '正文 150-400 字，第一人称真实分享，分段清晰，信息密度优先，结尾引导收藏或评论。',
    tagRule: '6-10 个标签，带 2-3 个精准品类/场景词，再带 1-2 个大流量标签。',
    formatRule: '可以用少量 emoji 分隔段落，但不要整篇堆 emoji；不要出现外链和硬广。',
  },
  {
    id: '抖音',
    name: '抖音',
    titleRule: '标题 12-20 字，口语化、有冲突感或悬念，适合快速划到时抓住注意力。',
    bodyRule: '正文 100-250 字，短句为主，开头 2 句必须抛出钩子，节奏快，避免长段落。',
    tagRule: '4-8 个标签，优先话题词和场景词，数量不必多。',
    formatRule: '句子要短、可直接口播；避免书面语和复杂从句。',
  },
  {
    id: '公众号',
    name: '公众号',
    titleRule: '标题 16-26 字，信息完整、有观点或情绪张力，可适度使用「」和数字。',
    bodyRule: '正文 600-1500 字，结构完整，有小标题或分段层次，先给结论再展开细节，结尾做总结或引导留言。',
    tagRule: '公众号以话题标签为主，输出 3-6 个即可，不追求堆量。',
    formatRule: '书面但不端着，段落之间留白；不使用小红书式话题堆叠。',
  },
];

export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORMS.find((item) => item.id === platform) || PLATFORMS[0];
}

export function formatPlatformGuide(platform: Platform): string {
  const config = getPlatformConfig(platform);
  return `平台：${config.name}
- 标题规则：${config.titleRule}
- 正文规则：${config.bodyRule}
- 标签规则：${config.tagRule}
- 格式要求：${config.formatRule}`;
}
