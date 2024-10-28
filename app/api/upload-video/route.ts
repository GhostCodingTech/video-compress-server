
import { getFirestore } from 'firebase-admin/firestore';
import formidable from 'formidable';
import fs from 'fs';
import { compressVideo, uploadToBunny } from '@/utils/video';
import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
      bodyParser: false, // Disable Next.js body parser to handle file uploads with formidable
    },
  };
  
  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const firestore = getFirestore();
  
      // Create a new instance of IncomingForm and set properties
      const form = formidable({
        uploadDir: './temp', // Directory for temporary file storage
        keepExtensions: true, // Keep file extensions
        multiples: false, // Only accept a single file
      });
  
      // Parse the form data
      const parsedForm = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });
  
      const { fields, files } = parsedForm;
  
      // Ensure video file is provided and is of the correct type
      const videoFile = Array.isArray(files.videoFile) ? files.videoFile[0] : files.videoFile;
      if (!videoFile || !(videoFile as formidable.File).filepath) {
        return res.status(400).json({ error: 'Invalid video file' });
      }
  
      // Safely extract fields from the parsed form data
      const documentId = Array.isArray(fields.documentId) ? fields.documentId[0] : fields.documentId;
      const libraryId = Array.isArray(fields.libraryId) ? fields.libraryId[0] : fields.libraryId;
      const collectionId = Array.isArray(fields.collectionId) ? fields.collectionId[0] : fields.collectionId;
  
      if (!documentId || !libraryId || !collectionId) {
        return res.status(400).json({ error: 'Missing parameters' });
      }
  
      // Compress the video file
      const compressedVideoPath = await compressVideo((videoFile as formidable.File).filepath);
  
      // Upload to Bunny CDN
      const videoId = await uploadToBunny(compressedVideoPath, libraryId, collectionId);
  
      // Update the Firestore document with video ID
      await firestore.doc(`videos/${documentId}`).update({
        videoId,
        isSuccessful: false,
      });
  
      // Clean up temp files
      fs.unlinkSync((videoFile as formidable.File).filepath);
      fs.unlinkSync(compressedVideoPath);
  
      return res.status(200).json({ success: true, videoId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }