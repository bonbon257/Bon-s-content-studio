// 生成飞书文档：把当前文章标题 + 正文写入一篇新的飞书 Docx 文档。
// 需要在 Vercel 环境变量中配置：
//   FEISHU_APP_ID      飞书自建应用的 App ID
//   FEISHU_APP_SECRET  飞书自建应用的 App Secret
//   FEISHU_FOLDER_TOKEN  （可选）要创建到的目标文件夹 token
// 应用需开通权限：docx:document（云文档 - 新建/编辑文档）
// 文档链接格式：https://{企业域名}.feishu.cn/docx/{document_id}

type FeishuDocRequest = {
  title: string;
  post: string;
  tags?: string[];
  domain?: string; // 企业自定义域名，如 "your-company"；不传则用 feishu.cn
};

function getHeader(req: { headers?: Record<string, string | string[] | undefined> }, name: string) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

// 把正文按空行拆成段落块
function buildBlocks(title: string, post: string, tags?: string[]): unknown[] {
  const blocks: unknown[] = [];

  // 标题作为 H1
  blocks.push({
    block_type: 3,
    heading1: {
      elements: [{ text_run: { content: title || '未命名文档' } }],
      style: {},
    },
  });

  const paragraphs = post
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    // 段落内的换行保留为同一块文本（飞书文本块支持换行）
    blocks.push({
      block_type: 2,
      text: {
        elements: [{ text_run: { content: para } }],
        style: {},
      },
    });
  }

  if (tags && tags.length) {
    blocks.push({
      block_type: 2,
      text: {
        elements: [{ text_run: { content: tags.join(' ') } }],
        style: {},
      },
    });
  }

  return blocks;
}

async function getTenantToken(appId: string, appSecret: string): Promise<string> {
  const resp = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const data = (await resp.json()) as { code?: number; msg?: string; tenant_access_token?: string };
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取飞书 tenant_access_token 失败：${data.msg || data.code}`);
  }
  return data.tenant_access_token;
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

  const appId = process.env.FEISHU_APP_ID?.trim();
  const appSecret = process.env.FEISHU_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    res.status(500).json({ error: '云端未配置 FEISHU_APP_ID / FEISHU_APP_SECRET，请在 Vercel 环境变量中设置。' });
    return;
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as FeishuDocRequest;
    const title = (body.title || '').trim() || '未命名文档';
    const post = (body.post || '').trim();
    if (!post) {
      res.status(400).json({ error: '正文不能为空。' });
      return;
    }

    const token = await getTenantToken(appId, appSecret);

    // 1. 创建文档
    const folderToken = process.env.FEISHU_FOLDER_TOKEN?.trim();
    const createBody: Record<string, string> = { title };
    if (folderToken) createBody.folder_token = folderToken;

    const createResp = await fetch('https://open.feishu.cn/open-apis/docx/v1/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(createBody),
    });
    const createData = (await createResp.json()) as {
      code?: number;
      msg?: string;
      data?: { document?: { document_id?: string } };
    };
    if (createData.code !== 0 || !createData.data?.document?.document_id) {
      throw new Error(`创建飞书文档失败：${createData.msg || createData.code}`);
    }
    const documentId = createData.data.document.document_id;

    // 2. 插入正文内容（根 block_id 即 document_id）
    const blocks = buildBlocks(title, post, body.tags);
    const insertResp = await fetch(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ children: blocks, index: 0 }),
      },
    );
    const insertData = (await insertResp.json()) as { code?: number; msg?: string };
    if (insertData.code !== 0) {
      // 文档已创建，即使插入失败也返回链接，方便用户手动补内容
      const domain = body.domain || 'feishu.cn';
      return res.status(200).json({
        url: `https://${domain}/docx/${documentId}`,
        document_id: documentId,
        warning: `文档已创建，但正文写入失败：${insertData.msg || insertData.code}`,
      });
    }

    const domain = body.domain || 'feishu.cn';
    res.status(200).json({
      url: `https://${domain}/docx/${documentId}`,
      document_id: documentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成飞书文档失败。';
    res.status(500).json({ error: message });
  }
}
