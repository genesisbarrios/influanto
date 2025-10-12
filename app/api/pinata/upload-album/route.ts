import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from "pinata-web3";
import connectMongo from '@/libs/mongoose';
import { Collectible } from '@/models/Collectible';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Starting album upload...');
    
    const formData = await request.formData();
    
    // Get album metadata
    const metadataString = formData.get('metadata') as string;
    const albumCover = formData.get('albumCover') as File | null;
    
    if (!metadataString) {
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      );
    }

    let albumMetadata;
    try {
      albumMetadata = JSON.parse(metadataString);
    } catch (parseError) {
      console.error('Failed to parse metadata:', parseError);
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!albumMetadata.title || !albumMetadata.userId) {
      return NextResponse.json(
        { error: 'Title and userId are required' },
        { status: 400 }
      );
    }
    
    // Get track files
    const tracks: Array<{
      audioFile: File;
      imageFile?: File;
      metadata: any;
      index: number;
    }> = [];
    
    // Extract track data from formData
    for (let i = 0; i < albumMetadata.tracks.length; i++) {
      const audioFile = formData.get(`track_${i}_audio`) as File;
      const imageFile = formData.get(`track_${i}_image`) as File | null;
      
      if (audioFile) {
        tracks.push({
          audioFile,
          imageFile: imageFile || undefined,
          metadata: albumMetadata.tracks[i],
          index: i
        });
      }
    }

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No tracks found in album' },
        { status: 400 }
      );
    }

    // Create sanitized filename with userId and title
    const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const albumTitle = sanitizeFileName(albumMetadata.title);
    const userIdShort = albumMetadata.userId.slice(-8); // Use last 8 chars of userId for shorter names
    const filePrefix = `${userIdShort}_${albumTitle}`;
    const groupName = `${filePrefix}_album_bundle`;

    console.log(`Album: ${albumMetadata.title}, Tracks: ${tracks.length}`);
    console.log('File prefix:', filePrefix);

    try {
      // Step 1: Create a group for this album
      console.log('Creating group for album bundle...');
      const group = await pinata.groups.create({
        name: groupName
      });
      
      console.log('Group created:', group.id);

      // Step 2: Upload album cover with userId_title_album_cover naming
      let albumCoverUrl = '';
      let albumCoverHash = '';
      if (albumCover) {
        console.log('Uploading album cover...');

        const albumCoverUpload = await pinata.upload.file(albumCover, {
          metadata: {
            name: `${filePrefix}_album_cover`, // userId_title_album_cover
            keyValues: {
              userId: albumMetadata.userId,
              collectibleTitle: albumMetadata.title,
              contentType: 'album',
              fileType: 'cover_image',
              groupId: group.id,
              originalFileName: albumCover.name,
              customFileName: `${filePrefix}_album_cover.${albumCover.name.split('.').pop() || 'jpg'}`
            }
          },
          groupId: group.id
        });
        
        albumCoverUrl = `https://silver-legal-python-898.mypinata.cloud/files/${albumCoverUpload.IpfsHash}`;
        albumCoverHash = albumCoverUpload.IpfsHash;
        console.log('Album cover uploaded:', albumCoverUrl);
      }

      // Step 3: Upload all tracks with userId_title_trackNumber_trackTitle naming
      const trackData: Array<{
        title: string;
        artist: string;
        bpm?: number;
        lyrics?: string;
        trackNumber: number;
        audioUrl: string;
        audioHash: string;
        imageUrl?: string;
        imageHash?: string;
        metadataUrl: string;
        metadataHash: string;
      }> = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const trackNumber = track.metadata.trackNumber || (i + 1);
        const trackTitle = sanitizeFileName(track.metadata.title || `Track_${trackNumber}`);
        
        console.log(`Uploading track ${trackNumber}: ${track.metadata.title}`);

        // Upload track audio with userId_title_trackNumber_trackTitle naming
        const audioUpload = await pinata.upload.file(track.audioFile, {
          metadata: {
            name: `${filePrefix}_${String(trackNumber).padStart(2, '0')}_${trackTitle}_audio`,
            keyValues: {
              userId: albumMetadata.userId,
              collectibleTitle: albumMetadata.title,
              trackTitle: track.metadata.title,
              trackNumber: trackNumber.toString(),
              contentType: 'album',
              fileType: 'track_audio',
              groupId: group.id,
              originalFileName: track.audioFile.name,
              customFileName: `${filePrefix}_${String(trackNumber).padStart(2, '0')}_${trackTitle}_audio.${track.audioFile.name.split('.').pop() || 'mp3'}`
            }
          },
          groupId: group.id
        });

        const audioUrl = `https://silver-legal-python-898.mypinata.cloud/files/${audioUpload.IpfsHash}`;
        console.log(`Track ${trackNumber} audio uploaded:`, audioUrl);

        // Upload track image with userId_title_trackNumber_trackTitle_image naming if provided
        let trackImageUrl = '';
        let trackImageHash = '';
        if (track.imageFile) {
          const trackImageUpload = await pinata.upload.file(track.imageFile, {
            metadata: {
              name: `${filePrefix}_${String(trackNumber).padStart(2, '0')}_${trackTitle}_image`,
              keyValues: {
                userId: albumMetadata.userId,
                collectibleTitle: albumMetadata.title,
                trackTitle: track.metadata.title,
                trackNumber: trackNumber.toString(),
                contentType: 'album',
                fileType: 'track_image',
                groupId: group.id,
                originalFileName: track.imageFile.name,
                customFileName: `${filePrefix}_${String(trackNumber).padStart(2, '0')}_${trackTitle}_image.${track.imageFile.name.split('.').pop() || 'jpg'}`
              }
            },
            groupId: group.id
          });
          
          trackImageUrl = `${process.env.PINATA_GATEWAY}/ipfs/${trackImageUpload.IpfsHash}`;
          trackImageHash = trackImageUpload.IpfsHash;
          console.log(`Track ${trackNumber} image uploaded:`, trackImageUrl);
        }

        // Create track metadata object
        const trackMetadata = {
          name: track.metadata.title,
          track_number: trackNumber,
          artist: track.metadata.artist || albumMetadata.artist,
          bpm: track.metadata.bmp,
          lyrics: track.metadata.lyrics || '',
          duration: 0,
          audio_url: audioUrl,
          audio_ipfs: audioUpload.IpfsHash,
          ...(trackImageUrl && { 
            image_url: trackImageUrl,
            image_ipfs: trackImageHash 
          })
        };

        // Upload track metadata with userId_title_trackNumber_trackTitle_metadata naming
        const trackMetadataUpload = await pinata.upload.json(trackMetadata, {
          metadata: {
            name: `${filePrefix}_${String(trackNumber).padStart(2, '0')}_${trackTitle}_metadata`,
            keyValues: {
              userId: albumMetadata.userId,
              collectibleTitle: albumMetadata.title,
              trackTitle: track.metadata.title,
              trackNumber: trackNumber.toString(),
              contentType: 'album',
              fileType: 'track_metadata',
              groupId: group.id
            }
          },
          groupId: group.id
        });

        const trackMetadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${trackMetadataUpload.IpfsHash}`;
        console.log(`Track ${trackNumber} metadata uploaded:`, trackMetadataUrl);

        // Store track data
        trackData.push({
          title: track.metadata.title,
          artist: track.metadata.artist || albumMetadata.artist,
          bpm: track.metadata.bpm,
          lyrics: track.metadata.lyrics,
          trackNumber: trackNumber,
          audioUrl: audioUrl,
          audioHash: audioUpload.IpfsHash,
          ...(trackImageUrl && { 
            imageUrl: trackImageUrl,
            imageHash: trackImageHash 
          }),
          metadataUrl: trackMetadataUrl,
          metadataHash: trackMetadataUpload.IpfsHash
        });
      }

      // Step 4: Create and upload complete album metadata with userId_title_album_metadata naming
      const completeAlbumMetadata = {
        name: albumMetadata.title,
        description: albumMetadata.description || '',
        image: albumCoverUrl,
        animation_url: trackData[0]?.audioUrl || '',
        external_url: '',
        attributes: [
          { trait_type: "Type", value: "Album" },
          { trait_type: "Artist", value: albumMetadata.artist },
          { trait_type: "Genre", value: albumMetadata.genres?.join(", ") || 'Uncategorized' },
          { trait_type: "Track Count", value: tracks.length },
          { trait_type: "Edition Size", value: albumMetadata.editionSize || 1 },
          { trait_type: "Price (USD)", value: albumMetadata.priceUsd || 0 },
          ...(albumMetadata.releaseDate && [{ trait_type: "Release Date", value: albumMetadata.releaseDate }])
        ].filter(Boolean),
        album_type: tracks.length <= 7 ? 'EP' : 'LP',
        total_tracks: tracks.length,
        artist: albumMetadata.artist,
        genres: albumMetadata.genres?.join(", ") || '',
        release_date: albumMetadata.releaseDate || new Date().toISOString().split('T')[0],
        edition_size: albumMetadata.editionSize || 1,
        price_usd: albumMetadata.priceUsd || 0,
        content_type: 'album',
        created_at: new Date().toISOString(),
        creator_id: albumMetadata.userId,
        group_id: group.id,
        ...(albumCoverUrl && { album_cover_url: albumCoverUrl }),
        tracks: trackData.map(track => ({
          name: track.title,
          track_number: track.trackNumber,
          artist: track.artist,
          bmp: track.bpm,
          lyrics: track.lyrics,
          audio_url: track.audioUrl,
          audio_ipfs: track.audioHash,
          ...(track.imageUrl && { 
            image_url: track.imageUrl,
            image_ipfs: track.imageHash 
          }),
          metadata_url: track.metadataUrl,
          metadata_ipfs: track.metadataHash
        }))
      };

      console.log('Uploading album metadata...');
      const albumMetadataUpload = await pinata.upload.json(completeAlbumMetadata, {
        metadata: {
          name: `${filePrefix}_album_metadata`, // userId_title_album_metadata
          keyValues: {
            userId: albumMetadata.userId,
            collectibleTitle: albumMetadata.title,
            contentType: 'album',
            fileType: 'album_metadata',
            groupId: group.id
          }
        },
        groupId: group.id
      });

      const albumMetadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${albumMetadataUpload.IpfsHash}`;
      console.log('Album metadata uploaded:', albumMetadataUrl);

      // Step 5: Save collectible directly to database
      console.log('Saving album collectible to database...');
      try {
        await connectMongo();

        const collectible = new Collectible({
          userId: albumMetadata.userId,
          title: albumMetadata.title,
          description: albumMetadata.description,
          artist: albumMetadata.artist,
          type: 'album',
          
          // IPFS Data
          metadataUri: albumMetadataUrl,
          metadataHash: albumMetadataUpload.IpfsHash,
          groupId: group.id,
          groupName: groupName,
          audioUrl: trackData[0]?.audioUrl || '',
          audioHash: trackData[0]?.audioHash || '',
          ...(albumCoverUrl && { 
            imageUrl: albumCoverUrl,
            imageHash: albumCoverHash 
          }),
          
          // Metadata
          genres: albumMetadata.genres || [],
          releaseDate: albumMetadata.releaseDate ? new Date(albumMetadata.releaseDate) : null,
          
          // Album specific
          trackCount: tracks.length,
          albumType: tracks.length <= 7 ? 'EP' : 'LP',
          
          // Commercial
          priceUsd: albumMetadata.priceUsd || 0,
          editionSize: albumMetadata.editionSize || 1,
          
          // Status
          status: 'uploaded',
          network: 'polkadot',
          
          // Tracks data for database
          tracks: trackData
        });

        const savedCollectible = await collectible.save();
        console.log('Album collectible saved to database:', savedCollectible._id);
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Continue anyway - IPFS upload succeeded
      }

      // Prepare response data
      const result = {
        albumCID: albumMetadataUrl,
        trackCount: tracks.length,
        title: albumMetadata.title,
        description: albumMetadata.description,
        artist: albumMetadata.artist,
        genre: albumMetadata.genres?.join(", ") || '',
        editionSize: albumMetadata.editionSize || 1,
        price: albumMetadata.priceUsd || 0,
        releaseDate: albumMetadata.releaseDate,
        groupId: group.id,
        groupName: groupName,
        albumMetadataHash: albumMetadataUpload.IpfsHash,
        ...(albumCoverUrl && { 
          albumCoverUrl,
          albumCoverHash 
        }),
        tracks: trackData
      };

      console.log('Album upload completed successfully');
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: `Album "${albumMetadata.title}" uploaded successfully with ${tracks.length} tracks`
      });

    } catch (uploadError) {
      console.error('Failed to upload album with groups:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload album', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error uploading album:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload album', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}