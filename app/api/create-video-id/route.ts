import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const libraryId = searchParams.get('libraryId');
    const collectionId = searchParams.get('collectionId');
    const videoName = searchParams.get('videoName');

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

    // Handle response status and parse JSON only if available
    if (!response.ok) {
      let errorData = { message: 'Unknown error' };
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
      }
      return NextResponse.json({ error: 'Failed to create video in Bunny', details: errorData }, { status: response.status });
    }

    // Attempt to parse JSON if response body exists
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return NextResponse.json({ error: 'Invalid JSON response from Bunny' }, { status: 500 });
    }

    const videoGuid = responseData.guid;  // Extract the generated video GUID

    return NextResponse.json({ videoGuid });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
