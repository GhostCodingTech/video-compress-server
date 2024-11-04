import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const libraryId = searchParams.get('libraryId');
  const collectionId = searchParams.get('collectionId');
  const uniqueId = searchParams.get('uniqueId');

  if (!libraryId || !uniqueId) {
    return NextResponse.json({ error: 'Missing libraryId or uniqueId parameter' }, { status: 400 });
  }

  try {
    // Make a POST request to Bunny CDN to create a new video in the collection
    const response = await axios.post(
      `https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}/videos`,
      { title: uniqueId },  // Use uniqueId as the video title
      {
        headers: {
          'Content-Type': 'application/json',
          AccessKey: process.env.BUNNY_API_KEY, // Ensure this environment variable is set
        },
      }
    );

    const videoguid = response.data.guid;

    return NextResponse.json({ videoguid }, { status: 200 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
