# 用户偏好记忆系统设计文档

## 1. 背景与目标

用户希望程序能"记住"自己的内容偏好，越用越贴合个人风格，而不是每次都要手动修改。本次实现为**本地记忆（localStorage）**，后续可升级跨设备同步。

## 2. 核心需求

1. **自动学习**：程序静默观察用户的操作（生成、修改、保存、润色），提取偏好模式。
2. **手动配置**：提供"我的偏好"面板，用户可显式写死规则。
3. **注入提示词**：自动偏好 + 手动规则合并后，注入到每次 LLM 生成的 SYSTEM_PROMPT 中。
4. **覆盖机制**：手动规则优先级高于自动学习，用户可随时覆盖。

## 3. 偏好类型

### 3.1 自动学习维度

| 维度 | 观察信号 | 学习逻辑 | 存储格式 |
|------|----------|----------|----------|
| 常用国家 | 每次生成记录 country | 计数排序，Top3 为偏好 | `{country: count}` |
| 常用平台 | 每次生成记录 platform | 计数排序 | `{platform: count}` |
| 角度关键词偏好 | 记录选择的角度标题关键词 | 分词后统计高频词 | `{keywords: count}` |
| 修改指令模式 | 记录 RevisionBox 输入内容 | 提取关键词（更口语化、缩短、加细节等） | `{instructionKeywords: count}` |
| 标签偏好 | 对比生成标签 vs 最终保存标签 | 记录常添加/删除的标签 | `{added: [], removed: []}` |
| 正文长度趋势 | 对比生成版 vs 保存版字数 | 计算平均偏差 | `{avgDelta: number}` |
| 润色方向 | 记录润色操作和结果变化 | 统计润色方向 | `{polishDirections: count}` |

### 3.2 手动配置项

| 配置项 | 类型 | 说明 |
|--------|------|------|
| 写作风格 | 自由文本 | 如"更犀利、吐槽感、少用感叹号" |
| 正文长度目标 | 滑块 100-200 | 默认 150 |
| 必带标签 | 标签列表 | 每次生成必须包含 |
| 禁用标签 | 标签列表 | 每次生成必须排除 |
| 角度偏好 | 自由文本 | 如"优先反常识、生活吐槽" |
| 全局附加指令 | 自由文本 | 每次生成注入，如"外国朋友叫 Emma" |
| 外国朋友人设 | 自由文本 | 如"美国女生，性格开朗，喜欢吐槽" |

## 4. 数据模型

```typescript
// src/types.ts 新增

export interface AutoLearnedPreferences {
  countryFrequency: Record<string, number>;
  platformFrequency: Record<string, number>;
  angleKeywords: Record<string, number>;
  instructionKeywords: Record<string, number>;
  tagAdditions: Record<string, number>;
  tagRemovals: Record<string, number>;
  avgLengthDelta: number; // 正数表示用户倾向于更长，负数表示更短
  lengthSampleCount: number;
  polishDirections: Record<string, number>;
  lastUpdated: string;
}

export interface ManualPreferences {
  writingStyle: string;
  targetLength: number;
  requiredTags: string[];
  forbiddenTags: string[];
  anglePreference: string;
  globalInstruction: string;
  friendPersona: string;
}

export interface UserPreferences {
  auto: AutoLearnedPreferences;
  manual: ManualPreferences;
  version: number;
}
```

## 5. 自动学习触发点

| 触发时机 | 学习内容 | 权重 |
|----------|----------|------|
| 生成内容并保存到历史 | 国家、平台、角度关键词 | 1x |
| 用户修改正文后保存 | 正文长度变化、标签变化 | 2x |
| 使用 RevisionBox 修改 | 修改指令关键词 | 3x |
| 润色标题/正文 | 润色方向 | 2x |
| 手动编辑标签 | 标签增删 | 2x |

## 6. 提示词注入

在 `llm.ts` 中新增 `buildPreferenceContext()` 函数：

```typescript
function buildPreferenceContext(prefs: UserPreferences): string {
  const parts: string[] = [];
  
  // 手动规则（高优先级）
  if (prefs.manual.writingStyle) {
    parts.push(`用户写作风格偏好：${prefs.manual.writingStyle}`);
  }
  if (prefs.manual.targetLength) {
    parts.push(`用户偏好正文长度：约 ${prefs.manual.targetLength} 字`);
  }
  if (prefs.manual.requiredTags.length) {
    parts.push(`用户必带标签：${prefs.manual.requiredTags.join(' ')}`);
  }
  if (prefs.manual.forbiddenTags.length) {
    parts.push(`用户禁用标签：${prefs.manual.forbiddenTags.join(' ')}`);
  }
  if (prefs.manual.anglePreference) {
    parts.push(`用户角度偏好：${prefs.manual.anglePreference}`);
  }
  if (prefs.manual.globalInstruction) {
    parts.push(`用户全局指令：${prefs.manual.globalInstruction}`);
  }
  if (prefs.manual.friendPersona) {
    parts.push(`用户偏好的外国朋友人设：${prefs.manual.friendPersona}`);
  }
  
  // 自动学习（低优先级，作为参考）
  const topCountries = getTopItems(prefs.auto.countryFrequency, 3);
  if (topCountries.length) {
    parts.push(`用户常用国家（自动学习）：${topCountries.join('、')}`);
  }
  
  const topAngleKeywords = getTopItems(prefs.auto.angleKeywords, 5);
  if (topAngleKeywords.length) {
    parts.push(`用户偏好的角度关键词（自动学习）：${topAngleKeywords.join('、')}`);
  }
  
  const topInstructions = getTopItems(prefs.auto.instructionKeywords, 5);
  if (topInstructions.length) {
    parts.push(`用户常见修改方向（自动学习）：${topInstructions.join('、')}`);
  }
  
  if (prefs.auto.avgLengthDelta !== 0) {
    const direction = prefs.auto.avgLengthDelta < 0 ? '偏短' : '偏长';
    parts.push(`用户正文长度倾向（自动学习）：生成后倾向于改${direction}约 ${Math.abs(Math.round(prefs.auto.avgLengthDelta))} 字`);
  }
  
  return parts.length ? `\n\n【用户偏好记忆】\n${parts.join('\n')}\n\n以上偏好仅供参考，不要僵化执行，核心仍是生成高质量内容。` : '';
}
```

注入位置：在 `SYSTEM_PROMPT` 末尾、用户输入之前插入偏好上下文。

## 7. UI 设计

### 7.1 入口

顶部栏新增"我的偏好"按钮，与"配置""页面设计"并列。

### 7.2 面板布局

侧边抽屉（与 ThemeDrawer 同风格）：

- **手动规则区**
  - 写作风格：多行文本输入
  - 正文长度目标：滑块 100-200
  - 必带标签：标签输入器（可添加/删除）
  - 禁用标签：标签输入器
  - 角度偏好：多行文本输入
  - 全局附加指令：多行文本输入
  - 外国朋友人设：多行文本输入

- **自动学习区**
  - 展示自动发现的偏好模式
  - 每个模式可"采纳"（写入手动规则）或"忽略"
  - 提供"重置自动学习"按钮

- **操作区**
  - 保存偏好
  - 恢复默认
  - 关闭

## 8. 文件结构

```
src/
  hooks/
    usePreferences.ts      # 偏好数据管理（CRUD + 学习 + 合并）
  components/
    PreferencesDrawer.tsx  # 偏好面板 UI
  llm.ts                   # 新增 buildPreferenceContext()，修改 SYSTEM_PROMPT 注入
  AppShell.tsx             # 接入自动学习触发点 + 顶部栏按钮
  types.ts                 # 新增 UserPreferences 相关类型
```

## 9. 边界情况

- **首次使用**：无历史数据，自动学习为空，仅依赖手动规则。
- **localStorage 满**：优雅降级，优先保留手动规则，自动学习数据可截断。
- **用户清除浏览器数据**：偏好丢失，需重新学习。后续升级云端同步解决。
- **手动规则与自动学习冲突**：手动规则优先。

## 10. 后续升级路径

1. **云端同步**：将偏好数据同步到后端数据库，跨设备共享。
2. **偏好导入/导出**：支持 JSON 文件备份和恢复。
3. **更智能的学习**：引入更复杂的 NLP 分析，如情感倾向、句式偏好等。
