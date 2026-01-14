import React, { useCallback, useState } from 'react';
import { VideoFile } from '../types';
import { Plus, AlertCircle, ArrowUpRight, FileVideo } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (videoFile: VideoFile) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE_MB = 19;

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndProcessFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('video/')) {
      setError('Invalid Format. Required: MP4, WebM, MOV.');
      return;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(`Size Exceeded. Max: ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onFileSelect({ file, previewUrl });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  }, [isLoading]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full group">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full aspect-[16/8] md:aspect-[16/5] 
          bg-neutral-900/10 hover:bg-neutral-900/30
          border border-neutral-800 hover:border-accent
          transition-colors duration-300 ease-out
          cursor-pointer overflow-hidden
          ${isLoading ? 'opacity-30 pointer-events-none grayscale' : ''}
        `}
      >
        <input
          type="file"
          accept="video/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileInput}
          disabled={isLoading}
        />

        {/* Asymmetrical Grid Lines */}
        {/* Vertical line at 30% */}
        <div className="absolute top-0 bottom-0 left-[30%] w-px bg-neutral-800 group-hover:bg-accent/30 transition-colors" />
        {/* Horizontal line at 65% */}
        <div className="absolute top-[65%] left-0 right-0 h-px bg-neutral-800 group-hover:bg-accent/30 transition-colors" />
        
        {/* Zone 1: Top Left (Icon & Label) */}
        <div className="absolute top-0 left-0 w-[30%] h-[65%] p-6 flex flex-col justify-between">
            <div className={`w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center text-neutral-500 group-hover:border-accent group-hover:text-accent transition-all duration-300 ${isDragging ? 'bg-accent text-black border-accent' : ''}`}>
               <Plus size={16} />
            </div>
            <div className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest group-hover:text-accent transition-colors">
                Input_Stream
            </div>
        </div>

        {/* Zone 2: Top Right (Main Heading) */}
        <div className="absolute top-0 right-0 left-[30%] h-[65%] p-6 md:p-10 flex flex-col justify-end items-start">
             <h3 className="font-sans text-4xl md:text-5xl font-medium text-white tracking-tight leading-[0.9]">
                Upload Source <br/>
                <span className="text-neutral-600 group-hover:text-white transition-colors">Material</span>
            </h3>
        </div>

        {/* Zone 3: Bottom Left (Format Info) */}
        <div className="absolute bottom-0 left-0 w-[30%] h-[35%] p-6 flex flex-col justify-end">
             <div className="flex items-center gap-2 text-neutral-500 group-hover:text-neutral-300 transition-colors">
                <FileVideo size={14} />
                <span className="font-sans text-xs font-medium">MP4 / MOV</span>
             </div>
        </div>

        {/* Zone 4: Bottom Right (Size & Arrow) */}
        <div className="absolute bottom-0 right-0 left-[30%] h-[35%] p-6 md:p-8 flex items-end justify-between">
             <p className="font-sans text-xs text-neutral-500">
                Max File Size: {MAX_FILE_SIZE_MB}MB
             </p>
             <ArrowUpRight className="text-neutral-700 group-hover:text-accent transition-colors transform group-hover:translate-x-1 group-hover:-translate-y-1 duration-300" size={24} />
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-3 text-red-500 font-mono text-xs border-l-2 border-red-500 pl-4 py-1 animate-in slide-in-from-left-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;