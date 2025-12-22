import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Releases from './pages/Releases';
import Download from './pages/Download';
import Terms from './pages/Terms';
import ParticleBackground from './components/ParticleBackground';
import { Language, Translation } from './types';
import { TRANSLATIONS } from './translations';

// Language Context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Custom Cursor Component
const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      if (followerRef.current) {
        // Add a slight delay/smoothing to the follower
        followerRef.current.animate({
          transform: `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`
        }, {
          duration: 500,
          fill: "forwards"
        });
      }
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-3 h-3 bg-sky-400 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ marginTop: '-6px', marginLeft: '-6px' }}
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-sky-400/50 rounded-full pointer-events-none z-[9998] transition-opacity duration-300"
      />
    </>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.EN);

  const t = TRANSLATIONS[language];

  // Handle RTL for Arabic
  useEffect(() => {
    if (language === Language.AR) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Router>
        <ScrollToTop />
        <CustomCursor />
        
        <div className="min-h-screen flex flex-col font-sans text-slate-50 selection:bg-sky-500/30 overflow-hidden relative">
          
          {/* Dynamic Backgrounds */}
          <div className="fixed inset-0 -z-10 h-full w-full pointer-events-none overflow-hidden">
             {/* Particle System */}
             <ParticleBackground />

             {/* Grid */}
             <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
             
             {/* Radial Gradient */}
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>
             
             {/* Animated Blobs */}
             <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
             <div className="absolute top-0 -right-4 w-96 h-96 bg-sky-500/30 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
             <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
          </div>
          
          <Navbar />
          
          <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/releases" element={<Releases />} />
              <Route path="/download" element={<Download />} />
              <Route path="/terms" element={<Terms />} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </LanguageContext.Provider>
  );
};

export default App;