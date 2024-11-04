// Import Firebase Admin SDK
import admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Check if Firebase app is already initialized to prevent reinitialization error
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "video-upload-server",
      clientEmail: "firebase-adminsdk-tz5eu@video-upload-server.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDgp16+4UDY013o\nMAfvWwEtS4tDd3e7nruPAxR3KxgPcsyQDZs8E6FQSrKCYSj1m0u5uUrnQU0gkgnk\nt+NUHESBdZvd4+IXQSs8ak8jji5iI7dW+vnTJwoqhoRj+b96PNu8BC87vJeoTpU9\nBKW/3LICxz1i4vm5zPGIbtHhIhpXpdOjMfTIPa1PxWe7wpgpnQjNOYAOF3dlRNYR\n+ocTqKiMkOegpQdpRxXimC2KytCV0TEQ9kgzrcDbrDozKqpXvpu6HUiQyOQlc+eY\n16BvraKDvGkUT/7Vdbn/PjYrA64wzj8JmRKSdnG9CvhtQ58tmj97U6tMNbzSq39e\n+M70KoupAgMBAAECggEAFlKLJ4xaVTErc5bSMwZn54hKHjoQu6PaHyu/LNgrW92c\nVfQEKMQKk1/YvPvKhh0YOSwgNTpX35SjRwa+n+zvIa39/t5V6Nmg4i/uDSpjkXzb\nCtmFWWXXrMIRBZ4bWJoTe2svBlCHAUJNsfJ0Rcw4I+6IOvsytTOYDGZ2lFg/JdY0\ntn/VDhr4GtECTvC3si3CUKuzTEsucKTUh7l1LDfj3F3ADf08+iNzTc8QPcleRplF\nDV/8eajg8HcPOiOQjUj2To9cdHn7p0bzEyI5aq7qjtuxTipyjB8/6MBJ+MbpSjfx\nlcTwMQvmKkjQE7CHo9ls8vRNWlspkagwPephpqwoAQKBgQD0b0U2zvJbv9geUOEp\nSkHnB8g76I+qovlV69sJuC+Wf1b2gRA1qcjHCqBX2WSr9h/k0DjfeV7+vte3oPAP\n+EDcmW0ie99owP47vlMfu1sdHLkPz1nfB8hQBLTR5FB/4Ql3lXaktbR+tdXiFCKX\n0CZt+65cY0i/uWMnBVGRImhMGQKBgQDrSIC66PB/4VZxC8ikORZlIpyCu0pdl2UV\n/A9CAkV9cSw+qC3cx6dLBSmaD//Fpa+U9G8G2s4G7zprQFmh4zSkag6xkTMRrA//\nHPuEmZO69EprH2OKeVJdtpkCbQikhI44wyGQ2cQuihP47EoYzgANZS3Jnb2o8FQ4\nqR4jXDkuEQKBgE4XxpsuHswlTJzS5jzU1p1DJTvOnye7DcHfqok+aSXB5Ty4Gz+p\n0NWWlYe7kqhF6AaoZ6MuGaV1v2GRb2EKxV41PmLIBKZpElBwDAqVRxTT+mQMsP/K\ncrrt5f8w3G8erHGiNNeGnfXljkG+gRbTj5OP1zL5HWLzjbQHxPmDbqLxAoGAJfU7\nd2wPKMJk3LYG95+SIlzUHS80DydWkpZoq8CMD3HLrowZYg3/ylWZ4ZYFMJDLY9+P\nbe6s4GeF6DmofDqYipHlrvX65DX7GrBFT54rPDUfMGsO9w8dn6rOwppuk4QjIbsx\nVhob0VpLYJRWW+wYDBEvsuA08eVb4Qw/pXrCatECgYBmvLlDwR6X6bkz2FgdT0Ej\ndxBw7vS7ufrXRFsr7boEea7KjcPGAaOGd/Rai0XTYAVOQBe9+neM9AgnStU9moPK\nwc4gE8zMxtwdB6YQmJM4HQGtIxET1s+DMDprMG2vAcrrfsrQHAcJgyD8BQi9Koxg\n+aHIACUKwZIePNZfXGhrpw==\n-----END PRIVATE KEY-----\n",
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
