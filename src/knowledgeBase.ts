const DB_NAME = 'ht-knowledge-base';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export interface KnowledgeDoc {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: string;
  size: number; // bytes
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
  return dbPromise;
}

export async function listKnowledgeDocs(): Promise<KnowledgeDoc[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as KnowledgeDoc[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addKnowledgeDoc(doc: Omit<KnowledgeDoc, 'id' | 'createdAt'>): Promise<KnowledgeDoc> {
  const db = await openDb();
  const fullDoc: KnowledgeDoc = {
    ...doc,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(fullDoc);
    req.onsuccess = () => resolve(fullDoc);
    req.onerror = () => reject(req.error);
  });
}

export async function updateKnowledgeDoc(id: string, updates: Partial<KnowledgeDoc>): Promise<void> {
  const db = await openDb();
  const docs = await listKnowledgeDocs();
  const doc = docs.find((d) => d.id === id);
  if (!doc) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ ...doc, ...updates });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteKnowledgeDoc(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getEnabledKnowledgeContext(): Promise<string> {
  const docs = await listKnowledgeDocs();
  const enabled = docs.filter((d) => d.enabled);
  if (enabled.length === 0) return '';

  const parts = enabled.map((d) => `--- ${d.name} ---\n${d.content}`);
  return parts.join('\n\n');
}

// Limit content to avoid token overflow (approximate: 1 token ~= 4 chars for Chinese)
export function truncateKnowledgeContext(context: string, maxChars: number = 8000): string {
  if (context.length <= maxChars) return context;
  return context.slice(0, maxChars) + '\n\n...(内容已截断，建议精简知识库或拆分为多个文档)';
}
