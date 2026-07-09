import { BookOpen, FileText, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addKnowledgeDoc,
  deleteKnowledgeDoc,
  listKnowledgeDocs,
  updateKnowledgeDoc,
  type KnowledgeDoc,
} from '../knowledgeBase';
import { isPdfFile, isTextFile, parsePdfFile, parseTextFile } from '../pdfParser';

export function KnowledgeBaseDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listKnowledgeDocs();
      setDocs(list);
    } catch (e) {
      setError('加载知识库失败');
    }
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      let content = '';
      if (isPdfFile(file)) {
        content = await parsePdfFile(file);
      } else if (isTextFile(file)) {
        content = await parseTextFile(file);
      } else {
        throw new Error('不支持的文件格式，请上传 PDF、TXT 或 Markdown 文件');
      }

      if (!content.trim()) {
        throw new Error('文件内容为空，无法提取文本');
      }

      await addKnowledgeDoc({
        name: file.name,
        content: content.trim(),
        enabled: true,
        size: file.size,
      });

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    await updateKnowledgeDoc(id, { enabled });
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('确定删除这个知识库文档吗？')) return;
    await deleteKnowledgeDoc(id);
    await refresh();
  }

  const enabledCount = docs.filter((d) => d.enabled).length;
  const totalChars = docs.reduce((sum, d) => sum + d.content.length, 0);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-[#E8E6F0]/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#7C6BFF]" />
            <h2 className="text-lg font-bold text-[#2D2B55]">知识库</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition hover:bg-[#F5F4FA]">
            <X className="h-5 w-5 text-[#8E8BA8]" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Stats */}
          <div className="mb-4 flex gap-3">
            <div className="flex-1 rounded-xl bg-[#F5F4FA] p-3 text-center">
              <p className="text-lg font-bold text-[#7C6BFF]">{docs.length}</p>
              <p className="text-xs text-[#8E8BA8]">文档数</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#F5F4FA] p-3 text-center">
              <p className="text-lg font-bold text-[#5BC482]">{enabledCount}</p>
              <p className="text-xs text-[#8E8BA8]">已启用</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#F5F4FA] p-3 text-center">
              <p className="text-lg font-bold text-[#E88A50]">{(totalChars / 1000).toFixed(1)}k</p>
              <p className="text-xs text-[#8E8BA8]">总字数</p>
            </div>
          </div>

          {/* Upload */}
          <div className="mb-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#7C6BFF]/30 bg-[#7C6BFF]/5 py-4 text-sm font-semibold text-[#7C6BFF] transition hover:bg-[#7C6BFF]/10 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  解析中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  上传 PDF / TXT / Markdown
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-[#B8B5CC]">
              上传后文档内容会自动附加到所有 AI 生成请求中
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Doc list */}
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`rounded-xl border p-4 transition ${
                  doc.enabled
                    ? 'border-[#7C6BFF]/20 bg-[#7C6BFF]/5'
                    : 'border-[#E8E6F0]/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#8E8BA8]" />
                    <span className="text-sm font-semibold text-[#2D2B55]">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={doc.enabled}
                        onChange={(e) => toggleEnabled(doc.id, e.target.checked)}
                        className="h-4 w-4 accent-[#7C6BFF]"
                      />
                      <span className="text-xs text-[#8E8BA8]">启用</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="rounded p-1 text-[#B8B5CC] transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-[#8E8BA8]">
                  {(doc.content.length / 1000).toFixed(1)}k 字 · {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                </p>

                {/* Expandable content preview */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                  className="mt-2 text-xs font-medium text-[#7C6BFF] transition hover:underline"
                >
                  {expandedId === doc.id ? '收起内容' : '查看内容'}
                </button>
                {expandedId === doc.id && (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-lg bg-white p-3 text-xs leading-5 text-[#2D2B55]">
                    <pre className="whitespace-pre-wrap font-sans">{doc.content}</pre>
                  </div>
                )}
              </div>
            ))}

            {docs.length === 0 && !loading && (
              <div className="py-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-[#E8E6F0]" />
                <p className="mt-3 text-sm text-[#B8B5CC]">知识库为空</p>
                <p className="text-xs text-[#B8B5CC]">上传文档后，AI 会自动引用其中的内容</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
