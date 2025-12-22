import React from 'react';
import { Github } from 'lucide-react';
import { Translation } from '../i18n/types';

interface FooterProps {
    t: Translation;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-8 mt-auto border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-slate-400 text-sm">
          © {currentYear} TimiGS. {t.footer.rights}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{t.footer.created_by}</span>
            <a 
                href="https://github.com/BANSAFAn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            >
                BANSAFAn
                <Github className="w-3.5 h-3.5" />
            </a>
        </div>

        <div className="text-slate-500 text-xs">
          {t.footer.built_with}
        </div>
      </div>
    </footer>
  );
};

export default Footer;