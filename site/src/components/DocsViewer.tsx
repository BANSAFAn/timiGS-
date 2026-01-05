import { useState, useEffect } from "react";
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

  // Setup marked options and custom extensions
  useEffect(() => {
    // 1. Highlight.js
    const renderer = new marked.Renderer();
    
    // 2. Custom Blockquote for Alerts
    // GitHub uses: > [!NOTE] content
    const originalBlockquote = renderer.blockquote.bind(renderer);
    renderer.blockquote = (token) => {
      // In marked v12+ token is object { type, text, tokens, ... }
      // Older versions it might be string text. 
      // Safe check:
       const text = token.text || token;
       
       const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)/);
       
       if (alertMatch) {
         const type = alertMatch[1].toLowerCase();
         const content = alertMatch[2];
         
         let styles = "bg-slate-800 border-l-4 border-slate-500 text-slate-300";
         let icon = "ℹ️";
         let title = "Note";

         switch(type) {
           case 'note':
             styles = "bg-blue-500/10 border-l-4 border-blue-500 text-blue-200";
             icon = "ℹ️";
             title = "Note";
             break;
           case 'tip':
              styles = "bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-200";
              icon = "💡";
              title = "Tip";
              break;
           case 'important':
              styles = "bg-purple-500/10 border-l-4 border-purple-500 text-purple-200";
              icon = "💜";
              title = "Important";
              break;
           case 'warning':
              styles = "bg-amber-500/10 border-l-4 border-amber-500 text-amber-200";
              icon = "⚠️";
              title = "Warning";
              break;
           case 'caution':
              styles = "bg-red-500/10 border-l-4 border-red-500 text-red-200";
              icon = "🛑";
              title = "Caution";
              break;
         }

         // We need to parse inner content effectively. 
         // Since we interrupted the blockquote, we might need to process inline markdown of 'content'.
         // But simple replacement works for basic text. For full MD support inside alert, we'd recursively parse.
         const innerHtml = marked.parse(content);

         return `
           <div class="mb-6 p-4 rounded-r-lg ${styles}">
             <div class="flex items-center gap-2 font-bold mb-2 uppercase text-xs tracking-wider opacity-90">
                <span>${icon}</span>
                <span>${title}</span>
             </div>
             <div class="prose prose-invert prose-sm max-w-none text-opacity-90">
               ${innerHtml}
             </div>
           </div>
         `;
       }
       
       return originalBlockquote(token);
    };

    marked.setOptions({
      renderer,
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    });
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
      .then(text => {
        // Parse MD
        const html = marked.parse(text); // highlight/renderer configured globally above? No, marked is stateless now mostly? 
        // Actually marked v5+ isn't stateful options. We should pass renderer here or use marked.use.
        // Let's fix above logic by using marked.use() once or passing renderer here.
        setContent(html as string); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load doc file", err);
        setContent("<h1>404</h1><p>Failed to load documentation.</p>");
        setLoading(false);
      });
  }, [activeDoc, sections]);

  // Re-configure marked inside effect dependency to ensure it uses custom renderer
  useEffect(() => {
    const renderer = new marked.Renderer();
    renderer.blockquote = ({ text }) => { // Token object in newer marked
         if (!text) return '<blockquote></blockquote>';
         const alertMatch = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)/i);
         
         if (alertMatch) {
             const type = alertMatch[1].toLowerCase();
             const content = alertMatch[2];
             let styles = "bg-slate-800/50 border-emerald-500/50 text-slate-300"; // default
             let icon = "INFO";

             if (type === 'note') { styles = "bg-blue-500/10 border-blue-500 text-blue-100"; icon="ℹ️ NOTE"; }
             if (type === 'tip') { styles = "bg-emerald-500/10 border-emerald-500 text-emerald-100"; icon="💡 TIP"; }
             if (type === 'important') { styles = "bg-purple-500/10 border-purple-500 text-purple-100"; icon="💜 IMPORTANT"; }
             if (type === 'warning') { styles = "bg-amber-500/10 border-amber-500 text-amber-100"; icon="⚠️ WARNING"; }
             if (type === 'caution') { styles = "bg-red-500/10 border-red-500 text-red-100"; icon="🛑 CAUTION"; }

             // render inner MD
             const inner = marked.parse(content);
             return `<div class="my-6 p-4 rounded-r-xl border-l-4 ${styles} shadow-sm backdrop-blur-sm">
                <div class="font-bold text-xs mb-2 opacity-80">${icon}</div>
                <div class="prose prose-invert prose-sm max-w-none">${inner}</div>
             </div>`;
         }
         return `<blockquote class="border-l-4 border-slate-600 pl-4 italic text-slate-400">${text}</blockquote>`;
    };

    marked.use({ 
        renderer,
        gfm: true,
    });
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#020617] text-slate-200">
      {/* Sidebar - Sticky & Glass */}
      <aside className="w-full md:w-72 flex-shrink-0 border-r border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl md:h-screen sticky top-0 overflow-y-auto">
        <div className="p-6">
            <h2 className="text-2xl font-black bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent mb-8 tracking-tight">
            Documentation
            </h2>
            
            <nav className="flex flex-col space-y-1">
            {sections.map((section) => (
                <button
                key={section.id}
                onClick={() => setActiveDoc(section.id)}
                className={`text-left px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium border ${
                    activeDoc === section.id
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-lg shadow-sky-500/5 translate-x-1"
                    : "text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-800/50 hover:pl-5"
                }`}
                >
                {section.title}
                </button>
            ))}
            </nav>
        </div>
        
        {/* Footer in sidebar */}
        <div className="p-6 mt-auto border-t border-slate-800/50">
            <div className="text-xs text-slate-600 font-mono">
                v2.0.0-stable
            </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto p-8 md:p-16 relative z-10">
            {loading ? (
                <div className="space-y-4 animate-pulse">
                    <div className="h-12 bg-slate-800/50 rounded-xl w-3/4"></div>
                    <div className="h-4 bg-slate-800/50 rounded w-full"></div>
                    <div className="h-4 bg-slate-800/50 rounded w-5/6"></div>
                    <div className="h-64 bg-slate-800/30 rounded-xl w-full mt-8"></div>
                </div>
            ) : (
                <article 
                    className="prose prose-invert prose-lg max-w-none 
                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                    prose-h1:text-5xl prose-h1:mb-8 prose-h1:bg-gradient-to-br prose-h1:from-white prose-h1:to-slate-400 prose-h1:bg-clip-text prose-h1:text-transparent
                    prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-4
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-a:text-sky-400 prose-a:no-underline hover:prose-a:text-sky-300 hover:prose-a:underline
                    prose-pre:bg-[#0f172a] prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-2xl prose-pre:shadow-2xl
                    prose-code:text-sky-300 prose-code:bg-slate-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                    prose-strong:text-white prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-sky-500
                    prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-slate-800"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </div>
      </main>
    </div>
  );
}
