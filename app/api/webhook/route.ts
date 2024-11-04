// Import Firebase Admin SDK
import admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Check if Firebase app is already initialized to prevent reinitialization error
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Get Firestore instance
const db = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    const { VideoGuid, Status } = await req.json();

    if (Status === 3 || Status === 5) {
      const videosRef = db.collection("videos");
      const snapshot = await videosRef.where("videoguid", "==", VideoGuid).get();

      if (snapshot.empty) {
        return NextResponse.json({ error: 'No matching document found' }, { status: 404 });
      }

      const doc = snapshot.docs[0];
      if (Status === 3) {
        await doc.ref.update({ isDraft: false });
      } else if (Status === 5) {
        await doc.ref.update({ uploadFailed: true });
      }

      return NextResponse.json({ message: 'Update successful' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'No action taken' }, { status: 200 });  // Changed 205 to 200
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
