import { useState, useEffect, useRef, useMemo } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css';

interface DocSection {
  id: string;
  title: string;
  file: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const sectionIcons: Record<string, string> = {
  intro: "📖",
  installation: "⬇️",
  features: "✨",
  weather: "🌤️",
  settings: "⚙️",
  "google-api": "☁️",
  "github-api": "🐙",
};

const sectionDescriptions: Record<string, string> = {
  intro: "Get started with TimiGS",
  installation: "Download & setup guide",
  features: "Core capabilities",
  weather: "Weather tracking module",
  settings: "Customize your experience",
  "google-api": "Cloud backup & sync",
  "github-api": "Coding activity tracker",
};

export default function DocsViewer({ lang = "en" }: { lang?: string }) {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Setup marked options and custom extensions
  useEffect(() => {
    const renderer = new marked.Renderer();
    
    // Custom Blockquote for Alerts
    renderer.blockquote = ({ text }: { text: string }) => { 
         if (!text) return '<blockquote></blockquote>';
         const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)/i);
         
         if (alertMatch) {
             const type = alertMatch[1].toLowerCase();
             const alertContent = alertMatch[2];
             
             const configs: Record<string, { bg: string; border: string; icon: string; title: string }> = {
               note: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", icon: "ℹ️", title: "Note" },
               tip: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", icon: "💡", title: "Tip" },
               important: { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.3)", icon: "💜", title: "Important" },
               warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", icon: "⚠️", title: "Warning" },
               caution: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", icon: "🛑", title: "Caution" },
             };
             const c = configs[type] || configs.note;

             const inner = marked.parse(alertContent);
             return `<div class="docs-alert docs-alert-${type}" style="background:${c.bg};border:1px solid ${c.border};border-radius:16px;padding:20px 24px;margin:24px 0;">
                <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:11px;margin-bottom:10px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.9;">
                    <span>${c.icon}</span>
                    <span>${c.title}</span>
                </div>
                <div style="font-size:14px;line-height:1.7;opacity:0.85;">${inner}</div>
             </div>`;
         }
         return `<blockquote style="border-left:3px solid rgba(255,255,255,0.15);padding-left:16px;font-style:italic;color:rgba(255,255,255,0.5);margin:16px 0;">${text}</blockquote>`;
    };

    // Custom heading renderer for anchor links
    renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
      return `<h${depth} id="${slug}" class="docs-heading docs-h${depth}">
        <a href="#${slug}" class="heading-anchor" aria-hidden="true">#</a>
        ${text}
      </h${depth}>`;
    };

    // Custom table renderer
    renderer.table = ({ header, body }: { header: string; body: string }) => {
      return `<div class="docs-table-wrapper"><table class="docs-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    } as any);
  }, []);

  // Fetch Sidebar Config
  useEffect(() => {
    fetch("/docs.json")
      .then((res) => res.json())
      .then((data) => {
        setSections(data);
        if (data.length > 0) {
          setActiveDoc(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load docs config", err));
  }, []);

  // Fetch MarkDown Content
  useEffect(() => {
    if (!activeDoc) return;
    
    const section = sections.find(s => s.id === activeDoc);
    if (!section) return;

    setLoading(true);
    setReadProgress(0);
    fetch(`/docx/${section.file}`)
      .then(res => res.text())
      .then(async text => {
        const html = await marked.parse(text); 
        setContent(html as string); 
        setLoading(false);

        // Extract TOC from markdown
        const headingRegex = /^(#{1,3})\s+(.+)$/gm;
        const tocItems: TocItem[] = [];
        let match;
        while ((match = headingRegex.exec(text)) !== null) {
          const level = match[1].length;
          const rawText = match[2].replace(/[*_`]/g, '');
          const slug = rawText.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
          tocItems.push({ id: slug, text: rawText, level });
        }
        setToc(tocItems);
      })
      .catch(err => {
        console.error("Failed to load doc file", err);
        setContent("<h1>404</h1><p>Failed to load documentation.</p>");
        setLoading(false);
      });
  }, [activeDoc, sections]);

  // Syntax highlighting effect
  useEffect(() => {
    if (!loading && contentRef.current) {
      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content, loading]);

  // Reading progress & active heading tracking
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      const scrollTop = mainEl.scrollTop;
      const scrollHeight = mainEl.scrollHeight - mainEl.clientHeight;
      const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      setReadProgress(progress);

      // Active heading detection
      if (contentRef.current) {
        const headings = contentRef.current.querySelectorAll('h1, h2, h3');
        let currentId = '';
        headings.forEach((h) => {
          const rect = h.getBoundingClientRect();
          if (rect.top < 150) {
            currentId = h.id;
          }
        });
        if (currentId) setActiveHeading(currentId);
      }
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, [loading]);

  // Filtered sections for search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(s => 
      s.title.toLowerCase().includes(q) || 
      (sectionDescriptions[s.id] || "").toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  const currentSection = sections.find(s => s.id === activeDoc);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="docs-root">
      {/* Reading progress bar */}
      <div className="docs-progress-bar">
        <div className="docs-progress-fill" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Mobile header */}
      <div className="docs-mobile-header">
        <button 
          className="docs-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen 
              ? <path d="M18 6L6 18M6 6l12 12" /> 
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
          <span>Documentation</span>
        </button>
        {currentSection && (
          <span className="docs-mobile-current">{sectionIcons[currentSection.id]} {currentSection.title}</span>
        )}
      </div>

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className={`docs-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="docs-sidebar-inner">
            {/* Header */}
            <div className="docs-sidebar-header">
              <div className="docs-sidebar-logo">
                <div className="docs-logo-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="docs-sidebar-title">Docs</h2>
                  <p className="docs-sidebar-subtitle">TimiGS Guide</p>
                </div>
              </div>

              {/* Search */}
              <div className="docs-search">
                <svg className="docs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search docs..."
                  className="docs-search-input"
                />
                {searchQuery && (
                  <button className="docs-search-clear" onClick={() => setSearchQuery("")}>✕</button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="docs-nav">
              <div className="docs-nav-label">Getting Started</div>
              {filteredSections.slice(0, 3).map((section) => (
                <button
                  key={section.id}
                  onClick={() => { setActiveDoc(section.id); setMobileMenuOpen(false); }}
                  className={`docs-nav-item ${activeDoc === section.id ? 'active' : ''}`}
                >
                  <span className="docs-nav-icon">{sectionIcons[section.id] || "📄"}</span>
                  <div className="docs-nav-text">
                    <span className="docs-nav-title">{section.title}</span>
                    <span className="docs-nav-desc">{sectionDescriptions[section.id] || ""}</span>
                  </div>
                </button>
              ))}

              {filteredSections.length > 3 && (
                <>
                  <div className="docs-nav-label" style={{ marginTop: '16px' }}>Modules & Integrations</div>
                  {filteredSections.slice(3).map((section) => (
                    <button
                      key={section.id}
                      onClick={() => { setActiveDoc(section.id); setMobileMenuOpen(false); }}
                      className={`docs-nav-item ${activeDoc === section.id ? 'active' : ''}`}
                    >
                      <span className="docs-nav-icon">{sectionIcons[section.id] || "📄"}</span>
                      <div className="docs-nav-text">
                        <span className="docs-nav-title">{section.title}</span>
                        <span className="docs-nav-desc">{sectionDescriptions[section.id] || ""}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </nav>

            {/* Sidebar footer */}
            <div className="docs-sidebar-footer">
              <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener" className="docs-sidebar-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                <span>GitHub</span>
              </a>
              <div className="docs-version-badge">
                <span className="docs-version-dot"></span>
                v2.0 — stable
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main ref={mainRef} className="docs-main">
          {/* Table of Contents (right side - desktop only) */}
          {!loading && toc.length > 2 && (
            <aside className="docs-toc">
              <div className="docs-toc-inner">
                <div className="docs-toc-title">On this page</div>
                <nav className="docs-toc-nav">
                  {toc.filter(t => t.level <= 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollToHeading(item.id)}
                      className={`docs-toc-item docs-toc-level-${item.level} ${activeHeading === item.id ? 'active' : ''}`}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Article content */}
          <div className="docs-content-area">
            {/* Breadcrumbs */}
            {currentSection && !loading && (
              <div className="docs-breadcrumbs">
                <span className="docs-breadcrumb-item">Docs</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span className="docs-breadcrumb-current">{currentSection.title}</span>
              </div>
            )}

            {loading ? (
              <div className="docs-skeleton">
                <div className="docs-skeleton-line" style={{ width: '60%', height: '40px' }}></div>
                <div className="docs-skeleton-line" style={{ width: '100%', height: '16px', marginTop: '24px' }}></div>
                <div className="docs-skeleton-line" style={{ width: '90%', height: '16px' }}></div>
                <div className="docs-skeleton-line" style={{ width: '75%', height: '16px' }}></div>
                <div className="docs-skeleton-line" style={{ width: '100%', height: '200px', marginTop: '32px', borderRadius: '16px' }}></div>
              </div>
            ) : (
              <article
                ref={contentRef}
                className="docs-article"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}

            {/* Navigation footer */}
            {!loading && (
              <div className="docs-nav-footer">
                {(() => {
                  const idx = sections.findIndex(s => s.id === activeDoc);
                  const prev = idx > 0 ? sections[idx - 1] : null;
                  const next = idx < sections.length - 1 ? sections[idx + 1] : null;
                  return (
                    <>
                      {prev ? (
                        <button className="docs-nav-btn docs-nav-prev" onClick={() => setActiveDoc(prev.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                          <div>
                            <span className="docs-nav-btn-label">Previous</span>
                            <span className="docs-nav-btn-title">{prev.title}</span>
                          </div>
                        </button>
                      ) : <div />}
                      {next ? (
                        <button className="docs-nav-btn docs-nav-next" onClick={() => setActiveDoc(next.id)}>
                          <div>
                            <span className="docs-nav-btn-label">Next</span>
                            <span className="docs-nav-btn-title">{next.title}</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        /* ═══════════════════════════════════════════ */
        /* DocsViewer — Premium Documentation Design  */
        /* ═══════════════════════════════════════════ */

        .docs-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #0a0a0f;
          color: #e8e8ef;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
        }

        /* ── Progress Bar ── */
        .docs-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255,255,255,0.03);
          z-index: 100;
        }
        .docs-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a78bfa, #818cf8);
          transition: width 0.15s ease;
          border-radius: 0 2px 2px 0;
          box-shadow: 0 0 12px rgba(99,102,241,0.4);
        }

        /* ── Mobile Header ── */
        .docs-mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(10,10,15,0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .docs-mobile-menu-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #e8e8ef;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .docs-mobile-menu-btn:hover { background: rgba(255,255,255,0.06); }
        .docs-mobile-current {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
        }

        /* ── Layout ── */
        .docs-layout {
          display: flex;
          flex: 1;
        }

        /* ── Sidebar ── */
        .docs-sidebar {
          width: 290px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.015);
          height: 100vh;
          position: sticky;
          top: 3px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .docs-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 24px 16px 16px;
        }

        /* Sidebar Header */
        .docs-sidebar-header {
          margin-bottom: 20px;
        }
        .docs-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .docs-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.15));
          border: 1px solid rgba(99,102,241,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a78bfa;
        }
        .docs-sidebar-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .docs-sidebar-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          margin: 2px 0 0;
        }

        /* Search */
        .docs-search {
          position: relative;
          margin-bottom: 4px;
        }
        .docs-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }
        .docs-search-input {
          width: 100%;
          padding: 9px 32px 9px 36px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          color: #e8e8ef;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }
        .docs-search-input::placeholder { color: rgba(255,255,255,0.25); }
        .docs-search-input:focus {
          border-color: rgba(99,102,241,0.4);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .docs-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          font-size: 12px;
          padding: 4px;
        }

        /* Navigation */
        .docs-nav {
          flex: 1;
          overflow-y: auto;
        }
        .docs-nav-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.25);
          padding: 12px 12px 6px;
        }
        .docs-nav-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(255,255,255,0.55);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          margin-bottom: 2px;
        }
        .docs-nav-item:hover {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85);
        }
        .docs-nav-item.active {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.15);
          color: #fff;
        }
        .docs-nav-icon {
          font-size: 16px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .docs-nav-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .docs-nav-title {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .docs-nav-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .docs-nav-item.active .docs-nav-desc { color: rgba(255,255,255,0.45); }

        /* Sidebar footer */
        .docs-sidebar-footer {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .docs-sidebar-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          padding: 6px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .docs-sidebar-link:hover {
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.04);
        }
        .docs-version-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-family: 'SF Mono', 'Fira Code', monospace;
          padding: 0 8px;
        }
        .docs-version-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
        }

        /* ── Main Content ── */
        .docs-main {
          flex: 1;
          display: flex;
          min-height: 100vh;
          overflow-y: auto;
          position: relative;
        }

        .docs-content-area {
          flex: 1;
          max-width: 820px;
          margin: 0 auto;
          padding: 40px 48px 80px;
          min-width: 0;
        }

        /* Table of Contents (right sidebar) */
        .docs-toc {
          width: 220px;
          flex-shrink: 0;
          position: sticky;
          top: 3px;
          height: 100vh;
          overflow-y: auto;
          padding: 40px 20px 40px 0;
          display: none;
        }
        .docs-toc-inner {
          padding-left: 16px;
          border-left: 1px solid rgba(255,255,255,0.05);
        }
        .docs-toc-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: rgba(255,255,255,0.3);
          margin-bottom: 12px;
        }
        .docs-toc-nav {
          display: flex;
          flex-direction: column;
        }
        .docs-toc-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 4px 0 4px 0;
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .docs-toc-item:hover { color: rgba(255,255,255,0.7); }
        .docs-toc-item.active { color: #a78bfa; font-weight: 600; }
        .docs-toc-level-2 { padding-left: 12px; }
        .docs-toc-level-3 { padding-left: 24px; font-size: 11px; }

        @media (min-width: 1400px) {
          .docs-toc { display: block; }
        }

        /* Breadcrumbs */
        .docs-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          margin-bottom: 24px;
        }
        .docs-breadcrumb-item {
          cursor: default;
        }
        .docs-breadcrumb-current {
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }

        /* Skeleton loader */
        .docs-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .docs-skeleton-line {
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          animation: skeleton-shimmer 1.5s infinite;
        }
        @keyframes skeleton-shimmer {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }

        /* ── Article Styling ── */
        .docs-article {
          line-height: 1.8;
          font-size: 15px;
          color: rgba(255,255,255,0.75);
        }

        /* Headings */
        .docs-article h1 {
          font-size: 2.2rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 16px;
          letter-spacing: -0.8px;
          line-height: 1.2;
        }
        .docs-article h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 48px 0 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          letter-spacing: -0.4px;
        }
        .docs-article h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          margin: 32px 0 12px;
        }
        .docs-article h1:first-child { margin-top: 0; }

        /* Heading anchors */
        .heading-anchor {
          color: rgba(99,102,241,0.3);
          text-decoration: none;
          margin-right: 6px;
          font-weight: 400;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .docs-heading:hover .heading-anchor { opacity: 1; }

        /* Paragraphs and lists */
        .docs-article p {
          margin: 12px 0;
          line-height: 1.8;
        }
        .docs-article ul, .docs-article ol {
          padding-left: 24px;
          margin: 12px 0;
        }
        .docs-article li {
          margin: 6px 0;
          line-height: 1.7;
        }
        .docs-article li::marker {
          color: rgba(255,255,255,0.25);
        }

        /* Links */
        .docs-article a {
          color: #818cf8;
          text-decoration: none;
          border-bottom: 1px solid rgba(129,140,248,0.2);
          transition: all 0.2s;
        }
        .docs-article a:hover {
          color: #a78bfa;
          border-bottom-color: rgba(167,139,250,0.4);
        }

        /* Code (inline) */
        .docs-article code {
          background: rgba(255,255,255,0.06);
          color: #c4b5fd;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.85em;
          font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
          border: 1px solid rgba(255,255,255,0.04);
        }

        /* Code (block) */
        .docs-article pre {
          background: #111118 !important;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 20px 24px !important;
          margin: 20px 0;
          overflow-x: auto;
          position: relative;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }
        .docs-article pre code {
          background: none !important;
          border: none;
          padding: 0;
          font-size: 13px;
          line-height: 1.7;
          color: #d4d4d8;
        }

        /* Strong */
        .docs-article strong {
          color: #fff;
          font-weight: 650;
        }

        /* Images */
        .docs-article img {
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          margin: 24px 0;
          max-width: 100%;
        }

        /* Tables */
        .docs-table-wrapper {
          overflow-x: auto;
          margin: 20px 0;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .docs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .docs-table thead {
          background: rgba(255,255,255,0.03);
        }
        .docs-table th {
          text-align: left;
          padding: 12px 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .docs-table td {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.6);
        }
        .docs-table tbody tr:hover {
          background: rgba(255,255,255,0.02);
        }
        .docs-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* ── Prev/Next Navigation Footer ── */
        .docs-nav-footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .docs-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          color: #e8e8ef;
          cursor: pointer;
          transition: all 0.2s;
          max-width: 45%;
        }
        .docs-nav-btn:hover {
          background: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.15);
        }
        .docs-nav-btn-label {
          display: block;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 2px;
        }
        .docs-nav-btn-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
        .docs-nav-next { margin-left: auto; text-align: right; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .docs-mobile-header { display: flex; }
          .docs-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 60;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 280px;
            background: rgba(10,10,15,0.98);
            backdrop-filter: blur(20px);
          }
          .docs-sidebar.open {
            transform: translateX(0);
          }
          .docs-content-area {
            padding: 20px 16px 60px;
          }
          .docs-article h1 { font-size: 1.7rem; }
          .docs-article h2 { font-size: 1.25rem; margin-top: 32px; }
          .docs-nav-footer { flex-direction: column; }
          .docs-nav-btn { max-width: 100%; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .docs-content-area {
            padding: 32px 32px 64px;
          }
        }
      `}</style>
    </div>
  );
}
