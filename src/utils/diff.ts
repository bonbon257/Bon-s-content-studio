// Lightweight word-level diff for highlighting polish changes.
// Splits on Chinese characters / whitespace boundaries and uses a classic LCS to
// produce {kept, added, removed} segments — enough for inline highlight rendering.

export type DiffOp = 'kept' | 'added' | 'removed';

export interface DiffSegment {
  op: DiffOp;
  value: string;
}

// Tokenize so that:
//  - each CJK character is its own token
//  - latin words / numbers stay as-is
//  - whitespace + punctuation become their own tokens (so they survive)
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const re = /[\p{Script=Han}]|[A-Za-z0-9_]+|\s+|[^\s\p{Script=Han}A-Za-z0-9_]/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

export function diffWords(oldText: string, newText: string): DiffSegment[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const m = a.length;
  const n = b.length;

  // LCS table — cap to avoid blowing up on huge inputs
  const MAX = 4000;
  if (m > MAX || n > MAX) {
    return [
      { op: 'removed', value: oldText },
      { op: 'added', value: newText },
    ];
  }

  const dp: Uint16Array[] = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = dp[i - 1][j] >= dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
      }
    }
  }

  // Backtrack
  const reverse: DiffSegment[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      reverse.push({ op: 'kept', value: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      reverse.push({ op: 'removed', value: a[i - 1] });
      i--;
    } else {
      reverse.push({ op: 'added', value: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    reverse.push({ op: 'removed', value: a[i - 1] });
    i--;
  }
  while (j > 0) {
    reverse.push({ op: 'added', value: b[j - 1] });
    j--;
  }

  // Merge consecutive segments of the same op
  const merged: DiffSegment[] = [];
  for (let k = reverse.length - 1; k >= 0; k--) {
    const seg = reverse[k];
    const last = merged[merged.length - 1];
    if (last && last.op === seg.op) {
      last.value += seg.value;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}
