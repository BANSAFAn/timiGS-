import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css';

interface DocSection {
  id: string;
  title: string;
  file: string;
}

export default function DocsViewer({ lang = "en" }: { lang?: string }) {
  const [sections, setSections] = useState<DocSection[]>([]);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup marked options and custom extensions
  useEffect(() => {
    // 1. Highlight.js
    const renderer = new marked.Renderer();
    
    // 2. Custom Blockquote for Alerts
    const originalBlockquote = renderer.blockquote.bind(renderer);
    renderer.blockquote = ({ text }: { text: string }) => { 
         if (!text) return '<blockquote></blockquote>';
         const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)/i);
         
         if (alertMatch) {
             const type = alertMatch[1].toLowerCase();
             const content = alertMatch[2];
             
             let styles = "bg-white/5 border-white/10 text-stone-300";
             let icon = "INFO";
             let titleColor = "text-white";

             if (type === 'note') { styles = "bg-blue-500/10 border-blue-500/30 text-blue-100"; icon="ℹ️"; titleColor="text-blue-400"; }
             if (type === 'tip') { styles = "bg-emerald-500/10 border-emerald-500/30 text-emerald-100"; icon="💡"; titleColor="text-emerald-400"; }
             if (type === 'important') { styles = "bg-purple-500/10 border-purple-500/30 text-purple-100"; icon="💜"; titleColor="text-purple-400"; }
             if (type === 'warning') { styles = "bg-amber-500/10 border-amber-500/30 text-amber-100"; icon="⚠️"; titleColor="text-amber-400"; }
             if (type === 'caution') { styles = "bg-red-500/10 border-red-500/30 text-red-100"; icon="🛑"; titleColor="text-red-400"; }

             // render inner MD
             const inner = marked.parse(content);
             return `<div class="my-6 p-5 rounded-2xl border ${styles} backdrop-blur-sm">
                <div class="flex items-center gap-2 font-display font-bold text-xs mb-2 uppercase tracking-wider ${titleColor}">
                    <span>${icon}</span>
                    <span>${type}</span>
                </div>
                <div class="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed opacity-90">${inner}</div>
             </div>`;
         }
         return `<blockquote class="border-l-2 border-white/20 pl-4 italic text-stone-400 my-4">${text}</blockquote>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    } as any); // Cast to any to avoid type issues with older/newer types mismatch if present
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
    fetch(`/docx/${section.file}`)
      .then(res => res.text())
      .then(async text => {
        const html = await marked.parse(text); 
        setContent(html as string); 
        setLoading(false);
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-apple-gray-950 text-white">
      {/* Sidebar - Sticky & Glass */}
      <aside className="w-full md:w-80 flex-shrink-0 border-r border-white/5 bg-apple-gray-900/50 backdrop-blur-xl md:h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white mb-2 tracking-tight">
            Documentation
            </h2>
            <p className="text-xs sm:text-sm text-apple-gray-400 mb-6 sm:mb-8">
                Guides & Resources
            </p>

            <nav className="flex flex-col space-y-1">
            {sections.map((section) => (
                <button
                key={section.id}
                onClick={() => setActiveDoc(section.id)}
                className={`text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium border ${
                    activeDoc === section.id
                    ? "bg-white/10 text-white border-white/10 shadow-lg shadow-black/5"
                    : "text-apple-gray-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
                >
                {section.title}
                </button>
            ))}
            </nav>
        </div>

        {/* Footer in sidebar */}
        <div className="p-4 sm:p-6 mt-auto border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-apple-gray-500 font-mono">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                v2.0.0-stable
            </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 relative min-h-screen">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-64 sm:h-80 md:h-96 bg-gradient-to-b from-apple-blue/5 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 relative z-10">
            {loading ? (
                <div className="space-y-4 sm:space-y-6 animate-pulse">
                    <div className="h-10 sm:h-14 bg-white/5 rounded-xl sm:rounded-2xl w-3/4"></div>
                    <div className="h-3 sm:h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-3 sm:h-4 bg-white/5 rounded w-5/6"></div>
                    <div className="h-48 sm:h-64 bg-white/5 rounded-xl sm:rounded-2xl w-full mt-8 sm:mt-12"></div>
                </div>
            ) : (
                <article
                    ref={contentRef}
                    className="prose prose-invert prose-sm sm:prose-base md:prose-lg max-w-none
                    font-body
                    prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                    prose-h1:text-2xl sm:text-3xl md:text-4xl lg:text-5xl prose-h1:mb-6 sm:mb-8
                    prose-h2:text-lg sm:text-xl md:text-2xl lg:text-3xl prose-h2:mt-10 sm:mt-12 md:mt-16 prose-h2:mb-4 sm:mb-6 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-3 sm:pb-4 prose-h2:text-white
                    prose-h3:text-base sm:text-lg md:text-xl prose-h3:mt-6 sm:mt-8 prose-h3:text-white
                    prose-p:text-apple-gray-300 prose-p:leading-relaxed prose-p:text-xs sm:text-sm md:text-base
                    prose-a:text-apple-blue prose-a:no-underline hover:prose-a:text-apple-blue/80 hover:prose-a:underline
                    prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl sm:rounded-2xl prose-pre:shadow-2xl prose-pre:shadow-black/20 prose-pre:p-3 sm:p-4
                    prose-code:text-emerald-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs sm:text-sm
                    prose-strong:text-white prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-4 sm:pl-6 prose-li:marker:text-apple-gray-500
                    prose-img:rounded-xl sm:rounded-2xl md:rounded-3xl prose-img:shadow-2xl prose-img:shadow-black/20 prose-img:border prose-img:border-white/5 prose-img:my-6 sm:my-8
                    prose-blockquote:border-l-4 prose-blockquote:border-apple-blue/50 prose-blockquote:pl-3 sm:pl-4 prose-blockquote:text-apple-gray-300 prose-blockquote:italic"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </div>
      </main>
    </div>
  );
}
