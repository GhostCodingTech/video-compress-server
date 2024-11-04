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
    const requestBody = await req.json();
    console.log("Data received from Bunny:", requestBody); // Log the data received from Bunny

    const { VideoGuid, Status } = requestBody;

    if (Status === 3 || Status === 5) {
      const videosRef = db.collection("videos");
      const snapshot = await videosRef.where("videoguid", "==", VideoGuid).get();

      if (snapshot.empty) {
        console.log("No matching document found for VideoGuid:", VideoGuid); // Log if no document is found
        return NextResponse.json({ error: 'No matching document found' }, { status: 404 });
      }

      const doc = snapshot.docs[0];
      if (Status === 3) {
        console.log("Updating document for VideoGuid:", VideoGuid, "Setting isDraft to false"); // Log the update operation
        await doc.ref.update({ isDraft: false });
      } else if (Status === 5) {
        console.log("Updating document for VideoGuid:", VideoGuid, "Setting uploadFailed to true"); // Log the update operation
        await doc.ref.update({ uploadFailed: true });
      }

      console.log("Update successful for VideoGuid:", VideoGuid); // Confirm successful update
      return NextResponse.json({ message: 'Update successful' }, { status: 200 });
    } else {
      console.log("No action taken for Status:", Status, "with VideoGuid:", VideoGuid); // Log no action taken
      return NextResponse.json({ message: 'No action taken' }, { status: 200 });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
