# HelloTalk 内容生成器云端部署说明

这份说明用于把当前项目部署到 Vercel。部署后你可以在不同电脑上打开同一个网址使用，不需要下载 Vercel 客户端。

## 部署后会发生什么

- 本地 `npm run dev`：仍然按原方式使用 `.env.local` 里的 `VITE_*` 配置，浏览器直接调用模型 API。
- Vercel 云端：前端不会暴露 API Key，所有模型请求都会先发到 `/api/chat`，再由 Vercel 后端代理转发到 DeepSeek / 豆包。
- 云端访问密码：如果配置了 `APP_PASSWORD`，第一次打开云端网址会要求输入密码；密码会保存在当前浏览器里。
- 历史记录：目前仍然保存在浏览器本地，不同电脑之间不会自动同步。

## 一次性准备

你需要准备：

- GitHub 账号
- Vercel 账号
- 当前项目代码上传到 GitHub
- 模型 API Key

不需要下载 Vercel，也不需要安装 Vercel CLI。直接用浏览器操作即可。

## 环境变量

在 Vercel 项目里打开：

`Settings` -> `Environment Variables`

至少添加这几项：

```env
LLM_API_KEY=你的主模型 API Key
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash
APP_PASSWORD=你自己设置的访问密码
```

如果聊天记录想单独走豆包或另一个模型，再额外添加：

```env
CHAT_LLM_API_KEY=你的聊天模型 API Key
CHAT_LLM_BASE_URL=聊天模型 Base URL
CHAT_LLM_MODEL=聊天模型名称或 endpoint id
```

注意：云端环境变量不要使用 `VITE_` 前缀。`VITE_` 会被打包进前端，容易暴露 API Key。

## Vercel 操作步骤

1. 打开 [Vercel](https://vercel.com/) 并登录。
2. 点击 `Add New` -> `Project`。
3. 选择你上传到 GitHub 的项目仓库。
4. Framework Preset 选择 `Vite`。
5. Build Command 保持 `npm run build`。
6. Output Directory 保持 `dist`。
7. 在 `Environment Variables` 添加上面的变量。
8. 点击 `Deploy`。

部署完成后，Vercel 会给你一个 `vercel.app` 网址。你在任意电脑打开这个网址，输入访问密码后就能使用。

## 更新版本

以后你在本地改完代码，只要把代码推送到 GitHub，Vercel 会自动重新部署。

如果只是改了环境变量，需要在 Vercel 里点击 `Redeploy` 才会生效。

## 常见问题

### 打开后提示 401

说明访问密码不正确，或者 Vercel 里的 `APP_PASSWORD` 和你输入的不一致。清除浏览器里的站点数据后重新输入，或在设置里改回正确密码。

### 提示云端缺少 LLM_API_KEY

说明 Vercel 没有配置 `LLM_API_KEY`，或者配置后没有重新部署。添加环境变量后点一次 `Redeploy`。

### 本地还能不能用

可以。本地 `localhost` 会继续使用 `.env.local` 里的 `VITE_*` 配置，不依赖 Vercel 后端代理。

### 不同电脑历史记录是否同步

历史记录仍保存在各自电脑浏览器里，不同步。

### 不同电脑的 SKILL / 偏好是否同步

**支持同步（需配置 Vercel KV 或 Upstash Redis）。** 风格 SKILL、通用方法论 SKILL、用户偏好、爆文素材库这四类数据会自动同步到云端，在任意电脑打开都能用。

配置方法（一次性）：

1. 在 Vercel 项目页面打开 `Storage` 标签。
2. 点击 `Create Database`，选择 `KV` 或 `Upstash Redis`。
3. 给数据库起个名字，选择离你最近的区域，创建。
4. 创建后 Vercel 会自动注入环境变量，代码两种命名都兼容：
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN`
   - 或 `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
5. 回到 `Deployments`，点一次 `Redeploy` 让新环境变量生效。

配置完成后：
- 顶部会出现「已同步」绿色小标签，表示云端连接正常。
- 修改任何 SKILL / 偏好后会自动推送到云端（约 1 秒延迟）。
- 换电脑打开同一网址，数据会自动拉取下来。

如果不配置 Vercel KV：
- 同步功能自动禁用，顶部显示「云端未配置」。
- 数据仍保存在各设备浏览器本地，互不影响。
