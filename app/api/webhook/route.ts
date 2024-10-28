import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const firestore = getFirestore();
    const { videoId, videoUrl } = await req.json();

    if (!videoId || !videoUrl) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Find the document with the matching videoId
    const videoDocRef = firestore.collection('videos').where('videoId', '==', videoId).limit(1);
    const videoDocSnapshot = await videoDocRef.get();

    if (!videoDocSnapshot.empty) {
      const doc = videoDocSnapshot.docs[0];
      await doc.ref.update({
        videoUrl,
        isSuccessful: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
