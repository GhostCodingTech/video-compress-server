import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const firestore = getFirestore();
    const { VideoGuid, Status } = await req.json();

    if (!VideoGuid || typeof Status !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (Status === 3 || Status === 5) {
      // Find the document with the matching VideoGuid
      const videosRef = firestore.collection('videos').where('videoguid', '==', VideoGuid).limit(1);
      const snapshot = await videosRef.get();

      if (snapshot.empty) {
        return NextResponse.json({ error: 'No matching document found' }, { status: 404 });
      }

      const doc = snapshot.docs[0];

      if (Status === 3) {
        // Update with video URL if Status is 3
        const videoUrl = `https://vz-461ca7ac-0e6.b-cdn.net/${VideoGuid}/playlist.m3u8`;
        await doc.ref.update({ isDraft: false, videoUrl });
      } else if (Status === 5) {
        // Mark as upload failed if Status is 5
        await doc.ref.update({ uploadFailed: true });
      }

      return NextResponse.json({ message: 'Update successful' });
    }

    // If no action is needed, return success
    return NextResponse.json({ message: 'No action taken' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}