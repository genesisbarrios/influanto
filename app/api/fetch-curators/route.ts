import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// Regex patterns to match Instagram and TikTok links
const IG_REGEX = /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_]+/i;
const TIKTOK_REGEX = /https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_]+/i;

// Helper function to parse Instagram and TikTok links from descriptions
const parseSocialLinks = (description: string) => {
    let externalUrl = '';  // Default value if no social link is found

    // Remove any HTML anchor links and extract href values
    const linkMatch = description.match(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/);
    if (linkMatch) {
        externalUrl = linkMatch[1];  // Extract the URL from the anchor tag
    }

    // Instagram link parsing: "ig: username", "ig: @username", "instagram: username", or "instagram: @username"
    const igPattern = /\big(?:\s*[:\-]?\s*)@?([a-zA-Z0-9_]+)\b/i;
    const instagramMatch = description.match(igPattern);
    
    if (instagramMatch) {
      externalUrl = `https://instagram.com/${instagramMatch[1]}`;  // Format Instagram URL
    } else {
      // TikTok link parsing: "tiktok: username" or "tiktok: @username"
      const tiktokPattern = /\btiktok(?:\s*[:\-]?\s*)@?([a-zA-Z0-9_]+)\b/i;
      const tiktokMatch = description.match(tiktokPattern);
      
      if (tiktokMatch) {
        externalUrl = `https://www.tiktok.com/@${tiktokMatch[1]}`;  // Format TikTok URL
      }
    }
  
    // Remove all anchor tags from the description (with the extracted links)
    const cleanedDescription = description.replace(/<a[^>]*>[^<]*<\/a>/g, '');

    return { externalUrl, cleanedDescription };  // Return both cleaned description and external URL
  };

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;  // Access the query params from the request's URL
    const genre = searchParams.get('genre');  // Get the 'genre' query parameter

    // If no genre is provided, default to "reggaeton"
    const searchGenre = genre || 'reggaeton';
    
    // Spotify API URL with dynamic genre
    const SPOTIFY_API_URL = `https://api.spotify.com/v1/search?q=${searchGenre}&type=playlist&limit=50`;  // Set limit to 100
    const CLIENT_ID = process.env.identity;
    const CLIENT_SECRET = process.env.spotify_secret;

    try {
        // Get access token
        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({ grant_type: 'client_credentials' }),
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const AUTH_TOKEN = tokenResponse.data.access_token;

        // Fetch playlists
        const response = await axios.get(SPOTIFY_API_URL, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
            },
        });
        console.log(response.data);

        const playlists = response.data.playlists?.items
        ?.filter((playlist: any) => playlist !== null) // Remove null entries
        ?.filter((playlist: any) => playlist?.description != null) // Remove empty descriptions
        ?.filter((playlist: any) => playlist?.description.toLowerCase().includes('ig') || playlist?.description.toLowerCase().includes('instagram') || playlist?.description.toLowerCase().includes('tiktok')) 
        ?.filter((playlist: any) => playlist?.owner?.external_urls?.spotify) // Check if the owner has a Spotify profile
        ?.map((playlist: any) => {
            // Keep the original description unchanged, but parse social links
            const description = playlist?.description || '';
            const { externalUrl, cleanedDescription } = parseSocialLinks(description);

            // Get the playlist cover image if available
            const playlistCoverImage = playlist?.images?.[0]?.url || null; 

            return {
                name: playlist?.name || 'Unknown Playlist',
                id: playlist?.id || 'N/A',
                description: cleanedDescription || 'No description available',  // Use the cleaned description
                url: playlist?.external_urls?.spotify || '#',
                externalUrl: externalUrl || null, // Set the external URL separately
                owner: playlist?.owner?.display_name || 'Unknown Owner',
                ownerProfileUrl: playlist?.owner?.external_urls?.spotify || 'No profile available', // Display the Spotify profile URL
                playlistCoverImage: playlistCoverImage || null, // Return the playlist cover image if available
            };
        });

        console.log(playlists);

        return NextResponse.json({ playlists }, { status: 200 });
    } catch (error) {
        console.error('Error fetching Spotify playlists:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }
}
