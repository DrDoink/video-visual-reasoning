export interface VideoSummary {
  rawText: string;
  timestamp: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  COMPRESSING = 'COMPRESSING', // Converting/Downscaling large videos
  PROCESSING_VIDEO = 'PROCESSING_VIDEO', // Converting to base64
  ANALYZING = 'ANALYZING', // Sending to Gemini
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export interface VideoFile {
  file: File;
  previewUrl: string;
}