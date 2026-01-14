import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505] border-b border-neutral-800 h-20">
      <div className="max-w-[1400px] mx-auto h-full relative">
        {/* Asymmetrical Grid Line matching Uploader */}
        <div className="absolute top-0 bottom-0 left-[30%] w-px bg-neutral-800 hidden md:block" />

        <div className="h-full flex items-center justify-between px-6 sm:px-8">
          {/* Brand Section - Aligned to the left zone */}
          <div className="md:w-[30%] flex items-center">
            <h1 className="font-sans text-lg md:text-xl font-medium tracking-tight text-white leading-none">
              Video to <span className="text-accent">Visual Reasoning</span>
            </h1>
          </div>
          
          {/* Navigation Section - Aligned to the right zone */}
          <div className="flex-1 flex justify-end items-center gap-8 md:pl-10">
             <nav className="hidden md:flex items-center gap-8">
                <a href="#" className="group flex items-center gap-1 font-sans text-xs font-medium text-neutral-500 hover:text-white transition-colors">
                  GUIDE
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </a>
                <a href="#" className="group flex items-center gap-1 font-sans text-xs font-medium text-neutral-500 hover:text-white transition-colors">
                  ARCHIVE
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </a>
             </nav>
             
             {/* Version/Date Tag */}
             <div className="flex items-center gap-3 pl-8 border-l border-neutral-800 h-8">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  V.2.0 / {new Date().getFullYear()}
                </span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;