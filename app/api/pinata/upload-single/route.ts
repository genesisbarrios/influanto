import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Starting single track upload...');
    
    const formData = await request.formData();
    
    const audioFile = formData.get('audioFile') as File;
    const imageFile = formData.get('imageFile') as File | null;
    const metadataString = formData.get('metadata') as string;
    
    // Validate required fields
    if (!audioFile) {
      console.error('No audio file provided');
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    if (!metadataString) {
      console.error('No metadata provided');
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      );
    }
    
    let metadata;
    try {
      metadata = JSON.parse(metadataString);
    } catch (parseError) {
      console.error('Failed to parse metadata:', parseError);
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }
    
    // Validate metadata fields
    if (!metadata.title || !metadata.userId) {
      console.error('Missing required metadata fields:', { title: metadata.title, userId: metadata.userId });
      return NextResponse.json(
        { error: 'Title and userId are required in metadata' },
        { status: 400 }
      );
    }

    console.log('Audio file:', audioFile.name, 'Size:', audioFile.size);
    if (imageFile) {
      console.log('Image file:', imageFile.name, 'Size:', imageFile.size);
    }
    console.log('Metadata:', JSON.stringify(metadata, null, 2));

    // Create sanitized filename prefix
    const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
    const filePrefix = `${sanitizeFileName(metadata.userId)}_${sanitizeFileName(metadata.title)}`;
    const groupName = `${filePrefix}_single_bundle`;

    try {
      // Step 1: Create a group for this single track
      console.log('Creating group for bundle...');
      const group = await pinata.groups.create({
        name: groupName
      });
      
      console.log('Group created:', group.id);

      // Step 2: Upload audio file to the group
      console.log('Uploading audio file...');
      const audioUpload = await pinata.upload.file(audioFile, {
        metadata: {
          name: `${filePrefix}_audio`,
          keyValues: {
            userId: metadata.userId,
            nftTitle: metadata.title,
            contentType: 'single',
            fileType: 'audio',
            groupId: group.id
          }
        },
        groupId: group.id
      });
      
      const audioUrl = `${process.env.PINATA_GATEWAY}/ipfs/${audioUpload.IpfsHash}`;
      console.log('Audio uploaded:', audioUrl);

      // Step 3: Upload image file if provided
      let imageUrl = '';
      let imageUpload: any = null;
      if (imageFile) {
        console.log('Uploading image file...');
        imageUpload = await pinata.upload.file(imageFile, {
          metadata: {
            name: `${filePrefix}_image`,
            keyValues: {
              userId: metadata.userId,
              nftTitle: metadata.title,
              contentType: 'single',
              fileType: 'image',
              groupId: group.id
            }
          },
          groupId: group.id
        });
        
        imageUrl = `${process.env.PINATA_GATEWAY}/ipfs/${imageUpload.IpfsHash}`;
        console.log('Image uploaded:', imageUrl);
      }

      // Step 4: Create and upload NFT metadata
      const nftMetadata = {
        name: metadata.title,
        description: metadata.description || '',
        image: imageUrl,
        animation_url: audioUrl,
        external_url: '',
        attributes: [
          { trait_type: "Type", value: "Single" },
          { trait_type: "Artist", value: metadata.artist || 'Unknown' },
          { trait_type: "Genre", value: metadata.genres?.join(", ") || 'Uncategorized' },
          ...(metadata.bpm && [{ trait_type: "BPM", value: metadata.bpm }]),
          { trait_type: "Edition Size", value: metadata.editionSize || 1 },
          { trait_type: "Price (USD)", value: metadata.priceUsd || 0 },
          ...(metadata.releaseDate && [{ trait_type: "Release Date", value: metadata.releaseDate }])
        ].filter(Boolean),
        lyrics: metadata.lyrics || '',
        artist: metadata.artist || '',
        genres: metadata.genres?.join(", ") || '',
        bpm: metadata.bpm,
        edition_size: metadata.editionSize || 1,
        price_usd: metadata.priceUsd || 0,
        release_date: metadata.releaseDate || new Date().toISOString().split('T')[0],
        content_type: 'single',
        created_at: new Date().toISOString(),
        creator_id: metadata.userId,
        group_id: group.id,
        // File references
        audio_ipfs: audioUpload.IpfsHash,
        ...(imageFile && { image_ipfs: imageUpload.IpfsHash })
      };

      console.log('Uploading metadata...');
      const metadataUpload = await pinata.upload.json(nftMetadata, {
        metadata: {
          name: `${filePrefix}_metadata`,
          keyValues: {
            userId: metadata.userId,
            nftTitle: metadata.title,
            contentType: 'single',
            fileType: 'metadata',
            groupId: group.id
          }
        },
        groupId: group.id
      });

      const metadataUrl = `${process.env.PINATA_GATEWAY}/ipfs/${metadataUpload.IpfsHash}`;
      console.log('Metadata uploaded:', metadataUrl);

      const result = {
        title: metadata.title,
        description: metadata.description,
        artist: metadata.artist,
        genre: metadata.genres?.join(", ") || '',
        bpm: metadata.bpm,
        lyrics: metadata.lyrics,
        editionSize: metadata.editionSize || 1,
        price: metadata.priceUsd || 0,
        audio: audioUrl,
        image: imageUrl,
        releaseDate: metadata.releaseDate,
        metadataCID: metadataUrl,
        groupId: group.id,
        groupName: groupName,
        audioHash: audioUpload.IpfsHash,
        ...(imageFile && { imageHash: imageUpload.IpfsHash }),
        metadataHash: metadataUpload.IpfsHash
      };

      console.log('Upload completed successfully');
      return NextResponse.json({ 
        success: true, 
        data: result,
        message: `Single "${metadata.title}" uploaded successfully as grouped bundle`
      });

    } catch (uploadError) {
      console.error('Failed to upload with groups:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload bundle', details: uploadError instanceof Error ? uploadError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error uploading single track:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to upload track', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown'
      }, 
      { status: 500 }
    );
  }
}