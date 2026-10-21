import { kv } from '@vercel/kv';

// 云端同步的 SKILL 数据结构
interface CloudSkillsPayload {
  styleSkills: unknown[];
  guideSkills: unknown[];
  preferences: unknown;
  viralExamples: string;
  updatedAt: string;
}

const KV_KEY = 'skills:v1';
// 单次上传上限：256KB（足够容纳所有 SKILL + 偏好 + 素材库）
const MAX_PAYLOAD_BYTES = 256 * 1024;

function getHeader(
  req: { headers?: Record<string, string | string[] | undefined> },
  name: string,
) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function checkAuth(req: any): string | null {
  const appPassword = process.env.APP_PASSWORD?.trim();
  if (!appPassword) return null; // 未配置密码则不鉴权
  const provided = getHeader(req, 'x-app-password')?.trim();
  if (provided !== appPassword) {
    return '访问密码不正确，请重新输入。';
  }
  return null;
}

// 兼容 Vercel KV 与 Upstash Redis 两种环境变量命名
function resolveKvEnv(): boolean {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  // @vercel/kv 只读取 KV_ 前缀，这里做一次归一化
  process.env.KV_REST_API_URL = url;
  process.env.KV_REST_API_TOKEN = token;
  return true;
}

export default async function handler(req: any, res: any) {
  const authError = checkAuth(req);
  if (authError) {
    res.status(401).json({ error: authError });
    return;
  }

  if (!resolveKvEnv()) {
    res.status(503).json({
      error:
        '云端存储未配置。请在 Vercel 项目中添加 KV / Upstash Redis，并重新部署。',
    });
    return;
  }

  try {
    if (req.method === 'GET') {
      const data = await kv.get<CloudSkillsPayload>(KV_KEY);
      res.status(200).json({ data: data ?? null });
      return;
    }

    if (req.method === 'PUT') {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      // 基本校验
      if (
        !body ||
        !Array.isArray(body.styleSkills) ||
        !Array.isArray(body.guideSkills) ||
        typeof body.viralExamples !== 'string'
      ) {
        res.status(400).json({ error: '数据格式不正确。' });
        return;
      }

      // 体积校验
      const jsonStr = JSON.stringify(body);
      if (Buffer.byteLength(jsonStr, 'utf-8') > MAX_PAYLOAD_BYTES) {
        res
          .status(413)
          .json({ error: '数据过大，已超过云端存储上限（256KB）。' });
        return;
      }

      const payload: CloudSkillsPayload = {
        styleSkills: body.styleSkills,
        guideSkills: body.guideSkills,
        preferences: body.preferences ?? null,
        viralExamples: body.viralExamples,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(KV_KEY, payload);
      res.status(200).json({ ok: true, updatedAt: payload.updatedAt });
      return;
    }

    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: '只支持 GET / PUT 请求。' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '云端存储操作失败。';
    res.status(500).json({ error: message });
  }
}
