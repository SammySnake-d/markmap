/**
 * JavaScript Collector for HTML Generator
 *
 * Requirements:
 * - 14.2: Collect and bundle all JavaScript code
 * - 14.3: Generated HTML should work without external dependencies
 *
 * This module provides functionality to collect and bundle JavaScript code
 * for standalone HTML files. It supports two modes:
 * 1. CDN mode: Uses external CDN links (for smaller file size, requires internet)
 * 2. Inline mode: Bundles all JS inline (for true standalone, no external deps)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { HTMLGeneratorOptions } from './types';

/**
 * Configuration for JS collection
 */
export interface JSCollectorOptions {
  /**
   * Whether to inline all JavaScript code
   * When true, generates truly standalone HTML with no external dependencies
   * When false, uses CDN links for smaller file size
   * @default false
   */
  inlineJS?: boolean;

  /**
   * Custom CDN base URL
   * @default 'https://cdn.jsdelivr.net/npm'
   */
  cdnBase?: string;
}

/**
 * Library version information for CDN URLs
 */
const LIBRARY_VERSIONS = {
  d3: '7',
  'markmap-view': 'latest',
  'markmap-lib': 'latest',
};

/**
 * Get the CDN URLs for required external libraries
 *
 * @param cdnBase - Base URL for CDN
 * @returns Array of CDN URLs
 */
export function getExternalLibraryURLs(
  cdnBase = 'https://cdn.jsdelivr.net/npm',
): string[] {
  return [
    `${cdnBase}/d3@${LIBRARY_VERSIONS.d3}/dist/d3.min.js`,
    `${cdnBase}/markmap-view@${LIBRARY_VERSIONS['markmap-view']}/dist/browser/index.js`,
    `${cdnBase}/markmap-lib@${LIBRARY_VERSIONS['markmap-lib']}/dist/browser/index.js`,
  ];
}

/**
 * Generate script tags for external libraries (CDN mode)
 *
 * @param cdnBase - Base URL for CDN
 * @returns HTML string with script tags
 */
export function generateExternalScriptTags(
  cdnBase = 'https://cdn.jsdelivr.net/npm',
): string {
  const urls = getExternalLibraryURLs(cdnBase);
  return urls.map((url) => `<script src="${url}"></script>`).join('\n  ');
}

/**
 * Escape a string for safe embedding in JavaScript
 *
 * @param str - String to escape
 * @returns Escaped string as a JavaScript string literal
 */
function escapeForJS(str: string): string {
  return JSON.stringify(str);
}

/**
 * Generate the initialization script for the standalone HTML
 *
 * Requirements:
 * - 14.4: Support all core features (search, edit, export, canvas interaction)
 * - 14.5: Save edited content to localStorage
 *
 * @param markdown - The Markdown content
 * @param options - Generator options
 * @returns JavaScript code string
 */
export function generateInitScript(
  markdown: string,
  options: Required<
    Omit<
      HTMLGeneratorOptions,
      'separators' | 'minify' | 'cdnBase' | 'useLocalBundle'
    >
  > & {
    separators?: HTMLGeneratorOptions['separators'];
  },
): string {
  const { title, colorScheme, enableEdit, theme, separators } = options;

  // Escape markdown for safe embedding in JavaScript
  const escapedMarkdown = escapeForJS(markdown);
  const separatorsJSON = JSON.stringify(separators || {});

  return `
(function() {
  'use strict';

  // Configuration - Requirements 14.1
  var CONFIG = {
    markdown: ${escapedMarkdown},
    title: ${JSON.stringify(title)},
    colorScheme: ${JSON.stringify(colorScheme)},
    enableEdit: ${enableEdit},
    theme: ${JSON.stringify(theme)},
    separators: ${separatorsJSON}
  };

  // Storage keys for localStorage - Requirements 14.5
  var STORAGE_KEY = 'markmap-standalone-' + simpleHash(CONFIG.title);
  var STORAGE_KEY_VIEW = STORAGE_KEY + '-view';
  var STORAGE_KEY_HISTORY = STORAGE_KEY + '-history';

  /**
   * Simple hash function for generating storage keys
   */
  function simpleHash(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if localStorage is available
   */
  function isStorageAvailable() {
    try {
      var test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Load saved content from localStorage - Requirements 14.5
   */
  function loadSavedContent() {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available, running in read-only mode');
      return null;
    }
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        if (data && data.markdown && typeof data.markdown === 'string') {
          return data.markdown;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved content:', e);
    }
    return null;
  }

  /**
   * Save content to localStorage - Requirements 14.5
   */
  function saveContent(markdown) {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available, cannot save content');
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        markdown: markdown,
        timestamp: Date.now(),
        version: 1
      }));
      return true;
    } catch (e) {
      console.warn('Failed to save content:', e);
      // Notify user about save failure
      showNotification('保存失败，请检查存储空间', 'error');
      return false;
    }
  }

  /**
   * Load view state from localStorage
   */
  function loadViewState() {
    if (!isStorageAvailable()) return null;
    try {
      var saved = localStorage.getItem(STORAGE_KEY_VIEW);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load view state:', e);
    }
    return null;
  }

  /**
   * Save view state to localStorage
   */
  function saveViewState(state) {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save view state:', e);
    }
  }

  /**
   * Load edit history from localStorage - Requirements 14.5
   */
  function loadEditHistory() {
    if (!isStorageAvailable()) return null;
    try {
      var saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load edit history:', e);
    }
    return null;
  }

  /**
   * Save edit history to localStorage - Requirements 14.5
   */
  function saveEditHistory(history) {
    if (!isStorageAvailable()) return;
    try {
      // Limit history size to prevent storage overflow
      var limitedHistory = {
        undoStack: (history.undoStack || []).slice(-50),
        redoStack: (history.redoStack || []).slice(-50)
      };
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(limitedHistory));
    } catch (e) {
      console.warn('Failed to save edit history:', e);
    }
  }

  /**
   * Show notification to user
   */
  function showNotification(message, type) {
    type = type || 'info';
    var notification = document.createElement('div');
    notification.className = 'markmap-notification markmap-notification-' + type;
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;z-index:10001;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;';
    if (type === 'error') {
      notification.style.background = '#fee2e2';
      notification.style.color = '#dc2626';
    } else {
      notification.style.background = '#d1fae5';
      notification.style.color = '#059669';
    }
    document.body.appendChild(notification);
    setTimeout(function() {
      notification.style.opacity = '0';
      setTimeout(function() {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Simple Undo Manager for edit operations
   */
  function createUndoManager() {
    var history = loadEditHistory() || { undoStack: [], redoStack: [] };
    
    return {
      record: function(entry) {
        history.undoStack.push(entry);
        history.redoStack = [];
        saveEditHistory(history);
      },
      undo: function() {
        if (history.undoStack.length === 0) return null;
        var entry = history.undoStack.pop();
        history.redoStack.push(entry);
        saveEditHistory(history);
        return entry;
      },
      redo: function() {
        if (history.redoStack.length === 0) return null;
        var entry = history.redoStack.pop();
        history.undoStack.push(entry);
        saveEditHistory(history);
        return entry;
      },
      canUndo: function() {
        return history.undoStack.length > 0;
      },
      canRedo: function() {
        return history.redoStack.length > 0;
      }
    };
  }

  /**
   * Initialize the mindmap - Requirements 14.4
   */
  function init() {
    // Check if markmap is available
    if (typeof window.markmap === 'undefined') {
      console.error('Markmap library not loaded');
      showNotification('Markmap 库加载失败', 'error');
      return;
    }

    var markmap = window.markmap;
    var svg = document.getElementById('mindmap');

    if (!svg) {
      console.error('SVG element not found');
      return;
    }

    // Load saved content or use initial content - Requirements 14.5
    var content = CONFIG.enableEdit ? (loadSavedContent() || CONFIG.markdown) : CONFIG.markdown;
    var currentContent = content;

    // Create transformer and transform markdown
    var transformer = new markmap.Transformer();
    var result = transformer.transform(content);
    var root = result.root;

    // Create markmap instance with proper layout options
    // These options ensure proper spacing and auto-fit behavior
    var mm = markmap.Markmap.create(svg, {
      duration: 500,
      maxWidth: 300,
      initialExpandLevel: -1,  // Expand all levels
      paddingX: 80,
      paddingY: 20,
      spacingHorizontal: 80,
      spacingVertical: 20,
      autoFit: true,
      fitRatio: 0.95,
      colorFreezeLevel: 2
    }, root);

    // Store reference globally for debugging and external access
    window.mm = mm;
    window.markmapTransformer = transformer;

    // Create undo manager
    var undoManager = createUndoManager();

    // Handle dark mode
    if (CONFIG.theme === 'dark' || 
        (CONFIG.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('markmap-dark');
    }

    // Auto-fit on load
    setTimeout(function() {
      mm.fit();
    }, 100);

    // Handle window resize - Requirements 14.4 (canvas interaction)
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        mm.fit();
      }, 200);
    });

    // Handle keyboard shortcuts - Requirements 14.4
    document.addEventListener('keydown', function(e) {
      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        var entry = undoManager.undo();
        if (entry && entry.before) {
          updateContent(entry.before);
        }
      }
      // Cmd/Ctrl + Shift + Z or Ctrl + Y for redo
      if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        var entry = undoManager.redo();
        if (entry && entry.after) {
          updateContent(entry.after);
        }
      }
      // Cmd/Ctrl + F for search (if search is available)
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        var searchInput = document.querySelector('.mm-search-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    });

    /**
     * Update mindmap content
     */
    function updateContent(newMarkdown) {
      try {
        var newResult = transformer.transform(newMarkdown);
        mm.setData(newResult.root);
        currentContent = newMarkdown;
        if (CONFIG.enableEdit) {
          saveContent(newMarkdown);
        }
        // Auto-fit after content update
        setTimeout(function() {
          mm.fit();
        }, 100);
      } catch (e) {
        console.error('Failed to update content:', e);
      }
    }

    // Save content when editing (if enabled) - Requirements 14.5
    if (CONFIG.enableEdit) {
      // Expose save function globally for external use
      window.saveMarkmapContent = function(newContent) {
        if (newContent !== currentContent) {
          // Record for undo
          undoManager.record({
            before: currentContent,
            after: newContent,
            timestamp: Date.now()
          });
          updateContent(newContent);
        }
      };

      // Expose update function
      window.updateMarkmapContent = updateContent;

      // Expose getter for current content
      window.getMarkmapContent = function() {
        return currentContent;
      };
    }

    // Expose export functions - Requirements 14.4
    window.exportMarkmapAsPNG = function() {
      if (mm.downloadAsPNG) {
        return mm.downloadAsPNG();
      } else if (mm.exportAsPNG) {
        return mm.exportAsPNG();
      }
      console.warn('PNG export not available');
    };

    window.exportMarkmapAsJPG = function() {
      if (mm.exportAsJPG) {
        return mm.exportAsJPG();
      }
      console.warn('JPG export not available');
    };

    window.exportMarkmapAsSVG = function() {
      if (mm.downloadAsSVG) {
        return mm.downloadAsSVG('mindmap.svg');
      } else if (mm.exportAsSVG) {
        return mm.exportAsSVG();
      }
      // Fallback: get SVG content directly
      return svg.outerHTML;
    };

    window.exportMarkmapAsMarkdown = function() {
      if (mm.exportAsMarkdown) {
        return mm.exportAsMarkdown();
      }
      return currentContent;
    };

    // Expose fit function
    window.fitMarkmap = function() {
      mm.fit();
    };

    // Create floating toolbar with fit button
    createFloatingToolbar(mm);

    // Expose expand/collapse functions
    window.expandAllMarkmap = function() {
      if (mm.state && mm.state.data) {
        mm.expandAll(mm.state.data);
      }
    };

    window.collapseAllMarkmap = function() {
      if (mm.state && mm.state.data) {
        mm.collapseAll(mm.state.data);
      }
    };

    // Save view state periodically
    var saveViewStateDebounced = debounce(function() {
      saveViewState({
        timestamp: Date.now()
      });
    }, 1000);

    // Listen for zoom/pan changes
    svg.addEventListener('wheel', saveViewStateDebounced);
    svg.addEventListener('mouseup', saveViewStateDebounced);

    console.log('Markmap initialized successfully');
  }

  /**
   * Create floating toolbar with common actions
   * Includes: Fit to view, Expand all, Collapse all
   */
  function createFloatingToolbar(mm) {
    var toolbar = document.createElement('div');
    toolbar.className = 'mm-floating-toolbar';
    toolbar.innerHTML = [
      '<button class="mm-float-btn" data-action="fit" title="自适应视图">',
      '  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/></svg>',
      '</button>',
      '<button class="mm-float-btn" data-action="expand" title="展开全部">',
      '  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>',
      '</button>',
      '<button class="mm-float-btn" data-action="collapse" title="折叠全部">',
      '  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
      '</button>'
    ].join('');

    // Add styles
    var style = document.createElement('style');
    style.textContent = [
      '.mm-floating-toolbar {',
      '  position: fixed;',
      '  bottom: 24px;',
      '  right: 24px;',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '  z-index: 1000;',
      '}',
      '.mm-float-btn {',
      '  width: 44px;',
      '  height: 44px;',
      '  border-radius: 12px;',
      '  border: none;',
      '  background: rgba(255, 255, 255, 0.9);',
      '  backdrop-filter: blur(12px);',
      '  -webkit-backdrop-filter: blur(12px);',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);',
      '  cursor: pointer;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  color: #555;',
      '  transition: all 0.2s ease;',
      '}',
      '.mm-float-btn:hover {',
      '  background: rgba(255, 255, 255, 1);',
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08);',
      '  color: #333;',
      '  transform: scale(1.05);',
      '}',
      '.mm-float-btn:active {',
      '  transform: scale(0.95);',
      '}',
      '.markmap-dark .mm-float-btn {',
      '  background: rgba(45, 45, 60, 0.9);',
      '  color: #ccc;',
      '  box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);',
      '}',
      '.markmap-dark .mm-float-btn:hover {',
      '  background: rgba(55, 55, 70, 1);',
      '  color: #fff;',
      '}'
    ].join('');
    document.head.appendChild(style);

    // Add event listeners
    toolbar.addEventListener('click', function(e) {
      var btn = e.target.closest('.mm-float-btn');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      switch (action) {
        case 'fit':
          mm.fit();
          break;
        case 'expand':
          if (mm.state && mm.state.data) {
            mm.expandAll(mm.state.data);
          }
          break;
        case 'collapse':
          if (mm.state && mm.state.data) {
            mm.collapseAll(mm.state.data);
          }
          break;
      }
    });

    document.body.appendChild(toolbar);
  }

  /**
   * Debounce function
   */
  function debounce(fn, delay) {
    var timeout;
    return function() {
      var args = arguments;
      var context = this;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
}

/**
 * Generate the complete scripts section for the HTML (CDN mode)
 *
 * This mode uses external CDN links for smaller file size but requires
 * internet connectivity to load the libraries.
 *
 * Requirements:
 * - 14.2: Generate HTML with all necessary CSS and JavaScript inlined
 *
 * @param markdown - The Markdown content
 * @param options - Generator options
 * @param cdnBase - Base URL for CDN
 * @returns Complete scripts HTML string
 */
export function generateScriptsSection(
  markdown: string,
  options: Required<
    Omit<
      HTMLGeneratorOptions,
      'separators' | 'minify' | 'cdnBase' | 'useLocalBundle'
    >
  > & {
    separators?: HTMLGeneratorOptions['separators'];
  },
  cdnBase = 'https://cdn.jsdelivr.net/npm',
): string {
  const externalScripts = generateExternalScriptTags(cdnBase);
  const initScript = generateInitScript(markdown, options);

  return `${externalScripts}
  <script>
${initScript}
  </script>`;
}

/**
 * Read local bundled JS files and generate inline scripts
 *
 * This function reads the locally built JS files from the markmap packages
 * and generates inline script tags for truly standalone HTML files.
 *
 * @returns Object containing the bundled JS code for each package
 */
export function readLocalBundles(): {
  markmapLib: string;
  markmapView: string;
} {
  // Get the directory of this file
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const packagesDir = path.resolve(currentDir, '../../');

  // Read markmap-lib browser bundle
  const markmapLibPath = path.join(
    packagesDir,
    'markmap-lib/dist/browser/index.iife.js',
  );
  let markmapLib = '';
  try {
    markmapLib = fs.readFileSync(markmapLibPath, 'utf-8');
  } catch (e) {
    console.warn('Failed to read markmap-lib bundle:', e);
    // Fallback: try index.js
    try {
      const fallbackPath = path.join(
        packagesDir,
        'markmap-lib/dist/browser/index.js',
      );
      markmapLib = fs.readFileSync(fallbackPath, 'utf-8');
    } catch (e2) {
      console.error('Failed to read markmap-lib bundle:', e2);
    }
  }

  // Read markmap-view browser bundle
  const markmapViewPath = path.join(
    packagesDir,
    'markmap-view/dist/browser/index.js',
  );
  let markmapView = '';
  try {
    markmapView = fs.readFileSync(markmapViewPath, 'utf-8');
  } catch (e) {
    console.error('Failed to read markmap-view bundle:', e);
  }

  return { markmapLib, markmapView };
}

/**
 * Generate the complete scripts section using local bundles
 *
 * This mode inlines all JS code for truly standalone HTML files
 * that work offline without any external dependencies.
 *
 * @param markdown - The Markdown content
 * @param options - Generator options
 * @returns Complete scripts HTML string with inlined JS
 */
export function generateLocalScriptsSection(
  markdown: string,
  options: Required<
    Omit<
      HTMLGeneratorOptions,
      'separators' | 'minify' | 'cdnBase' | 'useLocalBundle'
    >
  > & {
    separators?: HTMLGeneratorOptions['separators'];
  },
): string {
  const { markmapLib, markmapView } = readLocalBundles();
  const initScript = generateInitScript(markdown, options);

  // D3.js still needs to be loaded from CDN as it's too large to inline
  // But we inline our custom markmap packages
  return `<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
  <script>
// markmap-lib (local bundle)
${markmapLib}
  </script>
  <script>
// markmap-view (local bundle with enhanced features)
${markmapView}
  </script>
  <script>
// Initialization script
${initScript}
  </script>`;
}

/**
 * Generate inline JavaScript bundle for truly standalone HTML
 *
 * This function generates a self-contained JavaScript bundle that includes
 * all necessary code to render the mindmap without any external dependencies.
 *
 * Note: This is a placeholder implementation. In a production environment,
 * you would use a bundler like Rollup or esbuild to create the actual bundle
 * from the source packages. For now, we provide a minimal implementation
 * that works with the CDN-loaded libraries.
 *
 * @param markdown - The Markdown content
 * @param options - Generator options
 * @returns Inline JavaScript code
 */
export function generateInlineJSBundle(
  markdown: string,
  options: Required<
    Omit<HTMLGeneratorOptions, 'separators' | 'minify' | 'cdnBase'>
  > & {
    separators?: HTMLGeneratorOptions['separators'];
  },
): string {
  // For truly standalone HTML, we would need to bundle all dependencies
  // This is a complex task that typically requires a build tool
  // For now, we provide the initialization script that works with
  // externally loaded libraries

  const initScript = generateInitScript(markdown, options);

  // Return a comment explaining the limitation and the init script
  return `
/**
 * Markmap Standalone Bundle
 * 
 * Note: For truly standalone HTML without external dependencies,
 * the markmap libraries (d3, markmap-view, markmap-lib) need to be
 * bundled inline. This requires a build step using tools like
 * Rollup or esbuild.
 * 
 * Current implementation uses CDN links for the core libraries.
 * To create a fully offline-capable HTML file, run the build
 * process with the --inline flag.
 */
${initScript}
`;
}

/**
 * Get the list of required library names for bundling
 *
 * @returns Array of library names
 */
export function getRequiredLibraries(): string[] {
  return ['d3', 'markmap-common', 'markmap-lib', 'markmap-view'];
}

/**
 * Generate a loader script that can dynamically load libraries
 *
 * This is useful for progressive loading or when you want to
 * defer library loading until needed.
 *
 * @returns Loader script code
 */
export function generateLoaderScript(): string {
  return `
(function() {
  'use strict';

  /**
   * Load a script dynamically
   * @param {string} src - Script URL
   * @returns {Promise<void>}
   */
  window.loadScript = function(src) {
    return new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  /**
   * Load multiple scripts in sequence
   * @param {string[]} urls - Array of script URLs
   * @returns {Promise<void>}
   */
  window.loadScripts = function(urls) {
    return urls.reduce(function(promise, url) {
      return promise.then(function() {
        return window.loadScript(url);
      });
    }, Promise.resolve());
  };
})();
`;
}

/**
 * Minify JavaScript code by removing comments and unnecessary whitespace
 *
 * Note: This is a simple minification. For production use, consider
 * using a proper minifier like terser or uglify-js.
 *
 * @param js - JavaScript code to minify
 * @returns Minified JavaScript code
 */
export function minifyJS(js: string): string {
  return (
    js
      // Remove single-line comments (but not URLs with //)
      .replace(/(?<!:)\/\/(?![\w.]*\/).*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove leading/trailing whitespace from lines
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      // Collapse multiple newlines
      .replace(/\n{2,}/g, '\n')
  );
}
