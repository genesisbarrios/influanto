import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from "pinata-web3";

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

    console.log(`Album: ${albumMetadata.title}, Tracks: ${tracks.length}`);

    // Create sanitized filename prefix
    const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
    const filePrefix = `${sanitizeFileName(albumMetadata.userId)}_${sanitizeFileName(albumMetadata.title)}`;
    const groupName = `${filePrefix}_album_bundle`;

    try {
      // Step 1: Create a group for this album
      console.log('Creating group for album bundle...');
      const group = await pinata.groups.create({
        name: groupName
      });
      
      console.log('Group created:', group.id);

      // Step 2: Upload album cover if provided
      let albumCoverUrl = '';
      if (albumCover) {
        console.log('Uploading album cover...');
        const albumCoverUpload = await pinata.upload.file(albumCover, {
          metadata: {
            name: `${filePrefix}_album_cover`,
            keyValues: {
              userId: albumMetadata.userId,
              albumTitle: albumMetadata.title,
              contentType: 'album',
              fileType: 'cover_image',
              groupId: group.id
            }
          },
          groupId: group.id
        });
        
        albumCoverUrl = `${process.env.PINATA_GATEWAY}/ipfs/${albumCoverUpload.IpfsHash}`;
        console.log('Album cover uploaded:', albumCoverUrl);
      }

      // Step 3: Upload all tracks
      const processedTracks: Array<{
        audioHash: string;
        audioUrl: string;
        imageHash?: string;
        imageUrl?: string;
        metadataHash: string;
        metadataUrl: string;
      }> = [];
      const trackUploads: Array<{
        audioHash: string;
        audioUrl: string;
        imageHash?: string;
        imageUrl?: string;
        metadataHash: string;
        metadataUrl: string;
      }> = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const trackNumber = track.metadata.trackNumber || (i + 1);
        
        console.log(`Uploading track ${trackNumber}: ${track.metadata.title}`);

        // Upload track audio
        const audioUpload = await pinata.upload.file(track.audioFile, {
          metadata: {
            name: `${filePrefix}_track${trackNumber}_audio`,
            keyValues: {
              userId: albumMetadata.userId,
              albumTitle: albumMetadata.title,
              trackTitle: track.metadata.title,
              trackNumber: trackNumber.toString(),
              contentType: 'album',
              fileType: 'track_audio',
              groupId: group.id
            }
          },
          groupId: group.id
        });

        const audioUrl = `${process.env.PINATA_GATEWAY}/ipfs/${audioUpload.IpfsHash}`;
        console.log(`Track ${trackNumber} audio uploaded:`, audioUrl);

        // Upload track image if provided
        let trackImageUrl = '';
        let trackImageUpload = null;
        if (track.imageFile) {
          trackImageUpload = await pinata.upload.file(track.imageFile, {
            metadata: {
              name: `${filePrefix}_track${trackNumber}_image`,
              keyValues: {
                userId: albumMetadata.userId,
                albumTitle: albumMetadata.title,
                trackTitle: track.metadata.title,
                trackNumber: trackNumber.toString(),
                contentType: 'album',
                fileType: 'track_image',
                groupId: group.id
              }
            },
            groupId: group.id
          });
          
          trackImageUrl = `${process.env.PINATA_GATEWAY}/ipfs/${trackImageUpload.IpfsHash}`;
          console.log(`Track ${trackNumber} image uploaded:`, trackImageUrl);
        }

        // Create track metadata
        const trackMetadata = {
          name: track.metadata.title,
          track_number: trackNumber,
          artist: track.metadata.artist || albumMetadata.artist,
          bpm: track.metadata.bpm,
          lyrics: track.metadata.lyrics || '',
          duration: 0,
          audio_url: audioUrl,
          audio_ipfs: audioUpload.IpfsHash,
          ...(trackImageUrl && { 
            image_url: trackImageUrl,
            image_ipfs: trackImageUpload?.IpfsHash 
          })
        };

        // Upload track metadata
        const trackMetadataUpload = await pinata.upload.json(trackMetadata, {
          metadata: {
            name: `${filePrefix}_track${trackNumber}_metadata`,
            keyValues: {
              userId: albumMetadata.userId,
              albumTitle: albumMetadata.title,
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

        processedTracks.push({
          audioHash: audioUpload.IpfsHash,
          audioUrl: audioUrl,
          ...(trackImageUpload && { 
            imageHash: trackImageUpload.IpfsHash,
            imageUrl: trackImageUrl 
          }),
          metadataHash: trackMetadataUpload.IpfsHash,
          metadataUrl: trackMetadataUrl
        });

        trackUploads.push({
          audioHash: audioUpload.IpfsHash,
          audioUrl: audioUrl,
          ...(trackImageUpload && { 
            imageHash: trackImageUpload.IpfsHash,
            imageUrl: trackImageUrl 
          }),
          metadataHash: trackMetadataUpload.IpfsHash,
          metadataUrl: trackMetadataUrl
        });
      }

      // Step 4: Create and upload complete album metadata
      const completeAlbumMetadata = {
        name: albumMetadata.title,
        description: albumMetadata.description || '',
        image: albumCoverUrl,
        animation_url: processedTracks[0]?.audioUrl || '',
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
        tracks: processedTracks
      };

      console.log('Uploading album metadata...');
      const albumMetadataUpload = await pinata.upload.json(completeAlbumMetadata, {
        metadata: {
          name: `${filePrefix}_album_metadata`,
          keyValues: {
            userId: albumMetadata.userId,
            albumTitle: albumMetadata.title,
            contentType: 'album',
            fileType: 'album_metadata',
            groupId: group.id
          }
        },
        groupId: group.id
      });

      const albumMetadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${albumMetadataUpload.IpfsHash}`;
      console.log('Album metadata uploaded:', albumMetadataUrl);

      // Prepare response data
      const result = {
        albumCID: albumMetadataUrl,
        metadata: completeAlbumMetadata,
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
        ...(albumCoverUrl && { albumCoverUrl }),
        tracks: tracks.map((track, index) => ({
          title: track.metadata.title,
          artist: track.metadata.artist || albumMetadata.artist,
          bpm: track.metadata.bpm,
          lyrics: track.metadata.lyrics,
          trackNumber: track.metadata.trackNumber || (index + 1),
          audioUrl: trackUploads[index].audioUrl,
          audioHash: trackUploads[index].audioHash,
          ...(trackUploads[index].imageUrl && { 
            imageUrl: trackUploads[index].imageUrl,
            imageHash: trackUploads[index].imageHash
          }),
          metadataUrl: trackUploads[index].metadataUrl,
          metadataHash: trackUploads[index].metadataHash
        }))
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