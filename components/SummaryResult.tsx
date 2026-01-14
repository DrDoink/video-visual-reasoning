import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Headphones, Square, Play, Image as ImageIcon, Loader2, X, Quote, User, Activity, Sparkles, Lightbulb, Zap } from 'lucide-react';
import { jsPDF } from "jspdf";
import { generateAudioReview } from '../services/gemini';

interface SummaryResultProps {
  summary: string;
  videoUrl: string;
}

interface TimelineSegmentData {
  raw: string;
  timestamp: string;
  title: string;
  speaker: string;
  sentiment: string;
  dialogue: string;
  visualContext: string;
}

interface InsightData {
  title: string;
  content: string;
}

// Helper to decode base64 string
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Parse MM:SS or HH:MM:SS to seconds
const parseTimestamp = (timestamp: string): number => {
  if (!timestamp) return 0;
  // Clean timestamp of brackets if present e.g. [01:30]
  const clean = timestamp.replace(/[\[\]]/g, '');
  const parts = clean.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

// Helper: Extract frame from video URL at specific time
const extractFrame = async (videoUrl: string, time: number): Promise<string | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = videoUrl;
    video.preload = 'metadata'; // Ensure we get metadata to seek
    
    // Safety timeout
    const timeout = setTimeout(() => {
        resolve(null);
    }, 4000);

    const onSeeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            try {
                const data = canvas.toDataURL('image/jpeg', 0.85);
                clearTimeout(timeout);
                resolve(data);
            } catch (e) {
                console.error("Frame capture error", e);
                resolve(null);
            }
        } else {
            resolve(null);
        }
        // Cleanup refs
        video.src = ""; 
        video.remove();
    };

    video.onloadedmetadata = () => {
        // Clamp time to duration
        const safeTime = Math.min(time, video.duration - 0.1); 
        video.currentTime = safeTime;
    };
    
    video.onseeked = onSeeked;
    
    video.onerror = (e) => {
        console.error("Video error during frame extraction", e);
        clearTimeout(timeout);
        resolve(null);
    }
  });
};

const TimelineSegment: React.FC<{ segment: TimelineSegmentData; id: string; videoUrl: string; isHighlighted?: boolean }> = ({ segment, id, videoUrl, isHighlighted }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchFrame = async () => {
      // Don't extract if no timestamp is present or it's 00:00 (unless it's the start, but let's avoid duplicates)
      if (!segment.timestamp) return;
      
      setLoading(true);
      try {
        const seconds = parseTimestamp(segment.timestamp);
        const url = await extractFrame(videoUrl, seconds);
        if (isMounted && url) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error("Failed to extract frame", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFrame();

    return () => { isMounted = false; };
  }, [segment.timestamp, videoUrl]);

  return (
    <div 
        id={id} 
        className={`grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8 mb-16 pl-8 relative scroll-mt-32 group transition-all duration-700 ease-out ${isHighlighted ? 'border-l border-accent bg-accent/5' : 'border-l border-white/10'}`}
    >
       {/* Timeline Node */}
       <div className={`absolute -left-[5px] top-1 w-[9px] h-[9px] rounded-full border transition-all duration-500 ${isHighlighted ? 'bg-accent border-accent shadow-[0_0_15px_rgba(255,198,0,0.6)] scale-125' : 'bg-neutral-800 border-neutral-600 group-hover:bg-accent group-hover:border-accent'}`}></div>

       {/* Text Content */}
       <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
                <span className={`font-mono text-xs tracking-wider px-1.5 py-0.5 rounded transition-colors duration-500 ${isHighlighted ? 'bg-accent text-black' : 'bg-accent/10 text-accent'}`}>
                    {segment.timestamp}
                </span>
             </div>
             <h3 className="font-serif text-xl text-white italic leading-tight mt-2">{segment.title}</h3>
          </div>

          {/* Speaker & Sentiment Meta */}
          <div className={`flex flex-wrap gap-y-2 gap-x-6 py-3 border-y transition-colors duration-500 ${isHighlighted ? 'border-accent/20' : 'border-white/5'}`}>
              {segment.speaker && (
                  <div className="flex items-center gap-2">
                      <User size={12} className="text-neutral-500" />
                      <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Speaker</span>
                      <span className="font-sans text-xs text-neutral-200 font-medium">{segment.speaker}</span>
                  </div>
              )}
              {segment.sentiment && (
                  <div className="flex items-center gap-2">
                      <Activity size={12} className="text-neutral-500" />
                      <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Sentiment</span>
                      <span className="font-sans text-xs text-accent/80">{segment.sentiment}</span>
                  </div>
              )}
          </div>

          {/* Dialogue / Content */}
          <div className="relative">
             <Quote size={24} className="absolute -left-4 -top-2 text-white/5" />
             <div className={`relative pl-4 border-l-2 transition-colors duration-500 ${isHighlighted ? 'border-accent' : 'border-accent/30'}`}>
                <p className="font-serif text-lg text-neutral-300 leading-relaxed italic opacity-90">
                   "{segment.dialogue}"
                </p>
             </div>
          </div>

          {/* Visual Context Text */}
          {segment.visualContext && (
              <div className="pt-2">
                  <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest mb-1 block">Visual Context</span>
                  <p className="font-sans text-xs text-neutral-500 leading-relaxed max-w-prose">
                      {segment.visualContext}
                  </p>
              </div>
          )}
       </div>

       {/* Visual Thumbnail */}
       <div className="w-full pt-1">
          {loading ? (
             <div className="w-full aspect-video bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-3 animate-pulse">
                <Loader2 size={24} className="text-neutral-600 animate-spin" />
                <span className="font-mono text-[8px] text-neutral-600 uppercase tracking-widest">Extracting_Frame</span>
             </div>
          ) : imageUrl ? (
             <div className="w-full group/image relative corner-brackets p-1">
                <div className={`absolute -top-2 left-0 px-2 font-mono text-[8px] uppercase tracking-widest z-10 transition-colors duration-500 ${isHighlighted ? 'bg-accent text-black' : 'bg-[#050505] text-accent'}`}>
                   Source_Frame
                </div>
                <img 
                  src={imageUrl} 
                  alt={`Frame at ${segment.timestamp}`} 
                  className={`w-full h-auto object-cover border transition-all duration-500 ${isHighlighted ? 'border-accent opacity-100' : 'border-neutral-800 opacity-90 group-hover/image:opacity-100'}`}
                />
             </div>
          ) : (
             <div className="w-full aspect-video bg-neutral-900/30 border border-neutral-800/50 flex items-center justify-center group-hover:border-neutral-700 transition-colors">
                <div className="text-center space-y-2">
                   <ImageIcon size={20} className="text-neutral-700 mx-auto" />
                   <span className="block font-mono text-[8px] text-neutral-700 uppercase tracking-widest">Frame Unavailable</span>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const SummaryResult: React.FC<SummaryResultProps> = ({ summary, videoUrl }) => {
  const [copied, setCopied] = React.useState(false);
  
  // Audio Remix State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioData, setAudioData] = useState<{ text: string, audioBase64: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Highlighting State
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Parse summary into sections for advanced rendering
  const parsedContent = useMemo(() => {
    try {
      const executiveMatch = summary.match(/## 🎬 Executive Summary([\s\S]*?)(?=## ⏱️|$)/);
      const executive = executiveMatch ? executiveMatch[1].trim() : '';

      const timelineMatch = summary.match(/## ⏱️ Detailed Chronological Analysis([\s\S]*?)(?=## 🗝️|$)/);
      let timelineSegments: TimelineSegmentData[] = [];
      
      if (timelineMatch) {
        const timelineText = timelineMatch[1];
        // Split by the segment header pattern ### 🔹
        const rawSegments = timelineText.split(/(?=### 🔹)/).filter(s => s.trim().startsWith('### 🔹'));
        
        timelineSegments = rawSegments.map(seg => {
          const lines = seg.trim().split('\n');
          const header = lines[0] || '';
          
          // Extract timestamp and title
          // Header format: ### 🔹 [MM:SS] - Title
          const timeMatch = header.match(/\[(.*?)\]/);
          const titleMatch = header.match(/\]\s*-\s*(.*)/); 
          
          // Regex extraction for fields
          const speakerMatch = seg.match(/\*\*🗣️ Speaker\*\*:([\s\S]*?)(?=\n\s*\*|\n###|$)/);
          const sentimentMatch = seg.match(/\*\*🎭 Sentiment\*\*:([\s\S]*?)(?=\n\s*\*|\n###|$)/);
          const dialogueMatch = seg.match(/\*\*💬 Dialogue\*\*:([\s\S]*?)(?=\n\s*\*|\n###|$)/);
          const visualMatch = seg.match(/\*\*👁️ Visual Context\*\*:([\s\S]*?)(?=\n\s*\*|\n###|$)/);
          
          return {
            raw: seg,
            timestamp: timeMatch ? timeMatch[1] : '00:00',
            title: titleMatch ? titleMatch[1].trim() : 'Event Segment',
            speaker: speakerMatch ? speakerMatch[1].trim() : 'Unknown Speaker',
            sentiment: sentimentMatch ? sentimentMatch[1].trim() : 'Neutral',
            dialogue: dialogueMatch ? dialogueMatch[1].trim() : 'No dialogue detected.',
            visualContext: visualMatch ? visualMatch[1].trim() : ''
          };
        });
      }

      // Updated regex to match the new "Critical Analysis & Takeaways" header
      const takeawaysMatch = summary.match(/## 🗝️ Critical Analysis & Takeaways([\s\S]*)/) || summary.match(/## 🗝️ Key Takeaways([\s\S]*)/);
      
      let insights: InsightData[] = [];
      const rawTakeaways = takeawaysMatch ? takeawaysMatch[1].trim() : '';

      if (rawTakeaways) {
         // Split by markdown bullets
         const items = rawTakeaways.split('\n').filter(line => line.trim().startsWith('*') || line.trim().startsWith('-'));
         insights = items.map(item => {
             // Clean the bullet
             const clean = item.replace(/^[*-\s]+/, '').trim();
             // Try to find bolded title pattern **TITLE**: Content
             const titleMatch = clean.match(/\*\*(.*?)\*\*:?\s*(.*)/);
             if (titleMatch) {
                 return { title: titleMatch[1], content: titleMatch[2] };
             }
             return { title: 'Observation', content: clean };
         });
      }

      if (!executive && timelineSegments.length === 0) return null;

      return { executive, timelineSegments, insights, rawTakeaways };
    } catch (e) {
      console.error("Parsing error", e);
      return null;
    }
  }, [summary]);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSegmentClick = (id: string) => {
    scrollToId(id);
    setHighlightedId(id);
    // Remove highlight after animation duration (2.5s allows for a nice fade in/out cycle)
    setTimeout(() => setHighlightedId(null), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAudio = async () => {
    if (audioData) return;

    setIsGeneratingAudio(true);
    try {
      const result = await generateAudioReview(summary);
      setAudioData({ text: result.text, audioBase64: result.audioData });
    } catch (error) {
      console.error("Failed to generate audio", error);
      alert("Could not generate audio remix. Try again later.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleCloseAudio = () => {
    stopAudio();
    setAudioData(null);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!audioData?.audioBase64) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }

      const ctx = audioContextRef.current;
      
      // Decode base64
      const bytes = decodeBase64(audioData.audioBase64);
      
      // Decode audio data. 
      // Note: We need to copy the array buffer because decodeAudioData detaches it.
      const bufferCopy = bytes.buffer.slice(0);
      
      // We manually handle the promise to be safe with older browser implementations
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(bufferCopy, resolve, reject);
      });

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
      
    } catch (error) {
      console.error("Playback error", error);
      setIsPlaying(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "analysis_report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Aesthetic Constants
    const COLOR_ACCENT = [255, 198, 0]; // #FFC600
    const COLOR_BLACK = [5, 5, 5];
    const COLOR_GRAY = [60, 60, 60];
    
    let y = margin;

    // Helper: Draw Header on every page
    const drawPageHeader = () => {
       doc.setFont("helvetica", "bold");
       doc.setFontSize(8);
       doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
       doc.text("VIDEO TO VISUAL REASONING", margin, 15);
       
       doc.setFont("courier", "normal");
       doc.setFontSize(8);
       doc.setTextColor(150, 150, 150);
       const dateStr = `ID_${Date.now().toString().slice(-6)} // ${new Date().toLocaleDateString()}`;
       const dateWidth = doc.getTextWidth(dateStr);
       doc.text(dateStr, pageWidth - margin - dateWidth, 15);
       
       doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
       doc.setLineWidth(0.5);
       doc.line(margin, 20, pageWidth - margin, 20);
    };

    // Initial Setup
    drawPageHeader();
    y = 35; 

    // Document Title
    doc.setFont("times", "italic");
    doc.setFontSize(24);
    doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
    doc.text("Analysis Results", margin, y);
    y += 15;

    // Process Content Line by Line
    const lines = summary.split('\n');
    const lineHeight = 5.5;

    lines.forEach((line) => {
        // Check for page break
        if (y > pageHeight - margin) {
            doc.addPage();
            drawPageHeader();
            y = 35;
        }

        const trimmed = line.trim();
        if (!trimmed) {
            y += lineHeight / 2;
            return;
        }

        // H2 Headers (## ) -> Large Serif
        if (trimmed.startsWith('## ')) {
            y += 8; // Extra spacing before section
            if (y > pageHeight - margin) { doc.addPage(); drawPageHeader(); y = 35; }

            const text = trimmed.replace(/^##\s+/, '');
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
            doc.text(text, margin, y);
            
            // Accent Underline
            const textWidth = doc.getTextWidth(text);
            doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, y + 2, margin + textWidth, y + 2);
            
            y += lineHeight * 2;
        }
        // H3 Headers (### ) -> Technical Mono
        else if (trimmed.startsWith('### ')) {
            y += 4;
            if (y > pageHeight - margin) { doc.addPage(); drawPageHeader(); y = 35; }
            
            const text = trimmed.replace(/^###\s+/, '');
            doc.setFont("courier", "bold");
            doc.setFontSize(10);
            doc.setTextColor(COLOR_BLACK[0], COLOR_BLACK[1], COLOR_BLACK[2]);
            doc.text(text.toUpperCase(), margin, y);
            y += lineHeight * 1.5;
        }
        // List Items (* or -) -> Indented with custom bullet
        else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            // Remove markdown syntax (*, -, **)
            const cleanText = trimmed.replace(/^[*-\s]+/, '').replace(/\*\*/g, ''); 
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(COLOR_GRAY[0], COLOR_GRAY[1], COLOR_GRAY[2]);

            // Custom Accent Bullet
            doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
            doc.circle(margin + 2, y - 1.5, 0.8, 'F');

            const textLines = doc.splitTextToSize(cleanText, contentWidth - 8);
            
            // Block height check
            if (y + (textLines.length * lineHeight) > pageHeight - margin) {
                 doc.addPage(); drawPageHeader(); y = 35;
            }

            doc.text(textLines, margin + 8, y);
            y += textLines.length * lineHeight + 2; // Extra spacing for readability
        }
        // Standard Paragraph
        else {
            const cleanText = trimmed.replace(/\*\*/g, '');
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(COLOR_GRAY[0], COLOR_GRAY[1], COLOR_GRAY[2]);
            
            const textLines = doc.splitTextToSize(cleanText, contentWidth);
            
            if (y + (textLines.length * lineHeight) > pageHeight - margin) {
                 doc.addPage(); drawPageHeader(); y = 35;
            }

            doc.text(textLines, margin, y);
            y += textLines.length * lineHeight;
        }
    });

    doc.save("visual-reasoning-analysis.pdf");
  };

  return (
    <div className="w-full animate-in fade-in duration-700">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-white/10 pb-4 mb-8 gap-4">
        <div>
          <h2 className="font-serif text-3xl text-white italic">Analysis Results</h2>
          <p className="font-mono text-[10px] text-accent mt-1 uppercase tracking-widest">
             /// Generated by Gemini 2.0
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Weird Remix Button */}
           {!audioData && (
             <button
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                className="group flex items-center gap-2 px-3 py-1 font-mono text-[10px] uppercase border border-accent/20 text-accent hover:bg-accent hover:text-black transition-all disabled:opacity-50 disabled:cursor-wait"
             >
                {isGeneratingAudio ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : (
                    <Headphones size={12} />
                )}
                <span>{isGeneratingAudio ? 'Remixing...' : 'Weird Remix'}</span>
             </button>
           )}

          <div className="flex gap-1 border-l border-white/10 pl-4">
             <button 
                onClick={handleDownloadTxt}
                className="px-3 py-1 font-mono text-[10px] uppercase border border-neutral-800 text-neutral-400 hover:text-accent hover:border-accent transition-all"
            >
                .TXT
            </button>
            <button 
                onClick={handleDownloadPdf}
                className="px-3 py-1 font-mono text-[10px] uppercase border border-neutral-800 text-neutral-400 hover:text-accent hover:border-accent transition-all"
            >
                .PDF
            </button>
          </div>
          <button 
            onClick={handleCopy}
            className="group flex items-center gap-2 px-3 py-1 font-mono text-[10px] uppercase text-neutral-400 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-accent"/> : <Copy size={12} />}
            <span className="group-hover:underline decoration-accent underline-offset-4">
                {copied ? 'COPIED' : 'COPY RAW'}
            </span>
          </button>
        </div>
      </div>
      
      {/* Audio Remix Player Section */}
      {audioData && (
        <div className="mb-12 border border-accent/20 bg-accent/5 p-6 relative overflow-hidden animate-in slide-in-from-top-4">
            {/* Close Button */}
            <button 
              onClick={handleCloseAudio}
              className="absolute top-2 right-2 text-accent/50 hover:text-accent transition-colors z-20"
              title="Close Remix"
            >
              <X size={16} />
            </button>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 blur-[40px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                {/* Controls */}
                <div className="flex flex-col gap-4 min-w-[140px]">
                    <div className="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">
                        Audio Experience
                    </div>
                    <button 
                        onClick={playAudio}
                        className={`w-14 h-14 flex items-center justify-center rounded-full border border-accent transition-all hover:scale-105 ${isPlaying ? 'bg-accent text-black' : 'text-accent hover:bg-accent/10'}`}
                    >
                        {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                    </button>
                    {isPlaying && (
                        <div className="flex items-center gap-1 h-4">
                            <div className="w-1 bg-accent h-full animate-[pulse_0.5s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-accent h-3/4 animate-[pulse_0.7s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-accent h-full animate-[pulse_0.4s_ease-in-out_infinite]"></div>
                            <div className="w-1 bg-accent h-1/2 animate-[pulse_0.6s_ease-in-out_infinite]"></div>
                        </div>
                    )}
                </div>

                {/* Text Content */}
                <div className="flex-1 border-l border-accent/20 pl-6">
                    <p className="font-mono text-xs leading-relaxed text-neutral-300">
                        "{audioData.text}"
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Content Rendering */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-12 relative">
        
        {/* Navigation Sidebar */}
        <div className="hidden md:block sticky top-32 h-fit w-64">
            <div className="border-l border-white/10 pl-6 space-y-4">
                <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Structure</p>
                <div className="h-px w-4 bg-accent mb-4"></div>
                
                <button 
                  onClick={() => scrollToId('critical-insights')}
                  className="block text-left font-serif italic text-white text-sm hover:text-accent hover:translate-x-1 transition-all font-medium"
                >
                  Critical Insights
                </button>

                <button 
                  onClick={() => scrollToId('executive-summary')}
                  className="block text-left font-serif italic text-neutral-400 text-sm hover:text-white hover:translate-x-1 transition-all"
                >
                  Executive Summary
                </button>
                
                <div>
                   <button 
                     onClick={() => scrollToId('chronological-analysis')}
                     className="block text-left font-serif italic text-neutral-400 text-sm hover:text-white hover:translate-x-1 transition-all mb-2"
                   >
                     Chronological
                   </button>
                   {/* Sub-navigation for segments */}
                   {parsedContent && parsedContent.timelineSegments.length > 0 && (
                     <div className="space-y-1 pl-3 border-l border-white/5 ml-1">
                        {parsedContent.timelineSegments.map((segment, idx) => (
                           <button 
                              key={idx}
                              onClick={() => handleSegmentClick(`segment-${idx}`)}
                              className="block w-full text-left font-mono text-[10px] text-neutral-500 hover:text-accent transition-colors truncate py-0.5"
                              title={`${segment.timestamp} - ${segment.title}`}
                           >
                              <span className="text-neutral-600 mr-2">{segment.timestamp}</span>
                              {segment.title}
                           </button>
                        ))}
                     </div>
                   )}
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-none">
            {parsedContent ? (
                <div className="space-y-24">
                    
                    {/* Critical Insights (New Hero Section) */}
                    <section id="critical-insights" className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-8">
                             <div className="p-1.5 border border-accent rounded-sm">
                                <Sparkles size={16} className="text-accent" />
                             </div>
                             <h2 className="font-serif text-3xl italic text-white">Critical Analysis & Takeaways</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {parsedContent.insights.map((insight, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative bg-[#080808] border border-white/10 p-6 hover:border-accent transition-colors duration-500"
                                >
                                    {/* Numbering */}
                                    <div className="absolute top-0 right-0 p-3 font-mono text-[10px] text-neutral-700 group-hover:text-accent transition-colors">
                                        0{idx + 1}
                                    </div>
                                    
                                    {/* Decor corners */}
                                    <div className="absolute top-0 left-0 w-1 h-1 bg-white/20 group-hover:bg-accent transition-colors"></div>
                                    <div className="absolute bottom-0 right-0 w-1 h-1 bg-white/20 group-hover:bg-accent transition-colors"></div>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            {/* Icon based on index for variety */}
                                            {idx % 2 === 0 ? <Lightbulb size={14} className="text-neutral-600 mt-1 group-hover:text-white transition-colors"/> : <Zap size={14} className="text-neutral-600 mt-1 group-hover:text-white transition-colors"/>}
                                            <h3 className="font-mono text-sm text-accent uppercase tracking-wider leading-relaxed">
                                                {insight.title}
                                            </h3>
                                        </div>
                                        <p className="font-serif text-neutral-400 font-light leading-relaxed text-sm group-hover:text-neutral-200 transition-colors">
                                            {insight.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Executive Summary */}
                    <section id="executive-summary" className="scroll-mt-32">
                        <h2 className="font-serif text-2xl mb-6 italic text-white border-b border-white/5 pb-2">Executive Summary</h2>
                        <div className="prose prose-invert prose-p:text-neutral-300 prose-p:font-light prose-p:leading-relaxed text-lg">
                            <ReactMarkdown>{parsedContent.executive}</ReactMarkdown>
                        </div>
                    </section>

                    {/* Timeline Analysis */}
                    <section id="chronological-analysis" className="scroll-mt-32">
                        <h2 className="font-serif text-2xl mb-12 italic text-white border-b border-white/5 pb-2">Detailed Chronological Analysis</h2>
                        <div className="space-y-0">
                           {parsedContent.timelineSegments.map((segment, idx) => (
                              <TimelineSegment 
                                key={idx} 
                                id={`segment-${idx}`} 
                                segment={segment} 
                                videoUrl={videoUrl} 
                                isHighlighted={highlightedId === `segment-${idx}`}
                              />
                           ))}
                        </div>
                    </section>
                </div>
            ) : (
                // Fallback to standard full markdown rendering if parsing fails
                <div className="prose prose-invert prose-headings:font-serif prose-headings:font-normal prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:italic prose-h3:font-mono prose-h3:text-sm prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-accent prose-p:text-neutral-300 prose-p:font-light prose-p:leading-relaxed prose-strong:text-white prose-strong:font-normal prose-ul:list-none prose-ul:pl-0 prose-li:mb-4 prose-li:border-l prose-li:border-white/10 prose-li:pl-6 prose-li:text-neutral-400">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SummaryResult;