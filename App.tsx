import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import VideoPreview from './components/VideoPreview';
import SummaryResult from './components/SummaryResult';
import ExampleCarousel from './components/ExampleCarousel';
import { VideoFile, ProcessingStatus } from './types';
import { summarizeVideo } from './services/gemini';
import { compressVideo } from './services/compression';
import { Loader2, AlertTriangle, RefreshCcw, HardDrive } from 'lucide-react';

const App: React.FC = () => {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Simulate progress based on status, or use real progress for compression
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (status === ProcessingStatus.PROCESSING_VIDEO) {
      // Encoding phase: Fast ramp up to ~35%
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 35) return 35;
          return prev + 2;
        });
      }, 100);
    } else if (status === ProcessingStatus.ANALYZING) {
      // Analysis phase: Slow ramp from wherever it is to ~95%
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          // Decelerate as it gets closer to 95
          const increment = Math.max(0.1, (95 - prev) / 100);
          return prev + increment;
        });
      }, 100);
    } else if (status === ProcessingStatus.COMPLETE) {
      setProgress(100);
    }
    // Note: COMPRESSING status is handled by the callback in compressVideo

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const handleFileSelect = (videoFile: VideoFile) => {
    setVideo(videoFile);
    setSummary(null);
    setError(null);
    setStatus(ProcessingStatus.IDLE);
    setProgress(0);
  };

  const handleClearVideo = () => {
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
    }
    setVideo(null);
    setSummary(null);
    setError(null);
    setStatus(ProcessingStatus.IDLE);
    setProgress(0);
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateSummary = async () => {
    if (!video) return;

    try {
      setError(null);
      
      let processingFile = video.file;
      const sizeMB = processingFile.size / (1024 * 1024);
      
      // If file is > 19MB, compress it first
      // We use 19MB as the threshold to be safe for the 20MB limit
      if (sizeMB > 19) {
          setStatus(ProcessingStatus.COMPRESSING);
          setStatusMessage('OPTIMIZING_MEDIA_STREAM...');
          setProgress(0);
          
          try {
             const compressedBlob = await compressVideo(processingFile, (p) => {
                 setProgress(p);
                 setStatusMessage(`COMPRESSING_DATA... ${p}%`);
             });
             
             // Cast Blob to File-like object or just use blob for base64 conversion
             // We don't need a full File object for base64 conversion
             processingFile = new File([compressedBlob], "compressed.mp4", { type: 'video/mp4' });
          } catch (compError: any) {
             console.error("Compression failed", compError);
             throw new Error("Video compression failed. Please try a smaller file.");
          }
      }

      setStatus(ProcessingStatus.PROCESSING_VIDEO);
      setProgress(0); // Reset for encoding phase visual
      setStatusMessage('ENCODING_MEDIA_STREAM...');

      const base64Data = await convertBlobToBase64(processingFile);

      setStatus(ProcessingStatus.ANALYZING);
      
      const result = await summarizeVideo(
        base64Data, 
        processingFile.type,
        (msg) => setStatusMessage(msg === 'Initializing Gemini model...' ? 'INITIALIZING_MODEL...' : 'ANALYZING_VISUAL_CONTEXT...')
      );

      setSummary(result);
      setStatus(ProcessingStatus.COMPLETE);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);

    } catch (err: any) {
      console.error(err);
      setStatus(ProcessingStatus.ERROR);
      setError(err.message || "FATAL_ERROR: ANALYSIS_INTERRUPTED");
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col font-sans">
      <Header />

      <main className="flex-grow w-full max-w-[1400px] mx-auto px-6 sm:px-8 py-24 md:py-32 space-y-24">
        
        {/* Editorial Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start border-b border-white/10 pb-16">
            <div className="space-y-12">
                <div className="space-y-2">
                    <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-4">
                        Computational Semiotics
                    </p>
                    <h2 className="font-serif text-5xl md:text-7xl leading-[0.9] text-white">
                        Deconstructing <br/>
                        <span className="italic text-neutral-500">your</span> Spectacle.
                    </h2>
                </div>
                
                {/* Description & Output Example Side-by-Side */}
                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    <div className="max-w-md space-y-6">
                        <p className="font-light text-neutral-400 text-lg leading-relaxed">
                            A <span className="text-white border-b border-accent/50 pb-0.5">hermeneutic engine</span> for the post-digital archive. 
                            Employs multimodal AI to parse video streams into semantic narratives, 
                            decoding the syntax of both audio and visual context.
                        </p>
                        
                        <div className="flex gap-4 font-mono text-[10px] uppercase text-neutral-600">
                            <span>[ AURAL_SIGNIFIERS ]</span>
                            <span>[ VISUAL_SYNTAX ]</span>
                            <span>[ NARRATIVE_STRUCTURE ]</span>
                        </div>
                    </div>

                    {/* Compact Carousel */}
                    <div className="w-full max-w-[260px] shrink-0">
                         <p className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-accent/50 rounded-full"></span>
                             Output_Samples
                         </p>
                         <ExampleCarousel />
                    </div>
                </div>
            </div>

            <div className="w-full lg:pt-12">
               {!video ? (
                  <FileUploader onFileSelect={handleFileSelect} isLoading={false} />
               ) : (
                  <div className="space-y-6 animate-in fade-in duration-500">
                     <VideoPreview 
                        previewUrl={video.previewUrl} 
                        onClear={handleClearVideo}
                        isLoading={status === ProcessingStatus.PROCESSING_VIDEO || status === ProcessingStatus.ANALYZING || status === ProcessingStatus.COMPRESSING}
                     />
                     
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
                        <div className="font-mono text-xs text-neutral-500 uppercase">
                           FILE: <span className="text-white">{video.file.name}</span>
                        </div>
                        
                        {status !== ProcessingStatus.COMPLETE && status !== ProcessingStatus.ANALYZING && status !== ProcessingStatus.PROCESSING_VIDEO && status !== ProcessingStatus.COMPRESSING && (
                           <button
                              onClick={handleGenerateSummary}
                              className="w-full sm:w-auto px-8 py-3 bg-white text-black font-mono text-xs tracking-widest uppercase hover:bg-accent transition-colors duration-300"
                           >
                              Initialize_Analysis
                           </button>
                        )}
                     </div>
                  </div>
               )}

               {/* Processing Indicator */}
               {(status === ProcessingStatus.PROCESSING_VIDEO || status === ProcessingStatus.ANALYZING || status === ProcessingStatus.COMPRESSING) && (
                  <div className="mt-8 border border-white/10 p-6 flex flex-col gap-4 bg-neutral-900/20 animate-in fade-in duration-500">
                     <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                           <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Processing Status</span>
                           <span className="font-mono text-xs text-accent uppercase tracking-widest animate-pulse">{statusMessage}</span>
                        </div>
                        <span className="font-mono text-2xl text-white font-light tracking-tighter">
                           {Math.round(progress)}<span className="text-sm text-neutral-500 ml-1">%</span>
                        </span>
                     </div>
                     
                     <div className="w-full bg-neutral-800 h-1 overflow-hidden relative">
                        <div 
                           className="h-full bg-accent transition-all duration-300 ease-out relative"
                           style={{ width: `${progress}%` }}
                        >
                           {/* Glow tip */}
                           <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-accent blur-[6px] opacity-50"></div>
                           <div className="absolute right-0 top-0 bottom-0 w-px bg-white"></div>
                        </div>
                     </div>

                     <div className="flex justify-between text-neutral-700 font-mono text-[8px] uppercase tracking-wider">
                        {status === ProcessingStatus.COMPRESSING ? (
                            <>
                                <span>[ DOWNSCALING_VIDEO ]</span>
                                <span>[ OPTIMIZING_BITRATE ]</span>
                            </>
                        ) : (
                            <>
                                <span>[ SYNCING_BUFFER ]</span>
                                <span>[ ESTIMATING_LATENCY ]</span>
                            </>
                        )}
                     </div>
                  </div>
               )}

               {/* Error State */}
               {status === ProcessingStatus.ERROR && (
                  <div className="mt-8 border-l-2 border-accent bg-neutral-900/30 p-6 animate-in fade-in duration-500">
                     <div className="flex items-start gap-4">
                        <div className="p-2 bg-accent/10 rounded-full shrink-0">
                           <AlertTriangle className="text-accent" size={20} />
                        </div>
                        <div className="space-y-4 w-full">
                           <div className="space-y-1">
                              <h3 className="font-mono text-xs text-accent uppercase tracking-widest">
                                 Analysis Interrupted
                              </h3>
                              <p className="font-sans text-sm text-neutral-300 font-light leading-relaxed">
                                 We encountered an issue processing your video stream. This is often caused by network interruptions or unsupported codecs.
                              </p>
                              {error && (
                                 <p className="font-mono text-[10px] text-neutral-500 mt-2 border-l border-white/10 pl-2">
                                    ERR_LOG: {error}
                                 </p>
                              )}
                           </div>
                           
                           <button 
                              onClick={handleGenerateSummary}
                              className="group flex items-center gap-3 text-white transition-colors"
                           >
                              <div className="flex items-center justify-center w-8 h-8 border border-neutral-700 group-hover:border-accent group-hover:bg-accent transition-all duration-300">
                                 <RefreshCcw size={12} className="text-neutral-500 group-hover:text-black transition-colors" />
                              </div>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 group-hover:text-accent transition-colors">
                                 Retry_Operation
                              </span>
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
        </section>

        {/* Results Section */}
        {summary && (
          <section ref={resultsRef} className="pb-24">
            <SummaryResult summary={summary} />
          </section>
        )}
      </main>
      
      <footer className="py-8 px-8 border-t border-white/10">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
            <p className="font-mono text-[10px] text-neutral-600 uppercase">
                &copy; 2025 Video to Visual Reasoning. Systems Online.
            </p>
            <div className="font-mono text-[10px] text-neutral-600 uppercase flex gap-4">
                <span>Privacy</span>
                <span>Terms</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;