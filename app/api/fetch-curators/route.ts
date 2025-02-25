import axios from 'axios';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import querystring from 'querystring';  // Import querystring to handle URL query parameters

export async function GET(req: NextRequest) {
    // const { code, state } = req.query;  // Extract code and state from the query string

    // if (!state) {
    //     return NextResponse.redirect(`/error?message=${querystring.stringify({ error: 'state_mismatch' })}`);
    // }

    // const CLIENT_ID = process.env.identity;
    // const CLIENT_SECRET = process.env.spotify_secret;
    // const REDIRECT_URI = 'https://influanto.com/';  // Replace with your actual redirect URI

    // try {
    //     // Step 1: Exchange the authorization code for an access token
    //     const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        
    //     const tokenResponse = await axios.post(
    //         'https://accounts.spotify.com/api/token',
    //         querystring.stringify({
    //             code: code, 
    //             redirect_uri: REDIRECT_URI,
    //             grant_type: 'authorization_code'
    //         }),
    //         {
    //             headers: {
    //                 'Authorization': `Basic ${credentials}`,
    //                 'Content-Type': 'application/x-www-form-urlencoded',
    //             },
    //         }
    //     );

    //     const accessToken = tokenResponse.data.access_token;

    //     // Step 2: Use the access token to fetch top playlists
    //     const SPOTIFY_API_URL = 'https://api.spotify.com/v1/me/top/playlists';
    //     const response = await axios.get(SPOTIFY_API_URL, {
    //         headers: {
    //             Authorization: `Bearer ${accessToken}`,
    //         },
    //     });

    //     // Step 3: Process and return the playlists
    //     const playlists = response.data.items.map((playlist: any) => ({
    //         name: playlist.name,
    //         id: playlist.id,
    //         tracks: playlist.tracks.total,
    //         url: playlist.external_urls.spotify,
    //     }));

    //     return NextResponse.json({ playlists }, { status: 200 });
    // } catch (error) {
    //     console.error('Error fetching Spotify playlists:', error);
    //     return error;
    // }
}
