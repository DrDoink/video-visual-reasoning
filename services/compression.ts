import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Compresses a video file using FFmpeg.wasm.
 * optimized for AI analysis: 480p, 20fps, highly compressed audio.
 */
export const compressVideo = async (
  file: File, 
  onProgress: (progress: number) => void
): Promise<Blob> => {
    const ffmpeg = new FFmpeg();
    
    // Load ffmpeg (using single-threaded core for broader browser compatibility without requiring COOP/COEP headers)
    // We point to unpkg to get the specific version assets
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    
    try {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    } catch (e) {
        console.error("Failed to load FFmpeg", e);
        throw new Error("Compression engine failed to initialize.");
    }

    ffmpeg.on('progress', ({ progress, time }) => {
        // progress is 0-1
        // We map this to 0-100
        if (progress > 0) {
           onProgress(Math.min(100, Math.round(progress * 100)));
        }
    });

    // Write the file to memory
    await ffmpeg.writeFile('input_video', await fetchFile(file));

    // Run compression command
    // -vf scale=-2:480 : Scale height to 480px, keep aspect ratio
    // -r 20 : Reduce framerate to 20fps (sufficient for context)
    // -crf 32 : Constant Rate Factor (higher = lower quality/smaller size)
    // -preset ultrafast : Prioritize speed over compression ratio
    // -b:a 64k : Reduce audio bitrate
    await ffmpeg.exec([
        '-i', 'input_video',
        '-vf', 'scale=-2:480',
        '-r', '20',
        '-c:v', 'libx264',
        '-crf', '32',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '64k',
        'output.mp4'
    ]);

    // Read the result
    const data = await ffmpeg.readFile('output.mp4');
    
    // Cleanup to free memory
    // await ffmpeg.terminate(); // terminate causing issues in some single thread envs if reused, but here we likely reconstruct.

    return new Blob([data], { type: 'video/mp4' });
};