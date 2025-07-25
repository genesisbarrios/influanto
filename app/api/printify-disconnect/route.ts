// pages/api/printify/disconnect.ts
import { NextApiRequest, NextApiResponse } from 'next';
import User from '@/models/User'; // Adjust the import based on your project structure

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  try {
    // Remove Printify connection from user
    await User.findByIdAndUpdate(userId, {
      $unset: { printifyShopId: 1, printifyConnected: 1 }
    });

    console.log(`User ${userId} disconnected from Printify`);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
}