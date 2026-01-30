import { useState, useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css';
import { BookOpen, Calendar, ChevronRight, PenLine } from "lucide-react";

interface NoteEntry {
  id: string;
  title: string;
  file: string;
  date: string;
}

export default function NotesViewer({ lang = "en" }: { lang?: string }) {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup marked options and custom extensions
  useEffect(() => {
    const renderer = new marked.Renderer();
    
    // Custom Blockquote for Alerts
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
      highlight: function(code: string, lang: string) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    } as any);
  }, []);

  // Fetch Notes Config
  useEffect(() => {
    fetch("/notes.json")
      .then((res) => res.json())
      .then((data) => {
        setNotes(data);
        if (data.length > 0) {
          setActiveNote(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to load notes config", err));
  }, []);

  // Fetch MarkDown Content
  useEffect(() => {
    if (!activeNote) return;
    
    const note = notes.find(n => n.id === activeNote);
    if (!note) return;

    setLoading(true);
    fetch(`/Note-md-store/${note.file}`)
      .then(res => res.text())
      .then(async text => {
        const html = await marked.parse(text); 
        setContent(html as string); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load note file", err);
        setContent("<h1>404</h1><p>Failed to load note.</p>");
        setLoading(false);
      });
  }, [activeNote, notes]);

  // Syntax highlighting effect
  useEffect(() => {
    if (!loading && contentRef.current) {
      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content, loading]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-apple-gray-950 text-white">
      {/* Sidebar - Sticky & Glass */}
      <aside className="w-full md:w-80 flex-shrink-0 border-r border-white/5 bg-apple-gray-900/50 backdrop-blur-xl md:h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-6 md:p-8">
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                    <PenLine className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
                    Dev Notes
                </h2>
            </div>
            <p className="text-sm text-apple-gray-400 mb-8 ml-12">
                Developer Diary
            </p>
            
            <nav className="flex flex-col space-y-2">
            {notes.map((note) => (
                <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className={`text-left px-4 py-4 rounded-xl transition-all duration-300 text-sm border group ${
                    activeNote === note.id
                    ? "bg-white/10 border-white/10 shadow-lg shadow-black/5"
                    : "border-transparent hover:bg-white/5"
                }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`font-medium ${activeNote === note.id ? 'text-white' : 'text-apple-gray-300 group-hover:text-white'}`}>
                            {note.title}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeNote === note.id ? 'text-white translate-x-0.5' : 'text-apple-gray-500 group-hover:text-white'}`} />
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-apple-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(note.date)}</span>
                    </div>
                </button>
            ))}
            </nav>
        </div>
        
        {/* Footer in sidebar */}
        <div className="p-6 mt-auto border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-apple-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>Personal Development Journal</span>
            </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 relative min-h-screen">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto p-8 md:p-16 relative z-10">
            {loading ? (
                <div className="space-y-6 animate-pulse">
                    <div className="h-14 bg-white/5 rounded-2xl w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                    <div className="h-64 bg-white/5 rounded-2xl w-full mt-12"></div>
                </div>
            ) : (
                <article 
                    ref={contentRef}
                    className="prose prose-invert prose-lg max-w-none 
                    font-body
                    prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
                    prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:mb-8 
                    prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-4 prose-h2:text-white
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:text-white
                    prose-p:text-apple-gray-300 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg
                    prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300 hover:prose-a:underline
                    prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:shadow-2xl prose-pre:shadow-black/20
                    prose-code:text-amber-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm
                    prose-strong:text-white prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-apple-gray-500
                    prose-img:rounded-3xl prose-img:shadow-2xl prose-img:shadow-black/20 prose-img:border prose-img:border-white/5 prose-img:my-8"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </div>
      </main>
    </div>
  );
}
