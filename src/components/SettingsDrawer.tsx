import { ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import type { LlmConfig } from '../types';

const baseUrlOptions = [
  { label: 'DeepSeek 官方', value: 'https://api.deepseek.com' },
  { label: '硅基流动', value: 'https://api.siliconflow.cn/v1' },
  { label: '豆包 Ark', value: 'https://ark.cn-beijing.volces.com/api/v3' },
  { label: '自定义', value: 'custom' },
];

const modelOptions = ['deepseek-v4-flash', 'deepseek-v4-pro'];

export function SettingsDrawer({
  open,
  config,
  onClose,
  onSave,
  showAccessPasswordReset,
  onResetAccessPassword,
}: {
  open: boolean;
  config: LlmConfig;
  onClose: () => void;
  onSave: (config: LlmConfig) => void;
  showAccessPasswordReset?: boolean;
  onResetAccessPassword?: () => void;
}) {
  const matchedBase = baseUrlOptions.find((option) => option.value === config.baseUrl);
  const [draft, setDraft] = useState(config);
  const [baseMode, setBaseMode] = useState(matchedBase ? matchedBase.value : 'custom');

  function handleSave() {
    onSave({
      apiKey: draft.apiKey.trim(),
      baseUrl: draft.baseUrl.trim() || 'https://api.deepseek.com',
      model: draft.model.trim() || 'deepseek-v4-flash',
      chatApiKey: draft.chatApiKey?.trim() || '',
      chatBaseUrl: draft.chatBaseUrl?.trim() || '',
      chatModel: draft.chatModel?.trim() || '',
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/30 transition-opacity"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-canvas shadow-xl"
        style={{ animation: 'n-fade-up 0.2s ease' }}
      >
        <div className="flex items-center justify-between border-b border-line/60 px-8 pb-5 pt-8">
          <div>
            <h2 className="n-h2">配置</h2>
            <p className="n-muted mt-1">配置保存在本地浏览器，不会上传。</p>
          </div>
          <button type="button" onClick={onClose} className="n-btn-ghost" title="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-7">
          <div className="rounded-[20px] bg-white/70 p-4">
            <p className="mb-4 text-sm font-bold text-ink">正文 / 角度 / 资料检索模型</p>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                API Key
              </span>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="sk-..."
              className="n-input"
            />
            </label>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Base URL
              </span>
            <select
              value={baseMode}
              onChange={(e) => {
                setBaseMode(e.target.value);
                if (e.target.value !== 'custom') {
                  setDraft({ ...draft, baseUrl: e.target.value });
                }
              }}
              className="n-select"
            >
              {baseUrlOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            </label>

            {baseMode === 'custom' && (
              <label className="mt-4 block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                自定义 Base URL
              </span>
              <input
                value={draft.baseUrl}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="n-input"
              />
              </label>
            )}

            <label className="mt-4 block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                模型
              </span>
            <select
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              className="n-select"
            >
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            </label>
          </div>

          <div className="rounded-[20px] bg-white/70 p-4">
            <p className="mb-1 text-sm font-bold text-ink">聊天记录模型</p>
            <p className="n-muted mb-4 text-xs">可单独接豆包。留空则复用上面的正文模型。</p>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Chat API Key
              </span>
              <input
                type="password"
                value={draft.chatApiKey || ''}
                onChange={(e) => setDraft({ ...draft, chatApiKey: e.target.value })}
                placeholder="豆包 Ark API Key，留空则复用正文 Key"
                className="n-input"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Chat Base URL
              </span>
              <input
                value={draft.chatBaseUrl || ''}
                onChange={(e) => setDraft({ ...draft, chatBaseUrl: e.target.value })}
                placeholder="https://ark.cn-beijing.volces.com/api/v3"
                className="n-input"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Chat Model
              </span>
              <input
                value={draft.chatModel || ''}
                onChange={(e) => setDraft({ ...draft, chatModel: e.target.value })}
                placeholder="例如 doubao-seed-1-6-250615 或你的 endpoint id"
                className="n-input"
              />
            </label>
          </div>

          {showAccessPasswordReset && onResetAccessPassword && (
            <div className="rounded-[20px] bg-white/70 p-4">
              <p className="mb-1 text-sm font-bold text-ink">访问密码</p>
              <p className="n-muted mb-3 text-xs">
                密码保存在当前浏览器。换密码或忘记密码时，点下面按钮重新输入。
              </p>
              <button
                type="button"
                onClick={onResetAccessPassword}
                className="n-btn w-full justify-center py-2"
              >
                重新输入访问密码
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            className="n-btn n-btn-primary w-full justify-center py-2.5"
          >
            保存配置
          </button>

          <p className="n-muted flex items-center gap-1 pt-2 text-xs">
            没有 Key？前往
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-accent hover:underline"
            >
              platform.deepseek.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
