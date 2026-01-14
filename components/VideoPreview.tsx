import React from 'react';
import { X, Play } from 'lucide-react';

interface VideoPreviewProps {
  previewUrl: string;
  onClear: () => void;
  isLoading: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ previewUrl, onClear, isLoading }) => {
  return (
    <div className="relative w-full bg-neutral-900 border border-neutral-800 group">
      {/* Frame UI Elements */}
      <div className="absolute top-2 left-2 z-20 font-mono text-[10px] text-white/50 bg-black/50 px-1">SRC_PREVIEW</div>
      
      <video
        src={previewUrl}
        controls
        className={`w-full h-full object-contain max-h-[60vh] ${isLoading ? 'opacity-40 grayscale' : ''}`}
      />
      
      {!isLoading && (
        <button
          onClick={onClear}
          className="absolute top-0 right-0 p-3 text-white/70 hover:text-accent hover:bg-black/50 transition-all z-20"
          title="Remove video"
        >
          <X size={20} />
        </button>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center justify-center gap-4">
             <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border border-t-transparent border-accent/50 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border border-b-transparent border-white/30 rounded-full animate-spin direction-reverse"></div>
             </div>
             <p className="font-mono text-xs tracking-widest text-accent animate-pulse">PROCESSING_DATA_STREAM</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;