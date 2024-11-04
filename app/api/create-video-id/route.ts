import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let libraryId, collectionId, videoName;

    const contentType = req.headers.get('content-type');
    console.log("Content-Type:", contentType);

    if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      libraryId = params.get('libraryId') || '';
      collectionId = params.get('collectionId') || '';
      videoName = params.get('videoName') || '';
    } else if (contentType === 'application/json') {
      const json = await req.json();
      libraryId = json.libraryId;
      collectionId = json.collectionId;
      videoName = json.videoName;
    } else {
      console.error("Unsupported Content-Type:", contentType);
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }

    if (!libraryId || !collectionId || !videoName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('AccessKey', process.env.BUNNY_API_KEY || '');

    const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}/videos`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ title: videoName }),
    });

    // Log the entire raw response for debugging
    console.log("Response Status:", response.status);
    console.log("Response Headers:", Array.from(response.headers.entries()));

    // Handle cases where the response might not be JSON
    let responseData;
    if (response.ok) {
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        return NextResponse.json({ error: 'Invalid JSON response from Bunny' }, { status: 500 });
      }
    } else {
      const errorText = await response.text();
      console.error("Error Response Text:", errorText);
      return NextResponse.json({ error: 'Failed to create video in Bunny', details: errorText }, { status: response.status });
    }

    const videoGuid = responseData.guid;
    return NextResponse.json({ videoGuid });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
