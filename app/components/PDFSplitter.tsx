'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  parsePDF,
  splitPDF,
  mergePDFs,
  downloadBlob,
  downloadMultiple,
  type ParsedPDF,
  type Chapter,
} from '../lib/pdf-utils';

interface ChapterItemProps {
  chapter: Chapter;
  selectedChapters: Set<string>;
  onToggle: (chapter: Chapter) => void;
  onPreview: (chapter: Chapter) => void;
  thumbnail?: string;
  depth?: number;
  chapterIndex: number;
  focusedChapterIndex: number;
  allChapters: Chapter[];
  getThumbnail: (page: number) => string | undefined;
  getSelectionState: (chapter: Chapter, selected: Set<string>) => 'none' | 'partial' | 'all';
}

function ChapterItem({ 
  chapter, 
  selectedChapters, 
  onToggle, 
  onPreview, 
  thumbnail, 
  depth = 0,
  chapterIndex,
  focusedChapterIndex,
  allChapters,
  getThumbnail,
  getSelectionState,
}: ChapterItemProps) {
  const selectionState = getSelectionState(chapter, selectedChapters);
  const isSelected = selectionState === 'all';
  const isPartial = selectionState === 'partial';
  const isFocused = chapterIndex === focusedChapterIndex;
  const pageRange = chapter.startPage === chapter.endPage 
    ? `p.${chapter.startPage}` 
    : `pp.${chapter.startPage}-${chapter.endPage}`;
  const pageCount = chapter.endPage - chapter.startPage + 1;
  const hasChildren = chapter.children.length > 0;

  return (
    <div className="chapter-item" data-chapter-index={chapterIndex}>
      <div
        className={`chapter-button ${isSelected ? 'selected' : ''} ${isPartial ? 'partial' : ''} ${isFocused ? 'focused' : ''}`}
        style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
      >
        <button
          onClick={() => onToggle(chapter)}
          className="chapter-select-area"
          aria-label={`Select ${chapter.title}${hasChildren ? ' and all sub-chapters' : ''}`}
        >
          <span className={`chapter-checkbox ${isPartial ? 'partial' : ''}`}>
            {isSelected && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isPartial && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            )}
          </span>
          {thumbnail && (
            <div className="chapter-thumbnail">
              <img src={thumbnail} alt={`Preview of ${chapter.title}`} />
            </div>
          )}
          <div className="chapter-info">
            <span className="chapter-title">{chapter.title}</span>
            <span className="chapter-meta">
              {pageRange} • {pageCount} page{pageCount !== 1 ? 's' : ''}
            </span>
          </div>
        </button>
        <button
          onClick={() => onPreview(chapter)}
          className="chapter-preview-btn"
          aria-label={`Preview ${chapter.title}`}
          title="Quick preview (Enter)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
      {chapter.children.length > 0 && (
        <div className="chapter-children">
          {chapter.children.map(child => {
            const childIndex = allChapters.findIndex(c => c.id === child.id);
            return (
              <ChapterItem
                key={child.id}
                chapter={child}
                selectedChapters={selectedChapters}
                onToggle={onToggle}
                onPreview={onPreview}
                thumbnail={getThumbnail(child.startPage)}
                depth={depth + 1}
                chapterIndex={childIndex}
                focusedChapterIndex={focusedChapterIndex}
                allChapters={allChapters}
                getThumbnail={getThumbnail}
                getSelectionState={getSelectionState}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PreviewModalProps {
  chapter: Chapter;
  thumbnail?: string;
  onClose: () => void;
  onSelect: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onNavigateTo: (index: number) => void;
  isSelected: boolean;
  currentIndex: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  chaptersTree: Chapter[];
  allChapters: Chapter[];
  selectedChapters: Set<string>;
}

interface TreeItemProps {
  chapter: Chapter;
  currentChapterId: string;
  allChapters: Chapter[];
  selectedChapters: Set<string>;
  onNavigateTo: (index: number) => void;
  depth?: number;
}

function TreeItem({ chapter, currentChapterId, allChapters, selectedChapters, onNavigateTo, depth = 0 }: TreeItemProps) {
  const isCurrent = chapter.id === currentChapterId;
  const isSelected = selectedChapters.has(chapter.id);
  const chapterIndex = allChapters.findIndex(c => c.id === chapter.id);
  
  return (
    <div className="tree-item">
      <button
        className={`tree-item-btn ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => onNavigateTo(chapterIndex)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="tree-item-indicator">
          {isCurrent && (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="4" />
            </svg>
          )}
          {!isCurrent && isSelected && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="tree-item-title">{chapter.title}</span>
      </button>
      {chapter.children.length > 0 && (
        <div className="tree-children">
          {chapter.children.map(child => (
            <TreeItem
              key={child.id}
              chapter={child}
              currentChapterId={currentChapterId}
              allChapters={allChapters}
              selectedChapters={selectedChapters}
              onNavigateTo={onNavigateTo}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewModal({ 
  chapter, 
  thumbnail, 
  onClose, 
  onSelect, 
  onPrevious,
  onNext,
  onNavigateTo,
  isSelected,
  currentIndex,
  totalCount,
  hasPrevious,
  hasNext,
  chaptersTree,
  allChapters,
  selectedChapters,
}: PreviewModalProps) {
  const pageCount = chapter.endPage - chapter.startPage + 1;
  const modalRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext) onNext();
          break;
        case 'ArrowUp':
          if (hasPrevious) onPrevious();
          break;
        case 'ArrowDown':
          if (hasNext) onNext();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          onSelect();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, onSelect, hasPrevious, hasNext]);

  // Handle touch swipe for mobile navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Only trigger if horizontal swipe is more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && hasPrevious) {
        onPrevious();
      } else if (deltaX < 0 && hasNext) {
        onNext();
      }
    }
  }, [hasPrevious, hasNext, onPrevious, onNext]);

  // Scroll current item into view in tree
  useEffect(() => {
    if (treeRef.current) {
      const currentItem = treeRef.current.querySelector('.tree-item-btn.current');
      if (currentItem) {
        currentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [chapter.id]);
  
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${chapter.title}`}
    >
      <div className="modal-with-sidebar" onClick={e => e.stopPropagation()}>
        {/* Sidebar with chapter tree */}
        <div className="modal-sidebar">
          <div className="modal-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Contents</span>
          </div>
          <div className="modal-sidebar-tree" ref={treeRef}>
            {chaptersTree.map(ch => (
              <TreeItem
                key={ch.id}
                chapter={ch}
                currentChapterId={chapter.id}
                allChapters={allChapters}
                selectedChapters={selectedChapters}
                onNavigateTo={onNavigateTo}
              />
            ))}
          </div>
        </div>

        {/* Main preview content */}
        <div 
          ref={modalRef}
          className="modal-content" 
          tabIndex={-1}
        >
          <div className="modal-nav-header">
            <span className="modal-counter">{currentIndex + 1} of {totalCount}</span>
            <button className="modal-close" onClick={onClose} aria-label="Close preview (Esc)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div 
            className="modal-preview-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button 
              className={`modal-nav-btn prev ${!hasPrevious ? 'disabled' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (hasPrevious) onPrevious(); }}
              disabled={!hasPrevious}
              aria-label="Previous chapter (←)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="modal-preview">
              {thumbnail ? (
                <img src={thumbnail} alt={`Preview of ${chapter.title}`} draggable={false} />
              ) : (
                <div className="modal-no-preview">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Preview not available</span>
                </div>
              )}
            </div>
            
            <button 
              className={`modal-nav-btn next ${!hasNext ? 'disabled' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (hasNext) onNext(); }}
              disabled={!hasNext}
              aria-label="Next chapter (→)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="modal-details">
            <h3>{chapter.title}</h3>
            <p>Pages {chapter.startPage} - {chapter.endPage} ({pageCount} page{pageCount !== 1 ? 's' : ''})</p>
            <button
              className={`modal-select-btn ${isSelected ? 'selected' : ''}`}
              onClick={onSelect}
            >
              {isSelected ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Selection
                </>
              )}
            </button>
            <p className="modal-keyboard-hint">
              <kbd>←</kbd> <kbd>→</kbd> navigate • <kbd>Space</kbd> select • <kbd>Esc</kbd> close
            </p>
            <p className="modal-swipe-hint">
              Swipe left/right to navigate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutsPanel() {
  return (
    <aside className="shortcuts-panel">
      <div className="shortcuts-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        </svg>
        <span>Keyboard Shortcuts</span>
      </div>
      
      <div className="shortcuts-section">
        <h4>Navigation</h4>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>↑</kbd> <kbd>↓</kbd></span>
          <span className="shortcut-desc">Navigate chapters</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>Enter</kbd></span>
          <span className="shortcut-desc">Open preview</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>Esc</kbd></span>
          <span className="shortcut-desc">Close preview</span>
        </div>
      </div>
      
      <div className="shortcuts-section">
        <h4>Selection</h4>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>Space</kbd></span>
          <span className="shortcut-desc">Toggle selection</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>⌘</kbd><kbd>A</kbd></span>
          <span className="shortcut-desc">Select all</span>
        </div>
      </div>
      
      <div className="shortcuts-section">
        <h4>Actions</h4>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>⌘</kbd><kbd>O</kbd></span>
          <span className="shortcut-desc">Open file</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>⌘</kbd><kbd>D</kbd></span>
          <span className="shortcut-desc">Download files</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>D</kbd></span>
          <span className="shortcut-desc">Download merged</span>
        </div>
      </div>

      <div className="shortcuts-section">
        <h4>In Preview</h4>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>←</kbd> <kbd>→</kbd></span>
          <span className="shortcut-desc">Prev/Next chapter</span>
        </div>
        <div className="shortcut-item">
          <span className="shortcut-keys"><kbd>Space</kbd></span>
          <span className="shortcut-desc">Toggle selection</span>
        </div>
      </div>

      <div className="shortcuts-tip">
        <span>💡</span>
        <p>Selecting a parent chapter automatically selects all sub-chapters</p>
      </div>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-attribution">
            Built by{' '}
            <a href="https://razeenali.com" target="_blank" rel="noopener noreferrer">
              Razeen Ali
            </a>
          </p>
          <div className="footer-links">
            <a
              href="https://github.com/r4z33n4l1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://linkedin.com/in/razeenali"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="https://razeenali.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </a>
          </div>
        </div>
        <a 
          href="https://www.producthunt.com/products/pdf-chapter-splitter?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-pdf-chapter-splitter" 
          target="_blank"
          rel="noopener noreferrer"
          className="product-hunt-badge"
        >
          <img 
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1043327&theme=dark&t=1764288035466" 
            alt="PDF Chapter Splitter - Extract & split pdf chapters online free | Product Hunt" 
            width="250" 
            height="54" 
          />
        </a>
      </div>
    </footer>
  );
}

export default function PDFSplitter() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPDF, setParsedPDF] = useState<ParsedPDF | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [previewChapterIndex, setPreviewChapterIndex] = useState<number | null>(null);
  const [focusedChapterIndex, setFocusedChapterIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'all' | 'selected'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chaptersListRef = useRef<HTMLDivElement>(null);

  // Flatten all chapters for navigation
  const getAllChapters = useCallback((): Chapter[] => {
    if (!parsedPDF) return [];
    const all: Chapter[] = [];
    
    function collect(chapters: Chapter[]) {
      for (const chapter of chapters) {
        all.push(chapter);
        if (chapter.children.length > 0) {
          collect(chapter.children);
        }
      }
    }
    
    collect(parsedPDF.chapters);
    return all;
  }, [parsedPDF]);

  const allChapters = getAllChapters();
  const previewChapter = previewChapterIndex !== null ? allChapters[previewChapterIndex] : null;

  const openPreview = useCallback((chapter: Chapter) => {
    const index = allChapters.findIndex(c => c.id === chapter.id);
    if (index !== -1) {
      setPreviewChapterIndex(index);
    }
  }, [allChapters]);

  const navigatePreview = useCallback((direction: 'prev' | 'next') => {
    if (previewChapterIndex === null) return;
    
    if (direction === 'prev' && previewChapterIndex > 0) {
      setPreviewChapterIndex(previewChapterIndex - 1);
    } else if (direction === 'next' && previewChapterIndex < allChapters.length - 1) {
      setPreviewChapterIndex(previewChapterIndex + 1);
    }
  }, [previewChapterIndex, allChapters.length]);

  // Scroll focused chapter into view
  useEffect(() => {
    if (parsedPDF && chaptersListRef.current && focusedChapterIndex >= 0) {
      const focusedElement = chaptersListRef.current.querySelector(`[data-chapter-index="${focusedChapterIndex}"]`);
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedChapterIndex, parsedPDF]);

  // Reset focused index when PDF changes
  useEffect(() => {
    if (parsedPDF) {
      setFocusedChapterIndex(0);
    }
  }, [parsedPDF]);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size too large. Please use a PDF under 100MB.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setParsedPDF(null);
    setSelectedChapters(new Set());
    setLoadingProgress('Reading PDF...');

    try {
      setLoadingProgress('Analyzing structure...');
      const parsed = await parsePDF(file);
      setLoadingProgress('Generating previews...');
      setParsedPDF(parsed);
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to parse PDF. The file might be corrupted or password protected.');
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Helper to get all descendant IDs of a chapter
  const getDescendantIds = useCallback((chapter: Chapter): string[] => {
    const ids: string[] = [];
    function collect(ch: Chapter) {
      for (const child of ch.children) {
        ids.push(child.id);
        collect(child);
      }
    }
    collect(chapter);
    return ids;
  }, []);

  // Helper to check if chapter has partial selection (some but not all children selected)
  const getSelectionState = useCallback((chapter: Chapter, selected: Set<string>): 'none' | 'partial' | 'all' => {
    if (chapter.children.length === 0) {
      return selected.has(chapter.id) ? 'all' : 'none';
    }
    
    const descendantIds = getDescendantIds(chapter);
    const selectedDescendants = descendantIds.filter(id => selected.has(id)).length;
    
    if (selectedDescendants === 0 && !selected.has(chapter.id)) {
      return 'none';
    } else if (selectedDescendants === descendantIds.length && selected.has(chapter.id)) {
      return 'all';
    } else {
      return 'partial';
    }
  }, [getDescendantIds]);

  const toggleChapter = useCallback((chapter: Chapter) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev);
      const descendantIds = getDescendantIds(chapter);
      
      if (newSet.has(chapter.id)) {
        // Deselect this chapter and all descendants
        newSet.delete(chapter.id);
        for (const id of descendantIds) {
          newSet.delete(id);
        }
      } else {
        // Select this chapter and all descendants
        newSet.add(chapter.id);
        for (const id of descendantIds) {
          newSet.add(id);
        }
      }
      return newSet;
    });
  }, [getDescendantIds]);

  const selectAll = useCallback(() => {
    if (!parsedPDF) return;
    const allIds = new Set<string>();
    
    function collectIds(chapters: Chapter[]) {
      for (const chapter of chapters) {
        allIds.add(chapter.id);
        collectIds(chapter.children);
      }
    }
    
    collectIds(parsedPDF.chapters);
    setSelectedChapters(allIds);
  }, [parsedPDF]);

  const selectNone = useCallback(() => {
    setSelectedChapters(new Set());
  }, []);

  const getSelectedChapterObjects = useCallback((): Chapter[] => {
    if (!parsedPDF) return [];
    const selected: Chapter[] = [];
    
    function findSelected(chapters: Chapter[]) {
      for (const chapter of chapters) {
        if (selectedChapters.has(chapter.id)) {
          selected.push(chapter);
        }
        findSelected(chapter.children);
      }
    }
    
    findSelected(parsedPDF.chapters);
    return selected;
  }, [parsedPDF, selectedChapters]);

  const getTotalSelectedPages = useCallback((): number => {
    const chapters = getSelectedChapterObjects();
    const pages = new Set<number>();
    for (const chapter of chapters) {
      for (let i = chapter.startPage; i <= chapter.endPage; i++) {
        pages.add(i);
      }
    }
    return pages.size;
  }, [getSelectedChapterObjects]);

  const handleDownloadIndividual = useCallback(async () => {
    if (!parsedPDF) return;
    const chapters = getSelectedChapterObjects();
    if (chapters.length === 0) return;

    setIsProcessing(true);
    try {
      const files = await splitPDF(parsedPDF.pdfBytes, chapters);
      await downloadMultiple(files);
    } catch (err) {
      console.error('Error splitting PDF:', err);
      setError('Failed to split PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedPDF, getSelectedChapterObjects]);

  const handleDownloadMerged = useCallback(async () => {
    if (!parsedPDF) return;
    const chapters = getSelectedChapterObjects();
    if (chapters.length === 0) return;

    setIsProcessing(true);
    try {
      const bytes = await mergePDFs(parsedPDF.pdfBytes, chapters);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const baseName = parsedPDF.fileName.replace('.pdf', '');
      downloadBlob(blob, `${baseName}_selected.pdf`);
    } catch (err) {
      console.error('Error merging PDF:', err);
      setError('Failed to merge PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedPDF, getSelectedChapterObjects]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Don't handle if preview modal is open (it has its own handlers)
      if (previewChapterIndex !== null) return;
      
      // Ctrl/Cmd+O to open file dialog
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        if (!isLoading) {
          fileInputRef.current?.click();
        }
        return;
      }
      
      // Only handle these shortcuts when PDF is loaded
      if (!parsedPDF || isLoading || isProcessing) return;
      
      // Ctrl/Cmd+D for download individual
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'd') {
        e.preventDefault();
        if (selectedChapters.size > 0) {
          handleDownloadIndividual();
        }
        return;
      }
      
      // Ctrl/Cmd+Shift+D for download merged
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (selectedChapters.size > 0) {
          handleDownloadMerged();
        }
        return;
      }
      
      // Arrow keys for chapter navigation
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedChapterIndex(prev => {
          if (e.key === 'ArrowUp') {
            return Math.max(0, prev - 1);
          } else {
            return Math.min(allChapters.length - 1, prev + 1);
          }
        });
        return;
      }
      
      // Space to toggle selection of focused chapter
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const focusedChapter = allChapters[focusedChapterIndex];
        if (focusedChapter) {
          toggleChapter(focusedChapter);
        }
        return;
      }
      
      // Enter to open preview of focused chapter
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPreviewChapterIndex(focusedChapterIndex);
        return;
      }
      
      // Ctrl/Cmd+A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyboard);
    return () => window.removeEventListener('keydown', handleGlobalKeyboard);
  }, [
    previewChapterIndex, 
    isLoading, 
    isProcessing, 
    parsedPDF, 
    selectedChapters.size, 
    allChapters, 
    focusedChapterIndex, 
    handleDownloadIndividual, 
    handleDownloadMerged, 
    toggleChapter,
    selectAll
  ]);

  const reset = useCallback(() => {
    setParsedPDF(null);
    setSelectedChapters(new Set());
    setError(null);
    setPreviewChapterIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="splitter-wrapper">
      <div className="splitter-container">
        {!parsedPDF ? (
          <div className="upload-section">
            <div className="brand">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  <path d="M13 3v6h6" />
                </svg>
              </div>
              <h1>PDF Chapter Splitter</h1>
              <p>Extract specific chapters or sections from your PDF documents. 100% client-side — your files never leave your device.</p>
            </div>

            <div
              className={`dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInput}
                hidden
              />
              {isLoading ? (
                <div className="loading">
                  <div className="spinner" />
                  <span>{loadingProgress || 'Processing...'}</span>
                </div>
              ) : (
                <>
                  <div className="dropzone-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <span className="dropzone-text">
                    Drop your PDF here or <span className="browse-link">browse</span>
                  </span>
                  <span className="dropzone-hint">
                    Supports PDFs with bookmarks, chapters, or any structure
                  </span>
                  <span className="dropzone-shortcut">
                    <kbd>⌘</kbd><kbd>O</kbd> or <kbd>Ctrl</kbd><kbd>O</kbd> to open
                  </span>
                </>
              )}
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="features">
              <div className="feature">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
                  </svg>
                </div>
                <h3>100% Private</h3>
                <p>All processing happens in your browser</p>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    <path d="M9 12h6m-6 4h6" />
                  </svg>
                </div>
                <h3>Smart Detection</h3>
                <p>Auto-detects chapters, parts & sections</p>
              </div>
              <div className="feature">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3>Preview & Export</h3>
                <p>See thumbnails before downloading</p>
              </div>
            </div>

            <div className="suggestions">
              <h4>💡 Pro Tips</h4>
              <ul>
                <li>Select multiple chapters to download them as separate files</li>
                <li>Use &ldquo;Merge &amp; Download&rdquo; to combine selected chapters</li>
                <li>Click the eye icon to preview any chapter before selecting</li>
                <li>Works best with PDFs that have bookmarks/table of contents</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="chapters-layout">
            <div className="chapters-section">
            <div className="chapters-header">
              <button className="back-button" onClick={reset} aria-label="Go back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="file-info">
                <h2>{parsedPDF.fileName}</h2>
                <p>{parsedPDF.totalPages} pages • {parsedPDF.chapters.length} sections detected</p>
              </div>
            </div>

            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                All Chapters
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'selected' ? 'active' : ''}`}
                onClick={() => setViewMode('selected')}
                disabled={selectedChapters.size === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Selected ({selectedChapters.size})
              </button>
            </div>

            <div className="selection-controls">
              <button onClick={selectAll} className="control-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Select All
              </button>
              <button onClick={selectNone} className="control-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Clear
              </button>
              <span className="selection-count">
                {selectedChapters.size} section{selectedChapters.size !== 1 ? 's' : ''} • {getTotalSelectedPages()} pages
              </span>
            </div>

            {viewMode === 'all' ? (
              <div className="chapters-list" ref={chaptersListRef}>
                {parsedPDF.chapters.map(chapter => {
                  const chapterIndex = allChapters.findIndex(c => c.id === chapter.id);
                  return (
                    <ChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      selectedChapters={selectedChapters}
                      onToggle={toggleChapter}
                      onPreview={openPreview}
                      thumbnail={parsedPDF.thumbnails.get(chapter.startPage)}
                      chapterIndex={chapterIndex}
                      focusedChapterIndex={focusedChapterIndex}
                      allChapters={allChapters}
                      getThumbnail={(page) => parsedPDF.thumbnails.get(page)}
                      getSelectionState={getSelectionState}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="selected-chapters-list">
                <div className="selected-chapters-header">
                  <h3>Selected for Download</h3>
                  <p>{selectedChapters.size} section{selectedChapters.size !== 1 ? 's' : ''} • {getTotalSelectedPages()} pages total</p>
                </div>
                {getSelectedChapterObjects().length === 0 ? (
                  <div className="selected-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No chapters selected</p>
                    <button onClick={() => setViewMode('all')} className="back-to-all-btn">
                      Browse all chapters
                    </button>
                  </div>
                ) : (
                  <div className="selected-items">
                    {getSelectedChapterObjects()
                      .sort((a, b) => a.startPage - b.startPage)
                      .map((chapter, index) => {
                        const pageCount = chapter.endPage - chapter.startPage + 1;
                        return (
                          <div key={chapter.id} className="selected-item">
                            <span className="selected-item-number">{index + 1}</span>
                            <div className="selected-item-thumbnail">
                              {parsedPDF.thumbnails.get(chapter.startPage) ? (
                                <img 
                                  src={parsedPDF.thumbnails.get(chapter.startPage)} 
                                  alt={chapter.title}
                                />
                              ) : (
                                <div className="thumbnail-placeholder">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="selected-item-info">
                              <span className="selected-item-title">{chapter.title}</span>
                              <span className="selected-item-pages">
                                Pages {chapter.startPage}-{chapter.endPage} ({pageCount} page{pageCount !== 1 ? 's' : ''})
                              </span>
                            </div>
                            <button
                              className="selected-item-remove"
                              onClick={() => toggleChapter(chapter)}
                              aria-label={`Remove ${chapter.title}`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="download-section">
              <div className="download-info">
                {selectedChapters.size === 0 ? (
                  <p>Select chapters above to enable downloads</p>
                ) : (
                  <p>
                    Ready to download <strong>{selectedChapters.size}</strong> section{selectedChapters.size !== 1 ? 's' : ''} ({getTotalSelectedPages()} pages)
                  </p>
                )}
              </div>
              <div className="download-actions">
                <button
                  className="download-button individual"
                  onClick={handleDownloadIndividual}
                  disabled={selectedChapters.size === 0 || isProcessing}
                  title="Ctrl/Cmd+D"
                >
                  {isProcessing ? (
                    <div className="spinner small" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  <span>
                    Download {selectedChapters.size > 1 ? `${selectedChapters.size} Files` : 'File'}
                  </span>
                </button>
                <button
                  className="download-button merged"
                  onClick={handleDownloadMerged}
                  disabled={selectedChapters.size === 0 || isProcessing}
                  title="Ctrl/Cmd+Shift+D"
                >
                  {isProcessing ? (
                    <div className="spinner small" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  )}
                  <span>Merge & Download</span>
                </button>
              </div>
              <p className="keyboard-hints-mobile">
                <kbd>↑</kbd><kbd>↓</kbd> navigate • <kbd>Space</kbd> select • <kbd>Enter</kbd> preview
              </p>
            </div>
          </div>
          <ShortcutsPanel />
        </div>
        )}
      </div>
      
      <Footer />
      
      {previewChapter && previewChapterIndex !== null && parsedPDF && (
        <PreviewModal
          chapter={previewChapter}
          thumbnail={parsedPDF.thumbnails.get(previewChapter.startPage)}
          onClose={() => setPreviewChapterIndex(null)}
          onSelect={() => toggleChapter(previewChapter)}
          onPrevious={() => navigatePreview('prev')}
          onNext={() => navigatePreview('next')}
          onNavigateTo={(index) => setPreviewChapterIndex(index)}
          isSelected={selectedChapters.has(previewChapter.id)}
          currentIndex={previewChapterIndex}
          totalCount={allChapters.length}
          hasPrevious={previewChapterIndex > 0}
          hasNext={previewChapterIndex < allChapters.length - 1}
          chaptersTree={parsedPDF.chapters}
          allChapters={allChapters}
          selectedChapters={selectedChapters}
        />
      )}
    </div>
  );
}
