import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ScanFace, Waves, Film } from 'lucide-react';

const EXAMPLES = [
  {
    id: 1,
    label: "FILM_NOIR",
    image: "https://images.unsplash.com/photo-1596727147705-54a7128052a9?q=80&w=2574&auto=format&fit=crop",
    visual: "High-contrast chiaroscuro lighting isolates subject; implies moral ambiguity.",
    audio: "Distant, non-diegetic sirens create urban anxiety.",
    icon: Film
  },
  {
    id: 2,
    label: "TECH_REVIEW",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2670&auto=format&fit=crop",
    visual: "Macro depth-of-field; rapid cuts imply efficiency.",
    audio: "Synthesized rhythmic track drives engagement.",
    icon: ScanFace
  },
  {
    id: 3,
    label: "ECO_STUDY",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2670&auto=format&fit=crop",
    visual: "Static wide-angle emphasizes insignificance of observer.",
    audio: "Dominance of wind noise reinforces isolation.",
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
            className="w-full border border-white/10 bg-neutral-900/30 relative group flex flex-col"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
             {/* Decorative Corner */}
            <div className="absolute top-0 right-0 p-1.5 z-10">
                 <div className="w-1.5 h-1.5 border-t border-r border-accent"></div>
            </div>

            {/* Image Section - Compact Strip */}
            <div className="relative aspect-[2.2/1] w-full overflow-hidden border-b border-white/10 transition-colors group-hover:border-accent/30">
                <img 
                    src={current.image} 
                    alt={current.label}
                    className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:contrast-125 transition-all duration-700 ease-out"
                />
                
                {/* Yellow Accent Overlay */}
                <div className="absolute inset-0 bg-accent mix-blend-overlay opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"></div>

                {/* Gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"></div>
                
                <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                    <div className="flex items-center gap-1.5 text-white/70 group-hover:text-accent transition-colors duration-500">
                         <current.icon size={12} />
                         <span className="font-mono text-[9px] tracking-widest uppercase">{current.label}</span>
                    </div>
                </div>
            </div>

            {/* Content Section - Compact */}
            <div className="p-3 flex flex-col gap-2 relative">
                <div className="space-y-2">
                    <div className="space-y-0.5">
                        <span className="text-accent text-[8px] font-mono uppercase tracking-widest opacity-70 block">Visual Syntax</span>
                        <p className="text-[10px] text-neutral-400 font-light leading-snug line-clamp-2">
                            {current.visual}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                         <span className="text-accent text-[8px] font-mono uppercase tracking-widest opacity-70 block">Audio Context</span>
                        <p className="text-[10px] text-neutral-400 font-light leading-snug line-clamp-2">
                            {current.audio}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                    <div className="flex gap-1">
                        {EXAMPLES.map((_, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setCurrentIndex(idx)}
                                className={`h-0.5 w-2 transition-colors duration-300 ${idx === currentIndex ? 'bg-accent' : 'bg-neutral-800 hover:bg-neutral-600'}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <button onClick={prev} className="p-0.5 text-neutral-500 hover:text-white transition-colors">
                            <ChevronLeft size={12} />
                        </button>
                        <button onClick={next} className="p-0.5 text-neutral-500 hover:text-white transition-colors">
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExampleCarousel;