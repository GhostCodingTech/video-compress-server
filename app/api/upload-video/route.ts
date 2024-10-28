import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import formidable from 'formidable';
import fs from 'fs';
import { compressVideo, uploadToBunny } from '@/utils/video';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser to handle file uploads with formidable
  },
};

// Function to create a compatible IncomingMessage-like stream from NextRequest
async function convertToIncomingMessage(req: NextRequest): Promise<IncomingMessage> {
  const body = await req.arrayBuffer();
  const stream = new Readable();
  stream._read = () => {}; // No-op
  stream.push(Buffer.from(body));
  stream.push(null);

  // Extend the stream with necessary properties to make it look like an IncomingMessage
  const incomingMessage = Object.assign(stream, {
    headers: Object.fromEntries(req.headers.entries()), // Convert Headers to a plain object
    method: req.method,
    url: req.url,
  });

  // Cast as unknown first, then cast to IncomingMessage
  return incomingMessage as unknown as IncomingMessage;
}

export async function POST(req: NextRequest) {
  try {
    const firestore = getFirestore();

    // Convert NextRequest to a compatible IncomingMessage
    const incomingMessage = await convertToIncomingMessage(req);

    // Create a new instance of IncomingForm and set properties
    const form = formidable({
      uploadDir: './temp', // Directory for temporary file storage
      keepExtensions: true, // Keep file extensions
      multiples: false, // Only accept a single file
    });

    // Parse the form data using the simulated IncomingMessage
    const parsedForm = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(incomingMessage, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const { fields, files } = parsedForm;

    // Ensure video file is provided and is of the correct type
    const videoFile = Array.isArray(files.videoFile) ? files.videoFile[0] : files.videoFile;
    if (!videoFile || !(videoFile as formidable.File).filepath) {
      return NextResponse.json({ error: 'Invalid video file' }, { status: 400 });
    }

    // Safely extract fields from the parsed form data
    const documentId = Array.isArray(fields.documentId) ? fields.documentId[0] : fields.documentId;
    const libraryId = Array.isArray(fields.libraryId) ? fields.libraryId[0] : fields.libraryId;
    const collectionId = Array.isArray(fields.collectionId) ? fields.collectionId[0] : fields.collectionId;

    if (!documentId || !libraryId || !collectionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Compress the video file
    const compressedVideoPath = await compressVideo((videoFile as formidable.File).filepath);

    // Upload to Bunny CDN
    const videoId = await uploadToBunny(compressedVideoPath, libraryId, collectionId);

    // Update the Firestore document with video ID
    await firestore.doc(`videos/${documentId}`).update({
      videoId,
      thumbnail: `https://vz-461ca7ac-0e6.b-cdn.net/${videoId}/thumbnail.jpg`,
      isSuccessful: false,
      videoUploaded: true,
    });

    // Clean up temp files
    fs.unlinkSync((videoFile as formidable.File).filepath);
    fs.unlinkSync(compressedVideoPath);

    return NextResponse.json({ success: true, videoId }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
