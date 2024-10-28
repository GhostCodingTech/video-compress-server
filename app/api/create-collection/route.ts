import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { libraryId, uniqueId } = req.query;

    if (!libraryId || !uniqueId) {
      return res.status(400).json({ error: 'Missing libraryId or uniqueId parameter' });
    }

    // Make a POST request to Bunny CDN to create a new collection
    const response = await axios.post(
      `https://video.bunnycdn.com/library/${libraryId}/collections`,
      { name: uniqueId },
      {
        headers: {
          'Content-Type': 'application/json',
          AccessKey: process.env.BUNNY_API_KEY!, // Replace with your Bunny CDN API Key from environment variables
        },
      }
    );

    const collectionId = response.data.guid;

    return res.status(200).json({ collectionId });
  } catch (error) {
    console.error('Error creating collection:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
