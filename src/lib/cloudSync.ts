import type { GuideSkill, StyleSkill, UserPreferences } from '../types';

// 云端同步的完整数据包
export interface CloudSkillsData {
  styleSkills: StyleSkill[];
  guideSkills: GuideSkill[];
  preferences: UserPreferences;
  viralExamples: string;
  updatedAt: string;
}

// ok=正常；disabled=云端 KV 未配置；error=鉴权或网络失败
export type CloudStatus = 'ok' | 'disabled' | 'error';

export interface CloudFetchResult {
  status: CloudStatus;
  data?: CloudSkillsData | null;
  message?: string;
}

const APP_PASSWORD_KEY = 'ht-app-password';
const API_PATH = '/api/skills';

function getAppPassword(): string {
  try {
    return localStorage.getItem(APP_PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

// 是否运行在云端部署（非 localhost）
export function isHostedRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol === 'file:') return false;
  return !['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string };
    return json.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * 从云端拉取所有 SKILL / 偏好 / 素材库数据。
 * data 为 null 表示云端暂无数据（首次使用）。
 */
export async function fetchCloudSkills(): Promise<CloudFetchResult> {
  if (!isHostedRuntime()) return { status: 'disabled' };

  try {
    const res = await fetch(API_PATH, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-app-password': getAppPassword(),
      },
    });

    if (res.status === 503) {
      console.warn('[cloudSync] 云端 KV 未配置，跳过云端同步。');
      return { status: 'disabled' };
    }
    if (res.status === 401) {
      const message = await readError(res, '访问密码不正确。');
      console.warn('[cloudSync] 拉取失败：', message);
      return { status: 'error', message };
    }
    if (!res.ok) {
      return { status: 'error', message: `HTTP ${res.status}` };
    }

    const json = (await res.json()) as { data: CloudSkillsData | null };
    return { status: 'ok', data: json.data ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : '拉取云端数据失败。';
    console.warn('[cloudSync] 拉取云端数据失败：', message);
    return { status: 'error', message };
  }
}

/**
 * 将本地所有 SKILL / 偏好 / 素材库数据推送到云端。
 */
export async function pushCloudSkills(
  data: Omit<CloudSkillsData, 'updatedAt'>,
): Promise<CloudFetchResult> {
  if (!isHostedRuntime()) return { status: 'disabled' };

  try {
    const res = await fetch(API_PATH, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-app-password': getAppPassword(),
      },
      body: JSON.stringify(data),
    });

    if (res.status === 503) {
      console.warn('[cloudSync] 云端 KV 未配置，跳过云端推送。');
      return { status: 'disabled' };
    }
    if (!res.ok) {
      const message = await readError(res, `HTTP ${res.status}`);
      console.warn('[cloudSync] 推送失败：', message);
      return { status: 'error', message };
    }

    return { status: 'ok', data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : '推送云端数据失败。';
    console.warn('[cloudSync] 推送云端数据失败：', message);
    return { status: 'error', message };
  }
}
