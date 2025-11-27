import { PDFDocument } from 'pdf-lib';

export interface Chapter {
  id: string;
  title: string;
  level: number;
  startPage: number;
  endPage: number;
  children: Chapter[];
  parent?: string;
}

export interface ParsedPDF {
  fileName: string;
  totalPages: number;
  chapters: Chapter[];
  pdfBytes: ArrayBuffer;
  thumbnails: Map<number, string>;
}

// Outline item type for pdf.js
interface OutlineItem {
  title: string;
  dest: unknown;
  items?: OutlineItem[];
}

// Dynamically load pdf.js only on client side
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjsLib;
}

// Generate thumbnail for a page
async function generateThumbnail(
  pdfDoc: Awaited<ReturnType<Awaited<ReturnType<typeof getPdfJs>>['getDocument']>['promise']>,
  pageNum: number,
  scale: number = 0.6
): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return '';
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // @ts-expect-error - pdf.js types don't match runtime API
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return '';
  }
}

// Extract outline/bookmarks from PDF
async function extractOutline(
  pdfDoc: Awaited<ReturnType<Awaited<ReturnType<typeof getPdfJs>>['getDocument']>['promise']>
): Promise<Chapter[]> {
  try {
    const outline = await pdfDoc.getOutline();
    if (!outline || outline.length === 0) {
      return [];
    }

    const chapters: Chapter[] = [];
    let chapterIndex = 0;

    async function processOutlineItem(
      item: OutlineItem,
      level: number,
      parentId?: string
    ): Promise<Chapter> {
      const id = `chapter-${chapterIndex++}`;
      let startPage = 1;

      // Get page number from destination
      if (item.dest) {
        try {
          let dest: unknown = item.dest;
          if (typeof dest === 'string') {
            dest = await pdfDoc.getDestination(dest) as unknown;
          }
          if (dest && Array.isArray(dest)) {
            const ref = dest[0];
            const pageIndex = await pdfDoc.getPageIndex(ref);
            startPage = pageIndex + 1;
          }
        } catch {
          // Ignore destination errors
        }
      }

      const children: Chapter[] = [];
      if (item.items && item.items.length > 0) {
        for (const child of item.items) {
          children.push(await processOutlineItem(child, level + 1, id));
        }
      }

      return {
        id,
        title: item.title || `Section ${chapterIndex}`,
        level,
        startPage,
        endPage: startPage, // Will be calculated later
        children,
        parent: parentId,
      };
    }

    for (const item of outline as OutlineItem[]) {
      chapters.push(await processOutlineItem(item, 0));
    }

    return chapters;
  } catch {
    return [];
  }
}

// Calculate end pages for chapters
function calculateEndPages(chapters: Chapter[], totalPages: number): Chapter[] {
  const flatChapters: Chapter[] = [];
  
  function flatten(items: Chapter[]) {
    for (const item of items) {
      flatChapters.push(item);
      if (item.children.length > 0) {
        flatten(item.children);
      }
    }
  }
  
  flatten(chapters);
  
  // Sort by start page
  flatChapters.sort((a, b) => a.startPage - b.startPage);
  
  // Calculate end pages
  for (let i = 0; i < flatChapters.length; i++) {
    const current = flatChapters[i];
    const next = flatChapters[i + 1];
    
    if (next) {
      current.endPage = next.startPage - 1;
    } else {
      current.endPage = totalPages;
    }
    
    // Ensure end page is at least start page
    if (current.endPage < current.startPage) {
      current.endPage = current.startPage;
    }
  }
  
  return chapters;
}

// Try to detect chapters from text content when no outline exists
async function detectChaptersFromText(
  pdfDoc: Awaited<ReturnType<Awaited<ReturnType<typeof getPdfJs>>['getDocument']>['promise']>
): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  const totalPages = pdfDoc.numPages;
  
  // Common chapter patterns
  const chapterPatterns = [
    /^(Chapter|CHAPTER)\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*)/i,
    /^(Part|PART)\s+(\d+|[IVXLCDM]+)[\s:.-]*(.*)/i,
    /^(Section|SECTION)\s+(\d+\.?\d*)[\s:.-]*(.*)/i,
    /^(\d+\.)\s+([A-Z][^.]*)/,
    /^(\d+\.\d+)\s+([A-Z][^.]*)/,
    /^([IVXLCDM]+)[\s.]+([A-Z][^.]*)/,
  ];
  
  let chapterIndex = 0;
  
  for (let pageNum = 1; pageNum <= Math.min(totalPages, 50); pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item): item is { str: string; dir: string; transform: number[]; width: number; height: number; hasEOL: boolean; fontName: string } => 
          'str' in item && typeof (item as { str?: unknown }).str === 'string'
        )
        .map(item => item.str)
        .join(' ');
      
      // Check first few lines for chapter headings
      const lines = pageText.split(/\s{2,}/).slice(0, 5);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        for (const pattern of chapterPatterns) {
          const match = trimmedLine.match(pattern);
          if (match) {
            const title = match[3] 
              ? `${match[1]} ${match[2]}: ${match[3].trim()}`
              : `${match[1]} ${match[2]}`;
            
            chapters.push({
              id: `chapter-${chapterIndex++}`,
              title: title.substring(0, 100),
              level: match[1].toLowerCase().includes('part') ? 0 : 1,
              startPage: pageNum,
              endPage: pageNum,
              children: [],
            });
            break;
          }
        }
      }
    } catch {
      // Ignore page errors
    }
  }
  
  // Remove duplicates based on similar titles
  const uniqueChapters: Chapter[] = [];
  for (const chapter of chapters) {
    const isDuplicate = uniqueChapters.some(
      c => c.startPage === chapter.startPage || 
           c.title.toLowerCase() === chapter.title.toLowerCase()
    );
    if (!isDuplicate) {
      uniqueChapters.push(chapter);
    }
  }
  
  return uniqueChapters;
}

// Parse PDF and extract structure
export async function parsePDF(file: File): Promise<ParsedPDF> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await getPdfJs();
  
  // Load with PDF.js to extract outline
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  
  const totalPages = pdfDoc.numPages;
  
  // Try to extract outline first
  let chapters = await extractOutline(pdfDoc);
  
  // If no outline, try to detect chapters from text
  if (chapters.length === 0) {
    chapters = await detectChaptersFromText(pdfDoc);
  }
  
  // If still no chapters, create page-based structure
  if (chapters.length === 0) {
    // Group pages into chunks of 10 for easier selection
    const pagesPerChunk = Math.max(1, Math.ceil(totalPages / 10));
    for (let i = 0; i < totalPages; i += pagesPerChunk) {
      const startPage = i + 1;
      const endPage = Math.min(i + pagesPerChunk, totalPages);
      chapters.push({
        id: `pages-${startPage}-${endPage}`,
        title: endPage === startPage ? `Page ${startPage}` : `Pages ${startPage}-${endPage}`,
        level: 0,
        startPage,
        endPage,
        children: [],
      });
    }
  } else {
    // Calculate end pages for chapters
    chapters = calculateEndPages(chapters, totalPages);
  }
  
  // Generate thumbnails for chapter start pages
  const thumbnails = new Map<number, string>();
  const pagesToRender = new Set<number>();
  
  function collectPages(items: Chapter[]) {
    for (const item of items) {
      pagesToRender.add(item.startPage);
      collectPages(item.children);
    }
  }
  collectPages(chapters);
  
  // Limit thumbnails to first 20 unique pages for performance
  const pagesToRenderArray = Array.from(pagesToRender).slice(0, 20);
  
  for (const pageNum of pagesToRenderArray) {
    const thumbnail = await generateThumbnail(pdfDoc, pageNum);
    if (thumbnail) {
      thumbnails.set(pageNum, thumbnail);
    }
  }
  
  return {
    fileName: file.name,
    totalPages,
    chapters,
    pdfBytes: arrayBuffer,
    thumbnails,
  };
}

// Split PDF by selected chapters
export async function splitPDF(
  pdfBytes: ArrayBuffer,
  chapters: Chapter[]
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const results: { name: string; bytes: Uint8Array }[] = [];
  
  for (const chapter of chapters) {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const newDoc = await PDFDocument.create();
    
    const pageIndices: number[] = [];
    for (let i = chapter.startPage - 1; i < chapter.endPage; i++) {
      pageIndices.push(i);
    }
    
    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach(page => newDoc.addPage(page));
    
    const pdfBytesSplit = await newDoc.save();
    
    // Sanitize filename
    const sanitizedTitle = chapter.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    results.push({
      name: `${sanitizedTitle}.pdf`,
      bytes: pdfBytesSplit,
    });
  }
  
  return results;
}

// Merge multiple chapter selections into one PDF with bookmarks
export async function mergePDFs(
  pdfBytes: ArrayBuffer,
  chapters: Chapter[]
): Promise<Uint8Array> {
  const { PDFName, PDFArray, PDFDict, PDFString } = await import('pdf-lib');
  
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  
  // Sort chapters by start page
  const sortedChapters = [...chapters].sort((a, b) => a.startPage - b.startPage);
  
  // Collect all page indices (removing duplicates) and track chapter start pages
  const pageIndicesSet = new Set<number>();
  for (const chapter of sortedChapters) {
    for (let i = chapter.startPage - 1; i < chapter.endPage; i++) {
      pageIndicesSet.add(i);
    }
  }
  
  const pageIndices = Array.from(pageIndicesSet).sort((a, b) => a - b);
  
  // Create mapping from original page index to new page index
  const pageMapping = new Map<number, number>();
  pageIndices.forEach((originalIndex, newIndex) => {
    pageMapping.set(originalIndex, newIndex);
  });
  
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach(page => newDoc.addPage(page));
  
  // Add bookmarks/outlines for each chapter
  try {
    const pages = newDoc.getPages();
    
    // Create outline items for each chapter
    const outlineItems: { title: string; pageIndex: number }[] = [];
    
    for (const chapter of sortedChapters) {
      const originalPageIndex = chapter.startPage - 1;
      const newPageIndex = pageMapping.get(originalPageIndex);
      
      if (newPageIndex !== undefined) {
        outlineItems.push({
          title: chapter.title,
          pageIndex: newPageIndex,
        });
      }
    }
    
    // Only add outlines if we have items
    if (outlineItems.length > 0) {
      // Create the outline dictionary structure
      const context = newDoc.context;
      
      // Create outline item refs
      const outlineItemRefs: ReturnType<typeof context.nextRef>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outlineItemDicts: any[] = [];
      
      for (let i = 0; i < outlineItems.length; i++) {
        const item = outlineItems[i];
        const page = pages[item.pageIndex];
        
        // Create destination array [page, /Fit]
        const destArray = PDFArray.withContext(context);
        destArray.push(page.ref);
        destArray.push(PDFName.of('Fit'));
        
        // Create outline item dictionary
        const outlineItem = PDFDict.withContext(context);
        outlineItem.set(PDFName.of('Title'), PDFString.of(item.title));
        outlineItem.set(PDFName.of('Dest'), destArray);
        
        const itemRef = context.register(outlineItem);
        outlineItemRefs.push(itemRef);
        outlineItemDicts.push(outlineItem);
      }
      
      // Link outline items (Prev/Next)
      for (let i = 0; i < outlineItemDicts.length; i++) {
        if (i > 0) {
          outlineItemDicts[i].set(PDFName.of('Prev'), outlineItemRefs[i - 1]);
        }
        if (i < outlineItemDicts.length - 1) {
          outlineItemDicts[i].set(PDFName.of('Next'), outlineItemRefs[i + 1]);
        }
      }
      
      // Create outlines dictionary
      const outlines = PDFDict.withContext(context);
      outlines.set(PDFName.of('Type'), PDFName.of('Outlines'));
      outlines.set(PDFName.of('First'), outlineItemRefs[0]);
      outlines.set(PDFName.of('Last'), outlineItemRefs[outlineItemRefs.length - 1]);
      outlines.set(PDFName.of('Count'), context.obj(outlineItems.length));
      
      // Set parent for all items
      const outlinesRef = context.register(outlines);
      for (const itemDict of outlineItemDicts) {
        itemDict.set(PDFName.of('Parent'), outlinesRef);
      }
      
      // Add outlines to catalog
      const catalog = newDoc.catalog;
      catalog.set(PDFName.of('Outlines'), outlinesRef);
      
      // Set page mode to show outlines
      catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
    }
  } catch (err) {
    // If outline creation fails, still return the merged PDF without outlines
    console.warn('Failed to create PDF outlines:', err);
  }
  
  return await newDoc.save();
}

// Extract specific page range
export async function extractPages(
  pdfBytes: ArrayBuffer,
  startPage: number,
  endPage: number
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  
  const pageIndices: number[] = [];
  for (let i = startPage - 1; i < endPage; i++) {
    pageIndices.push(i);
  }
  
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach(page => newDoc.addPage(page));
  
  return await newDoc.save();
}

// Download helper
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download multiple files as zip (simple sequential download)
export async function downloadMultiple(files: { name: string; bytes: Uint8Array }[]) {
  for (const file of files) {
    const blob = new Blob([new Uint8Array(file.bytes)], { type: 'application/pdf' });
    downloadBlob(blob, file.name);
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
