import { useMemo, useState } from 'react';
import type { HistoryRecord } from '../types';

const HISTORY_KEY = 'ht-generation-history-v2';
const LEGACY_HISTORY_KEY = 'ht-generation-history';
const MAX_HISTORY_COUNT = 50;

function readHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }

    const legacyRaw = localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!legacyRaw) {
      return [];
    }

    const legacyRecords = JSON.parse(legacyRaw);
    if (!Array.isArray(legacyRecords)) {
      return [];
    }

    return legacyRecords
      .map((record): HistoryRecord | null => {
        if (!record?.result) return null;
        return {
          id: String(record.id || Date.now()),
          country: record.country,
          topic: record.topic || '',
          article: record.article || '',
          platform: record.platform,
          angle: record.angle?.title || '',
          scene: record.scene || 'article',
          title: record.result.title || '',
          post: record.result.post || '',
          tags: record.result.tags || [],
          chat: record.result.chat || [],
          createdAt: record.createdAt || new Date().toISOString(),
        };
      })
      .filter(Boolean) as HistoryRecord[];
  } catch {
    return [];
  }
}

function writeHistory(records: HistoryRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY_COUNT)));
}

export function useHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>(() => readHistory());

  function add(record: Omit<HistoryRecord, 'id' | 'createdAt'>) {
    const nextRecord: HistoryRecord = {
      ...record,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [nextRecord, ...records].slice(0, MAX_HISTORY_COUNT);
    setRecords(nextRecords);
    writeHistory(nextRecords);
    return nextRecord;
  }

  function remove(id: string) {
    const nextRecords = records.filter((record) => record.id !== id);
    setRecords(nextRecords);
    writeHistory(nextRecords);
  }

  function clear() {
    setRecords([]);
    writeHistory([]);
  }

  function search(keyword: string) {
    const query = keyword.trim().toLowerCase();
    if (!query) {
      return records;
    }

    return records.filter((record) =>
      [
        record.country,
        record.topic,
        record.article,
        record.platform,
        record.angle,
        record.title,
        record.post,
        record.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }

  const count = useMemo(() => records.length, [records]);

  return {
    records,
    count,
    add,
    remove,
    clear,
    search,
  };
}
