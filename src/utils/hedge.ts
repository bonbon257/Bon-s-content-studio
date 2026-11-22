// 和稀泥表达检测：命中即提示，方便一键改写成有立场的说法
export const HEDGE_PHRASES = [
  '可能因地区而异',
  '可能因公司而异',
  '可能因人而异',
  '因地区而异',
  '因公司而异',
  '因人而异',
  '因店而异',
  '不同市场不同感觉',
  '不同市场、不同感觉',
  '定位不一样',
  '定位不同',
  '各有各的好',
  '各有优劣',
  '不好说',
  '很难说',
  '看情况',
  '不能一概而论',
  '也不能一概而论',
  '可能那边',
];

// 返回命中的去重短语，保持出现顺序
export function findHedges(texts: Array<string | undefined>): string[] {
  const hits: string[] = [];
  const content = texts.filter(Boolean).join('\n');
  if (!content) return hits;
  for (const phrase of HEDGE_PHRASES) {
    if (content.includes(phrase) && !hits.includes(phrase)) {
      hits.push(phrase);
    }
  }
  return hits;
}
