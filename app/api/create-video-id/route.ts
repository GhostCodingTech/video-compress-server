import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let libraryId, collectionId, videoName;

    // Check if the content type is x-www-form-urlencoded
    if (req.headers.get('content-type') === 'application/x-www-form-urlencoded') {
      // Parse x-www-form-urlencoded data
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      libraryId = params.get('libraryId') || '';
      collectionId = params.get('collectionId') || '';
      videoName = params.get('videoName') || '';
    } else {
      // Parse JSON data (as fallback)
      const json = await req.json();
      libraryId = json.libraryId;
      collectionId = json.collectionId;
      videoName = json.videoName;
    }

    // Validate parameters
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
      body: JSON.stringify({ title: videoName }),
    });

    // Log response status and headers for debugging
    console.log("Response Status:", response.status);
    console.log("Response Headers:", Array.from(response.headers.entries()));

    if (!response.ok) {
      let errorData = { message: 'Unknown error' };
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
      }
      return NextResponse.json({ error: 'Failed to create video in Bunny', details: errorData }, { status: response.status });
    }

    // Attempt to parse JSON response
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return NextResponse.json({ error: 'Invalid JSON response from Bunny' }, { status: 500 });
    }

    const videoGuid = responseData.guid;
    return NextResponse.json({ videoGuid });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
