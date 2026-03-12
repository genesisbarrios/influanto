import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to parse Instagram and TikTok links from descriptions
const parseSocialLinks = (description: string) => {
    let externalUrl = '';  // Default value if no social link is found

    // Remove any HTML anchor links and extract href values
    const linkMatch = description.match(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/);
    if (linkMatch) {
        externalUrl = linkMatch[1];  // Extract the URL from the anchor tag
    }

    // Instagram link parsing: "@username on instagram" or "@username on IG"
    const igPattern = /\b@([a-zA-Z0-9_.]+)\s+on\s+(instagram|IG|ig|insta)\b/i;
    const instagramMatch = description.match(igPattern);
    
    if (instagramMatch) {
      externalUrl = `https://instagram.com/${instagramMatch[1]}`;  // Format Instagram URL
    } else {
      // Instagram link parsing: "ig: username", "ig: @username", "instagram: username", "instagram: @username", "instagram @username", "IG: @username"
      const igPatternAlt = /\b(?:ig|instagram|IG|insta)\s*[:@]?\s*@?([a-zA-Z0-9_.]+)\b/i;
      const instagramMatchAlt = description.match(igPatternAlt);
      
      if (instagramMatchAlt) {
        externalUrl = `https://instagram.com/${instagramMatchAlt[1]}`;  // Format Instagram URL
      } else {
        // TikTok link parsing: "tiktok: username", "tiktok: @username", "tiktok username", "tiktok : @username"
        const tiktokPattern = /\btiktok\s*[:@]?\s*@?([a-zA-Z0-9_.]+)\b/i;
        const tiktokMatch = description.match(tiktokPattern);
        
        // Ignore generic TikTok descriptions
        const genericTiktokPhrases = [
          'Popular Tiktok Songs', 'tiktok songs', 'tik tok songs', 'viral hits', 'Mix Tiktok 2025',
          'tiktok music', 'tik tok music', 'Best Viral Hits From TikTok', 
          'Tik Tok Trending Now', 'Popular', 'Top Hits', 'Trending', 'TikTok Viral', 'LATINO 2025 TIK TOK'
        ];
        const isGenericTiktokDescription = genericTiktokPhrases.some(phrase => 
          description.toLowerCase().includes(phrase.toLowerCase())
        );

        if (tiktokMatch && !isGenericTiktokDescription) {
          externalUrl = `https://www.tiktok.com/@${tiktokMatch[1]}`;  // Format TikTok URL
        }
      }
    }
  
    // Remove all anchor tags and any links (e.g., "https://", "http://", "bit.ly", "https:&") from the description
    const cleanedDescription = description
        .replace(/<a[^>]*>[^<]*<\/a>/g, '')  // Remove anchor tags
        .replace(/https?:\/\/[^\s]+/g, '')   // Remove URLs starting with http or https
        .replace(/https:.*/g, '');           // Remove anything after "https:"

    const emailMatch = description.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : null;  // Extract the first match or set to null
    
    return { externalUrl, cleanedDescription , email};  // Return both cleaned description and external URL
  };

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;  // Access the query params from the request's URL
    const genre = searchParams.get('genre');  // Get the 'genre' query parameter

    // If no genre is provided, default to "reggaeton"
    const searchGenre = genre || 'reggaeton';
    
    // Spotify API URL with dynamic genre
    const SPOTIFY_API_URL = `https://api.spotify.com/v1/search?q=${searchGenre}&type=playlist&limit=50`;  // Set limit to 50
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

        let playlists: any[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore && playlists.length < 20) {  // Fetch until we have at least 20 playlists or no more results
            const response = await axios.get(`${SPOTIFY_API_URL}&offset=${offset}`, {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                },
            });

            const newPlaylists = response.data.playlists?.items
            ?.filter((playlist: any) => playlist !== null) // Remove null entries
            ?.filter((playlist: any) => playlist?.description != null) // Remove empty descriptions
            ?.filter((playlist: any) => playlist?.description.toLowerCase().includes('ig') || playlist?.description.toLowerCase().includes('instagram') || playlist?.description.toLowerCase().includes('tiktok')  || playlist?.description.toLowerCase().includes('contact')  || playlist?.description.toLowerCase().includes('email')  || playlist?.description.toLowerCase().includes('e-mail')) 
            ?.filter((playlist: any) => playlist?.owner?.external_urls?.spotify) // Check if the owner has a Spotify profile
            ?.map((playlist: any) => {
                // Keep the original description unchanged, but parse social links
                const description = playlist?.description || '';
                const { externalUrl, cleanedDescription, email } = parseSocialLinks(description);

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
                    email: email || null
                };
            })
            // IMPORTANT: Filter out curators with no contact links BEFORE returning
            ?.filter((playlist: any) => playlist.externalUrl || playlist.email);

            playlists = playlists.concat(newPlaylists);
            offset += 50;
            hasMore = newPlaylists.length > 0;
        }

        console.log('Filtered playlists with contact info:', playlists.length);

        return NextResponse.json({ playlists }, { status: 200 });
    } catch (error) {
        console.error('Error fetching Spotify playlists:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }
}