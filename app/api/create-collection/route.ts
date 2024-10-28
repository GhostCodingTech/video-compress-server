import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const libraryId = searchParams.get('libraryId');
  const uniqueId = searchParams.get('uniqueId');

  if (!libraryId || !uniqueId) {
    return NextResponse.json({ error: 'Missing libraryId or uniqueId parameter' }, { status: 400 });
  }

  try {
    // Make a POST request to Bunny CDN to create a new collection
    const response = await axios.post(
      `https://video.bunnycdn.com/library/${libraryId}/collections`,
      { name: uniqueId },
      {
        headers: {
          'Content-Type': 'application/json',
          AccessKey: process.env.BUNNY_API_KEY!, // Ensure this environment variable is set
        },
      }
    );

    const collectionId = response.data.guid;

    return NextResponse.json({ collectionId }, { status: 200 });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
