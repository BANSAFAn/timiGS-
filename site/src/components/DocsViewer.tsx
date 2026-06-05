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
  FileText
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

export default function DocsViewer({ lang = "en" }: { lang?: string }) {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const docsCache = useRef<Record<string, string>>({});

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
      .then((data) => {
        setSections(data);
        if (data.length > 0) {
          setActiveDoc(data[0].id);
        }
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

  return (
    <div className="max-w-7xl mx-auto py-12">
      <div className="mb-12">
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

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 px-3 py-2 mb-3">
              <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Contents</span>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
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
              ))}
            </nav>
          </div>
        </aside>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 mb-6"
        >
          <List className="w-5 h-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-2">
                {sections.map((section) => (
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
                ))}
              </nav>
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
