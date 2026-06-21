interface ViralExample {
  title: string;
  body: string;
  raw: string;
}

const MAX_SKILL_CHARS = 1800;
const MAX_EXAMPLE_CHARS = 520;
const MAX_SELECTED_EXAMPLES = 2;

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseExamples(library: string): ViralExample[] {
  const text = library.trim();
  if (!text) {
    return [];
  }

  const chunks = text
    .split(/(?=【爆文\d*】)|(?=\n\s*标题[:：])/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.map((chunk, index) => {
    const titleMatch = chunk.match(/标题[:：]\s*(.+)/);
    const bodyMatch = chunk.match(/正文[:：]\s*([\s\S]*)/);
    const title = normalizeText(titleMatch?.[1] || `爆文样本${index + 1}`);
    const body = normalizeText(bodyMatch?.[1] || chunk.replace(/【爆文\d*】|标题[:：].+/g, ''));

    return {
      title,
      body,
      raw: chunk,
    };
  });
}

function tokenize(value: string) {
  const normalized = value.toLowerCase();
  const chineseTokens = normalized.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const latinTokens = normalized.match(/[a-z0-9]{3,}/g) || [];

  return new Set([...chineseTokens, ...latinTokens]);
}

function scoreExample(example: ViralExample, query: string) {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) {
    return 0;
  }

  const exampleText = `${example.title} ${example.body}`;
  const exampleTokens = tokenize(exampleText);
  let score = 0;

  queryTokens.forEach((token) => {
    if (exampleTokens.has(token)) {
      score += 2;
    }
    if (exampleText.includes(token)) {
      score += 1;
    }
  });

  return score;
}

function getCommonTitlePatterns(examples: ViralExample[]) {
  const patterns = new Set<string>();

  examples.forEach((example) => {
    if (example.title.includes('为什么') || example.title.includes('为啥')) patterns.add('用“为什么/为啥”制造疑问');
    if (example.title.includes('真的')) patterns.add('用“真的”增强真实求证感');
    if (example.title.includes('原来')) patterns.add('用“原来”制造认知反转');
    if (example.title.includes('不是')) patterns.add('用否定句制造反差');
    if (example.title.includes('？') || example.title.includes('?')) patterns.add('标题优先问句');
  });

  return Array.from(patterns).slice(0, 5);
}

export function buildViralSkillContext(library: string, query: string) {
  const examples = parseExamples(library);
  if (examples.length === 0) {
    return '';
  }

  const selected = [...examples]
    .sort((a, b) => scoreExample(b, query) - scoreExample(a, query))
    .slice(0, MAX_SELECTED_EXAMPLES);

  const titlePatterns = getCommonTitlePatterns(examples);
  const skillLines = [
    '爆文素材 Skill：',
    '只调用压缩后的风格规则和少量相关样本，禁止照搬素材库内容。',
    '写作风格：第一人称、生活观察开头、带真实疑问、语气像普通用户发帖，不要像科普或广告。',
    '正文结构：严格三段式。第一段写现状/疑问；第二段写去 HelloTalk 找搭子聊天；第三段写总结和开放式反问。',
    '改写方法：学习爆文的钩子、节奏、疑问感、反差感和讨论感，但必须换角度、换表达、换案例。',
    titlePatterns.length ? `标题方法：${titlePatterns.join('；')}。` : '标题方法：问句优先，有点击欲但不浮夸。',
    '安全边界：不得复刻素材标题、句子、段落顺序和具体话术；不确定事实必须模糊处理。',
    '相关样本摘要：',
    ...selected.map((example, index) => {
      const body = example.body.slice(0, MAX_EXAMPLE_CHARS);
      return `${index + 1}. 标题：${example.title}\n摘要：${body}`;
    }),
  ];

  return skillLines.join('\n').slice(0, MAX_SKILL_CHARS);
}
