// PDF parser using CDN-loaded pdf.js (no npm dependency, works on all environments)

let pdfjsLib: any = null;

async function getPdfjs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;

  // Load pdf.js from CDN
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
  script.type = 'module';
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      // pdf.js sets itself on window as pdfjsLib
      pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
        resolve(pdfjsLib);
      } else {
        reject(new Error('pdf.js 加载失败，请检查网络连接'));
      }
    };
    script.onerror = () => reject(new Error('pdf.js CDN 加载失败，请检查网络连接'));
    document.head.appendChild(script);
  });
}

export async function parsePdfFile(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function parseTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isTextFile(file: File): boolean {
  const ext = file.name.toLowerCase();
  return ext.endsWith('.txt') || ext.endsWith('.md') || ext.endsWith('.markdown') || file.type.startsWith('text/');
}
