import fs from 'fs';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export async function compressVideo(inputPath: string): Promise<string> {
  const outputPath = path.join('./temp', `compressed-${Date.now()}.mp4`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .size('1280x720')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}

export async function uploadToBunny(filePath: string, libraryId: string, collectionId: string): Promise<string> {
  const videoData = fs.readFileSync(filePath);

  const response = await axios.post(`https://video.bunnycdn.com/library/${libraryId}/videos`, videoData, {
    headers: {
      'Content-Type': 'video/mp4',
      'AccessKey': process.env.BUNNY_API_KEY!,
    },
    params: {
      collectionId,
    },
  });

  return response.data.videoId;
}
