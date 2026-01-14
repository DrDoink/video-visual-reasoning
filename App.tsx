import React, { useState, useRef } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import VideoPreview from './components/VideoPreview';
import SummaryResult from './components/SummaryResult';
import { VideoFile, ProcessingStatus } from './types';
import { summarizeVideo } from './services/gemini';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [video, setVideo] = useState<VideoFile | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (videoFile: VideoFile) => {
    setVideo(videoFile);
    setSummary(null);
    setError(null);
    setStatus(ProcessingStatus.IDLE);
  };

  const handleClearVideo = () => {
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
    }
    setVideo(null);
    setSummary(null);
    setError(null);
    setStatus(ProcessingStatus.IDLE);
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
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
      setStatus(ProcessingStatus.PROCESSING_VIDEO);
      setStatusMessage('ENCODING_MEDIA_STREAM...');
      setError(null);

      const base64Data = await convertFileToBase64(video.file);

      setStatus(ProcessingStatus.ANALYZING);
      
      const result = await summarizeVideo(
        base64Data, 
        video.file.type,
        (msg) => setStatusMessage(msg === 'Initializing Gemini model...' ? 'INITIALIZING_MODEL...' : 'ANALYZING_VISUAL_CONTEXT...')
      );

      setSummary(result);
      setStatus(ProcessingStatus.COMPLETE);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setStatus(ProcessingStatus.ERROR);
      setError(err.message || "FATAL_ERROR: ANALYSIS_INTERRUPTED");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col font-sans">
      <Header />

      <main className="flex-grow w-full max-w-[1400px] mx-auto px-6 sm:px-8 py-24 md:py-32 space-y-24">
        
        {/* Editorial Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start border-b border-white/10 pb-16">
            <div className="space-y-8">
                <div className="space-y-2">
                    <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-4">
                        Machine Perception
                    </p>
                    <h2 className="font-serif text-5xl md:text-7xl leading-[0.9] text-white">
                        From Static <br/>
                        <span className="italic text-neutral-500">to</span> Meaning.
                    </h2>
                </div>
                <div className="max-w-md space-y-6">
                    <p className="font-light text-neutral-400 text-lg leading-relaxed">
                        An <span className="text-white border-b border-accent/50 pb-0.5">automated curator</span> for your digital archives. 
                        We employ multimodal AI to deconstruct video streams into structured narratives, 
                        capturing the nuance of both audio and visual context.
                    </p>
                    
                    <div className="flex gap-4 font-mono text-[10px] uppercase text-neutral-600">
                        <span>[ AUDIO_TRANSCRIPTION ]</span>
                        <span>[ SCENE_RECOGNITION ]</span>
                        <span>[ SEMANTIC_MAPPING ]</span>
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
                        isLoading={status === ProcessingStatus.PROCESSING_VIDEO || status === ProcessingStatus.ANALYZING}
                     />
                     
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-6">
                        <div className="font-mono text-xs text-neutral-500 uppercase">
                           FILE: <span className="text-white">{video.file.name}</span>
                        </div>
                        
                        {status !== ProcessingStatus.COMPLETE && status !== ProcessingStatus.ANALYZING && status !== ProcessingStatus.PROCESSING_VIDEO && (
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
               {(status === ProcessingStatus.PROCESSING_VIDEO || status === ProcessingStatus.ANALYZING) && (
                  <div className="mt-8 border border-white/10 p-6 flex flex-col gap-4 bg-neutral-900/20">
                     <div className="flex justify-between items-center font-mono text-[10px] text-accent uppercase tracking-widest">
                        <span>Status</span>
                        <span className="animate-pulse">Active</span>
                     </div>
                     <p className="font-mono text-xs text-white">{statusMessage}</p>
                     <div className="w-full bg-neutral-800 h-px">
                        <div className="h-full bg-accent animate-progress origin-left"></div>
                     </div>
                  </div>
               )}

               {/* Error State */}
               {status === ProcessingStatus.ERROR && (
                  <div className="mt-8 p-4 border border-red-900/50 bg-red-900/10 text-red-500 font-mono text-xs">
                     <p className="uppercase tracking-widest mb-2">[ SYSTEM_FAILURE ]</p>
                     <p>{error}</p>
                     <button 
                        onClick={handleGenerateSummary}
                        className="mt-4 underline decoration-red-500 underline-offset-4 hover:text-white"
                     >
                        RETRY_OPERATION
                     </button>
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