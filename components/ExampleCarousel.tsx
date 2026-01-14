import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ScanFace, Waves, Film } from 'lucide-react';

const EXAMPLES = [
  {
    id: 1,
    label: "ARCHIVAL_FILM_NOIR",
    image: "https://images.unsplash.com/photo-1596727147705-54a7128052a9?q=80&w=2574&auto=format&fit=crop",
    visual: "High-contrast chiaroscuro lighting isolates the subject, suggesting moral ambiguity and psychological fragmentation.",
    audio: "Distant, non-diegetic sirens (Doppler effect) create an undercurrent of urban anxiety.",
    icon: Film
  },
  {
    id: 2,
    label: "TECH_REVIEW_V9",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
    visual: "Macro depth-of-field focuses on material texture; rapid cut rate implies efficiency and modernity.",
    audio: "Synthesized, rhythmic percussive track synchronizes with visual transitions to drive engagement.",
    icon: ScanFace
  },
  {
    id: 3,
    label: "ECOLOGY_STUDY_BETA",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670&auto=format&fit=crop",
    visual: "Static wide-angle composition emphasizes the scale of the environment vs. the insignificance of the observer.",
    audio: "Absence of music; dominance of wind noise (white noise spectrum) reinforces isolation.",
    icon: Waves
  }
];

const ExampleCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto rotate
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % EXAMPLES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isPaused]);

    const next = () => setCurrentIndex((prev) => (prev + 1) % EXAMPLES.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + EXAMPLES.length) % EXAMPLES.length);

    const current = EXAMPLES[currentIndex];

    return (
        <div 
            className="w-full border border-white/10 bg-neutral-900/30 relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
             {/* Decorative Corner */}
            <div className="absolute top-0 right-0 p-2 z-10">
                 <div className="w-2 h-2 border-t border-r border-accent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] h-full">
                {/* Image Section */}
                <div className="relative aspect-video md:aspect-auto md:h-full overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                    <img 
                        src={current.image} 
                        alt={current.label}
                        className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="flex items-center gap-2 text-white/80">
                             <current.icon size={14} />
                             <span className="font-mono text-[10px] tracking-widest uppercase">{current.label}</span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col justify-center gap-6 relative">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-accent text-[9px] font-mono uppercase tracking-widest border border-accent/20 px-1 py-0.5">Visual Syntax</span>
                            <p className="text-xs text-neutral-400 font-light leading-relaxed">
                                {current.visual}
                            </p>
                        </div>
                        <div className="space-y-1">
                             <span className="text-accent text-[9px] font-mono uppercase tracking-widest border border-accent/20 px-1 py-0.5">Audio Context</span>
                            <p className="text-xs text-neutral-400 font-light leading-relaxed">
                                {current.audio}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-1">
                            {EXAMPLES.map((_, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-0.5 w-3 transition-colors duration-300 ${idx === currentIndex ? 'bg-accent' : 'bg-neutral-800 hover:bg-neutral-600'}`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={prev} className="p-1 text-neutral-500 hover:text-white transition-colors">
                                <ChevronLeft size={14} />
                            </button>
                            <button onClick={next} className="p-1 text-neutral-500 hover:text-white transition-colors">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExampleCarousel;