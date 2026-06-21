type ChatRequest = {
  model?: string;
  baseUrl?: string;
  temperature?: number;
  response_format?: { type: 'json_object' };
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  useChatModel?: boolean;
};

const DEFAULT_BASE_URL = 'https://api.deepseek.com';

function getHeader(req: { headers?: Record<string, string | string[] | undefined> }, name: string) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function resolveProvider(body: ChatRequest) {
  const useChatModel = Boolean(body.useChatModel);
  const apiKey = useChatModel
    ? process.env.CHAT_LLM_API_KEY || process.env.LLM_API_KEY
    : process.env.LLM_API_KEY;
  const baseUrl = useChatModel
    ? process.env.CHAT_LLM_BASE_URL || process.env.LLM_BASE_URL || DEFAULT_BASE_URL
    : process.env.LLM_BASE_URL || DEFAULT_BASE_URL;
  const model = useChatModel
    ? process.env.CHAT_LLM_MODEL || process.env.LLM_MODEL || body.model
    : process.env.LLM_MODEL || body.model;

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    model,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: '只支持 POST 请求。' });
    return;
  }

  const appPassword = process.env.APP_PASSWORD?.trim();
  if (appPassword) {
    const provided = getHeader(req, 'x-app-password')?.trim();
    if (provided !== appPassword) {
      res.status(401).json({ error: '访问密码不正确，请重新输入。' });
      return;
    }
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as ChatRequest;
    const provider = resolveProvider(body);

    if (!provider.apiKey) {
      res.status(500).json({ error: '云端缺少 LLM_API_KEY，请在 Vercel 环境变量中配置。' });
      return;
    }
    if (!provider.model) {
      res.status(500).json({ error: '云端缺少 LLM_MODEL，请在 Vercel 环境变量中配置。' });
      return;
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: '缺少 messages。' });
      return;
    }

    const upstream = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: body.temperature ?? 0.82,
        response_format: body.response_format ?? { type: 'json_object' },
        messages: body.messages,
      }),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
    res.send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : '云端代理请求失败。';
    res.status(500).json({ error: message });
  }
}
