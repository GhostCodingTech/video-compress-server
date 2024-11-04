import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { libraryId, collectionId, videoName } = await req.json();

    if (!libraryId || !collectionId || !videoName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Set up headers using Headers instance
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('AccessKey', process.env.BUNNY_API_KEY || '');

    // Prepare the request to Bunny's API with the correct URL format
    const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}/videos`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        title: videoName,  // Name of the video
      }),
    });

    // Handle the Bunny API response
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to create video in Bunny', details: errorData }, { status: response.status });
    }

    const responseData = await response.json();
    const videoGuid = responseData.guid;  // Extract the generated video GUID

    return NextResponse.json({ videoGuid });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
