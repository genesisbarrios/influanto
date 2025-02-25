import axios from 'axios';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';




export async function GET(req: NextRequest) {
    
    // Spotify API endpoint to get playlists
    const SPOTIFY_API_URL = 'https://api.spotify.com/v1/me/top/playlists';
    const REDIRECT_URI = 'influanto.com'; // Define this in Spotify Developer Dashboard
    const SCOPE = 'user-top-read';
    // Get your Spotify Client ID and Client Secret from environment variables
    const CLIENT_ID = process.env.identity;  // Set in .env file
    const CLIENT_SECRET = process.env.spotify_secret;  // Set in .env file
    

    try {
        // First, get the access token from Spotify
        const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

        const tokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',  // Add the body parameter explicitly
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                // params is replaced by the request body
            }
        );

        const AUTH_TOKEN = tokenResponse.data.access_token;  // Get the access token from the response

        // Make the request to the Spotify API to get playlists
        const response = await axios.get(SPOTIFY_API_URL, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
            },
        });

        // If the request is successful, process the playlists
        const playlists = response.data.items.map((playlist: any) => ({
            name: playlist.name,
            id: playlist.id,
            tracks: playlist.tracks.total,
            url: playlist.external_urls.spotify,
        }));

        // Return the playlist data in the response
        return NextResponse.json({ playlists }, { status: 200 });
    } catch (error) {
        console.error('Error fetching Spotify playlists:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }
}
