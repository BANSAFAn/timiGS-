import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css';
import mermaid from "mermaid";
import {
  BookOpen,
  DownloadSimple,
  Sparkle,
  Cpu,
  Layout as LayoutIcon,
  Clock,
  ChartBar,
  Code,
  Users,
  Target,
  Hourglass,
  Heartbeat,
  CloudSun,
  Gear,
  List,
  FileText,
  Globe,
  CaretDown,
  MagnifyingGlass,
  X
} from "@phosphor-icons/react";

interface DocSection {
  id: string;
  title: string;
  file: string;
}

const sectionIcons: Record<string, React.ReactNode> = {
  intro: <BookOpen className="w-4 h-4" weight="duotone" />,
  installation: <DownloadSimple className="w-4 h-4" weight="duotone" />,
  features: <Sparkle className="w-4 h-4" weight="duotone" />,
  tracking: <Cpu className="w-4 h-4" weight="duotone" />,
  dashboard: <LayoutIcon className="w-4 h-4" weight="duotone" />,
  timeline: <Clock className="w-4 h-4" weight="duotone" />,
  analytics: <ChartBar className="w-4 h-4" weight="duotone" />,
  coding: <Code className="w-4 h-4" weight="duotone" />,
  team: <Users className="w-4 h-4" weight="duotone" />,
  "focus-mode": <Target className="w-4 h-4" weight="duotone" />,
  timeout: <Hourglass className="w-4 h-4" weight="duotone" />,
  "doctor-mode": <Heartbeat className="w-4 h-4" weight="duotone" />,
  settings: <Gear className="w-4 h-4" weight="duotone" />
};

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "sk", name: "Slovenčina", flag: "🇸🇰" },
  { code: "hu", name: "Magyar", flag: "🇭🇺" },
  { code: "bg", name: "Български", flag: "🇧🇬" },
  { code: "hr", name: "Hrvatski", flag: "🇭🇷" },
  { code: "el", name: "Ελληνικά", flag: "🇬🇷" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "he", name: "עברית", flag: "🇮🇱" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "zh-CN", name: "中文 (简体)", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" }
];

export default function DocsViewer({ lang = "en" }: { lang?: string }) {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [docsData, setDocsData] = useState<Record<string, string>>({});
  const docsCache = useRef<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load Google Translate script dynamically
  useEffect(() => {
    // 1. Add google translate init function to window
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,uk,de,fr,es,it,pl,pt,nl,ro,cs,sk,hu,bg,hr,el,tr,ar,he,hi,zh-CN,ja,ko,vi',
        layout: 0
      }, 'google_translate_element');
    };

    // 2. Insert the google_translate_element div in body if not already present
    if (!document.getElementById('google_translate_element')) {
      const gdiv = document.createElement('div');
      gdiv.id = 'google_translate_element';
      gdiv.style.display = 'none';
      document.body.appendChild(gdiv);
    }

    // 3. Load the Google Translate script
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // 4. Read initial lang from googtrans cookie if present
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    const googtrans = getCookie('googtrans');
    if (googtrans) {
      const code = googtrans.split('/').pop();
      if (code && languages.some(l => l.code === code)) {
        setSelectedLang(code);
      }
    }
  }, []);

  // MutationObserver to hide Google Translate banner iframe and restore body/html styles
  useEffect(() => {
    const cleanTranslateUI = () => {
      // Hide all Google Translate default widgets and banners
      const banners = document.querySelectorAll(
        'iframe.goog-te-banner-frame, iframe[class*="goog-te-banner"], .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame, body > .skiptranslate'
      );
      banners.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.display !== 'none') {
          htmlEl.style.setProperty('display', 'none', 'important');
        }
      });

      // Clear inline body styles injected by Google Translate
      if (document.body.style.top !== '0px' && document.body.style.top !== '') {
        document.body.style.setProperty('top', '0px', 'important');
      }
      if (document.body.style.position === 'relative') {
        document.body.style.removeProperty('position');
      }
      
      // Clear inline html styles
      if (document.documentElement.style.top !== '0px' && document.documentElement.style.top !== '') {
        document.documentElement.style.setProperty('top', '0px', 'important');
      }
    };

    // Run clean once initially
    cleanTranslateUI();

    const observer = new MutationObserver(() => {
      cleanTranslateUI();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: true,
      subtree: true,
    });

    // Run cleanup periodically as a fallback
    const interval = setInterval(cleanTranslateUI, 250);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTranslate = (code: string) => {
    setSelectedLang(code);
    setDropdownOpen(false);
    
    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectEl) {
      selectEl.value = code;
      selectEl.dispatchEvent(new Event('change'));
    }
  };

  useEffect(() => {
    // Determine system scheme for mermaid theme
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    const renderer = new marked.Renderer();
    renderer.code = function ({ text, lang }) {
      if (lang === "mermaid") {
        return `<div class="mermaid-container flex justify-center p-6 bg-slate-900/5 dark:bg-slate-950/20 rounded-2xl my-6 border border-gray-150 dark:border-slate-800/80"><div class="mermaid w-full flex justify-center">${text}</div></div>`;
      }
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      const highlighted = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    };

    marked.setOptions({
      renderer: renderer,
    });
  }, []);

  useEffect(() => {
    fetch("/docs.json")
      .then((res) => res.json())
      .then((data: DocSection[]) => {
        setSections(data);
        if (data.length > 0) {
          setActiveDoc(data[0].id);
        }
        // Fetch all markdown files in the background for indexing/search
        data.forEach((section: DocSection) => {
          fetch(`/docx/${section.file}`)
            .then((res) => res.text())
            .then((text) => {
              setDocsData((prev) => ({ ...prev, [section.id]: text }));
            })
            .catch((err) => console.error(`Failed to load ${section.file} for indexing`, err));
        });
      })
      .catch((err) => console.error("Failed to load docs config", err));
  }, []);

  useEffect(() => {
    if (!activeDoc) return;
    
    const section = sections.find(s => s.id === activeDoc);
    if (!section) return;

    if (docsCache.current[activeDoc]) {
      setContent(docsCache.current[activeDoc]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/docx/${section.file}`)
      .then((res) => res.text())
      .then((md) => {
        const html = marked.parse(md) as string;
        docsCache.current[activeDoc] = html;
        setContent(html);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load doc", err);
        setLoading(false);
      });
  }, [activeDoc, sections]);

  useEffect(() => {
    if (!content || loading) return;

    const timer = setTimeout(() => {
      try {
        mermaid.run({
          querySelector: '.mermaid',
        });
      } catch (err) {
        console.error("Failed to render mermaid:", err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [content, loading]);

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: Array<{ id: string; title: string; snippet: string; count: number }> = [];

    sections.forEach((section) => {
      const titleMatch = section.title.toLowerCase().includes(query);
      const contentStr = docsData[section.id] || "";
      const contentLower = contentStr.toLowerCase();
      
      let matchCount = 0;
      let firstSnippet = "";
      
      if (titleMatch) {
        matchCount += 5; // boost for title match
      }

      let pos = contentLower.indexOf(query);
      while (pos !== -1) {
        matchCount++;
        if (!firstSnippet) {
          const start = Math.max(0, pos - 30);
          const end = Math.min(contentStr.length, pos + query.length + 45);
          let snippetText = contentStr.slice(start, end).replace(/[\r\n#*`_-]+/g, " ");
          if (start > 0) snippetText = "..." + snippetText;
          if (end < contentStr.length) snippetText = snippetText + "...";
          firstSnippet = snippetText;
        }
        pos = contentLower.indexOf(query, pos + 1);
      }

      if (titleMatch || matchCount > 0) {
        results.push({
          id: section.id,
          title: section.title,
          snippet: firstSnippet || "Matches found in title",
          count: matchCount
        });
      }
    });

    return results.sort((a, b) => b.count - a.count);
  };

  const searchResults = getSearchResults();

  return (
    <div className="max-w-7xl mx-auto py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-semibold mb-6">
            <BookOpen className="w-4 h-4" />
            Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Documentation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Complete guide to using TimiGS
          </p>
        </div>

        {/* Dynamic Translator Selector */}
        <div className="relative notranslate" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-brand-500 dark:hover:border-brand-500 transition-all shadow-sm"
          >
            <Globe className="w-4 h-4 text-brand-500" weight="duotone" />
            <span>{languages.find(l => l.code === selectedLang)?.flag} {languages.find(l => l.code === selectedLang)?.name}</span>
            <CaretDown className={`w-3 h-3 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 z-50 w-56 max-h-80 overflow-y-auto rounded-2xl border border-gray-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 shadow-xl shadow-slate-200/50 dark:shadow-black/40">
              <div className="space-y-0.5">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleTranslate(lang.code)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 ${
                      selectedLang === lang.code
                        ? 'bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="hidden lg:block notranslate">
          <div className="sticky top-24 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
            {/* Desktop Search Input */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {searchQuery.trim() ? "Search Results" : "Contents"}
                </span>
              </div>
              <nav className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
                {searchQuery.trim() ? (
                  searchResults.length > 0 ? (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setActiveDoc(result.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 border ${
                          activeDoc === result.id
                            ? 'bg-brand-500 border-brand-600 text-white shadow-md'
                            : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-medium text-xs">
                          {sectionIcons[result.id] || <FileText className="w-4 h-4" weight="duotone" />}
                          <span className="truncate">{result.title}</span>
                        </div>
                        <p className={`text-[11px] leading-normal ${activeDoc === result.id ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'} line-clamp-2 italic font-normal`}>
                          {result.snippet}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
                      No results found for "{searchQuery}"
                    </div>
                  )
                ) : (
                  sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveDoc(section.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2.5 ${
                        activeDoc === section.id
                          ? 'bg-brand-500 text-white font-medium shadow-md shadow-brand-500/10'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sectionIcons[section.id] || <FileText className="w-4 h-4" weight="duotone" />}
                      <span>{section.title}</span>
                    </button>
                  ))
                )}
              </nav>
            </div>
          </div>
        </aside>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 mb-6 notranslate"
        >
          <List className="w-5 h-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 notranslate" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 p-6 overflow-y-auto flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
              {/* Mobile Search Input */}
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 px-1 py-1 mb-3">
                  <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {searchQuery.trim() ? "Search Results" : "Contents"}
                  </span>
                </div>
                <nav className="space-y-2">
                  {searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => { setActiveDoc(result.id); setMobileMenuOpen(false); }}
                          className={`w-full text-left p-3.5 rounded-xl transition-all flex flex-col gap-1.5 border ${
                            activeDoc === result.id
                              ? 'bg-brand-500 border-brand-600 text-white shadow-md'
                              : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 font-medium text-sm">
                            {sectionIcons[result.id] || <FileText className="w-4 h-4" weight="duotone" />}
                            <span>{result.title}</span>
                          </div>
                          <p className={`text-xs ${activeDoc === result.id ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'} line-clamp-2 italic font-normal`}>
                            {result.snippet}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                        No results found for "{searchQuery}"
                      </div>
                    )
                  ) : (
                    sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => { setActiveDoc(section.id); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all flex items-center gap-3 ${
                          activeDoc === section.id
                            ? 'bg-brand-500 text-white font-medium shadow-md shadow-brand-500/10'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {sectionIcons[section.id] || <FileText className="w-4 h-4" weight="duotone" />}
                        <span>{section.title}</span>
                      </button>
                    ))
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}

        <main className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
