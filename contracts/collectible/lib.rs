#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod music_collectible {
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;
    use ink::storage::Mapping;
    use scale::{Decode, Encode};

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum MusicType {
        Single,
        Album,
    }

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Track {
        pub title: String,
        pub artist: String,
        pub audio_ipfs: String,
        pub image_ipfs: Option<String>,
        pub bpm: Option<u16>,
        pub lyrics: Option<String>,
        pub track_number: u8,
        pub duration: Option<u32>, // seconds
    }

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct MusicNFT {
        pub token_id: u32,
        pub creator: AccountId,
        pub owner: AccountId,
        pub title: String,
        pub description: String,
        pub artist: String,
        pub music_type: MusicType,
        pub metadata_ipfs: String,
        pub image_ipfs: Option<String>,
        pub audio_ipfs: Option<String>, // For singles
        pub genres: Vec<String>,
        pub release_date: Option<u64>, // timestamp
        pub bpm: Option<u16>,
        pub lyrics: Option<String>,
        pub price_usd: u64, // in cents to avoid decimals
        pub edition_size: u32,
        pub minted_count: u32,
        pub royalty_percentage: u8, // 0-100
        pub created_at: u64,
        pub is_active: bool,
        // Album specific
        pub tracks: Option<Vec<Track>>,
        pub track_count: Option<u8>,
        pub album_type: Option<String>, // "EP" or "LP"
        // IPFS grouping
        pub group_id: Option<String>,
    }

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct TokenOwnership {
        pub token_id: u32,
        pub owner: AccountId,
        pub edition_number: u32,
        pub purchased_at: u64,
        pub purchase_price: u64,
    }

    #[ink(storage)]
    pub struct MusicNFTContract {
        /// Mapping from token ID to NFT data
        nfts: Mapping<u32, MusicNFT>,
        /// Mapping from (token_id, edition_number) to owner
        token_owners: Mapping<(u32, u32), AccountId>,
        /// Mapping from owner to list of owned tokens
        owner_tokens: Mapping<AccountId, Vec<TokenOwnership>>,
        /// Mapping from creator to list of created tokens
        creator_tokens: Mapping<AccountId, Vec<u32>>,
        /// Token counter
        next_token_id: u32,
        /// Contract owner
        owner: AccountId,
        /// Platform fee percentage (0-100)
        platform_fee: u8,
        /// Mapping for approved operators
        token_approvals: Mapping<(u32, u32), AccountId>,
        operator_approvals: Mapping<(AccountId, AccountId), bool>,
        
        // Indexing mappings
        /// Mapping from artist name to token IDs
        artist_index: Mapping<String, Vec<u32>>,
        /// Mapping from genre to token IDs
        genre_index: Mapping<String, Vec<u32>>,
        /// Mapping from music type to token IDs
        type_index: Mapping<MusicType, Vec<u32>>,
        /// Mapping from creator to token IDs
        creator_index: Mapping<AccountId, Vec<u32>>,
        /// All token IDs for browsing
        all_tokens: Vec<u32>,
    }

    #[ink(event)]
    pub struct TokenMinted {
        #[ink(topic)]
        token_id: u32,
        #[ink(topic)]
        creator: AccountId,
        #[ink(topic)]
        music_type: MusicType,
        title: String,
        artist: String,
    }

    #[ink(event)]
    pub struct TokenPurchased {
        #[ink(topic)]
        token_id: u32,
        #[ink(topic)]
        buyer: AccountId,
        #[ink(topic)]
        seller: AccountId,
        edition_number: u32,
        price: u64,
    }

    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: AccountId,
        #[ink(topic)]
        token_id: u32,
        edition_number: u32,
    }

    #[derive(Debug, PartialEq, Eq, Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        TokenNotFound,
        Unauthorized,
        SoldOut,
        InsufficientPayment,
        InvalidInput,
        TransferFailed,
        AlreadyOwned,
        NotForSale,
        InvalidEdition,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl MusicNFTContract {
        #[ink(constructor)]
        pub fn new(platform_fee: u8) -> Self {
            let caller = Self::env().caller();
            Self {
                nfts: Mapping::default(),
                token_owners: Mapping::default(),
                owner_tokens: Mapping::default(),
                creator_tokens: Mapping::default(),
                next_token_id: 1,
                owner: caller,
                platform_fee,
                token_approvals: Mapping::default(),
                operator_approvals: Mapping::default(),
                artist_index: Mapping::default(),
                genre_index: Mapping::default(),
                type_index: Mapping::default(),
                creator_index: Mapping::default(),
                all_tokens: Vec::new(),
            }
        }

        /// Mint a new music NFT (single track)
        #[ink(message)]
        pub fn mint_single(
            &mut self,
            title: String,
            description: String,
            artist: String,
            metadata_ipfs: String,
            image_ipfs: Option<String>,
            audio_ipfs: String,
            genres: Vec<String>,
            release_date: Option<u64>,
            bpm: Option<u16>,
            lyrics: Option<String>,
            price_usd: u64,
            edition_size: u32,
            royalty_percentage: u8,
            group_id: Option<String>,
        ) -> Result<u32> {
            let caller = self.env().caller();
            let token_id = self.next_token_id;
            let timestamp = self.env().block_timestamp();

            if royalty_percentage > 100 {
                return Err(Error::InvalidInput);
            }

            let nft = MusicNFT {
                token_id,
                creator: caller,
                owner: caller,
                title: title.clone(),
                description,
                artist: artist.clone(),
                music_type: MusicType::Single,
                metadata_ipfs,
                image_ipfs,
                audio_ipfs: Some(audio_ipfs),
                genres: genres.clone(),
                release_date,
                bpm,
                lyrics,
                price_usd,
                edition_size,
                minted_count: 0,
                royalty_percentage,
                created_at: timestamp,
                is_active: true,
                tracks: None,
                track_count: None,
                album_type: None,
                group_id,
            };

            self.nfts.insert(token_id, &nft);
            self.all_tokens.push(token_id);

            // Update indexes
            self.update_artist_index(&artist, token_id);
            self.update_genre_indexes(&genres, token_id);
            self.update_type_index(&MusicType::Single, token_id);
            self.update_creator_index(&caller, token_id);

            // Update creator tokens
            let mut creator_tokens = self.creator_tokens.get(caller).unwrap_or_default();
            creator_tokens.push(token_id);
            self.creator_tokens.insert(caller, &creator_tokens);

            self.next_token_id += 1;

            self.env().emit_event(TokenMinted {
                token_id,
                creator: caller,
                music_type: MusicType::Single,
                title,
                artist,
            });

            Ok(token_id)
        }

        /// Mint a new music NFT (album)
        #[ink(message)]
        pub fn mint_album(
            &mut self,
            title: String,
            description: String,
            artist: String,
            metadata_ipfs: String,
            image_ipfs: Option<String>,
            tracks: Vec<Track>,
            genres: Vec<String>,
            release_date: Option<u64>,
            price_usd: u64,
            edition_size: u32,
            royalty_percentage: u8,
            album_type: String,
            group_id: Option<String>,
        ) -> Result<u32> {
            let caller = self.env().caller();
            let token_id = self.next_token_id;
            let timestamp = self.env().block_timestamp();

            if royalty_percentage > 100 || tracks.is_empty() {
                return Err(Error::InvalidInput);
            }

            let track_count = tracks.len() as u8;

            let nft = MusicNFT {
                token_id,
                creator: caller,
                owner: caller,
                title: title.clone(),
                description,
                artist: artist.clone(),
                music_type: MusicType::Album,
                metadata_ipfs,
                image_ipfs,
                audio_ipfs: None,
                genres: genres.clone(),
                release_date,
                bpm: None,
                lyrics: None,
                price_usd,
                edition_size,
                minted_count: 0,
                royalty_percentage,
                created_at: timestamp,
                is_active: true,
                tracks: Some(tracks),
                track_count: Some(track_count),
                album_type: Some(album_type),
                group_id,
            };

            self.nfts.insert(token_id, &nft);
            self.all_tokens.push(token_id);

            // Update indexes
            self.update_artist_index(&artist, token_id);
            self.update_genre_indexes(&genres, token_id);
            self.update_type_index(&MusicType::Album, token_id);
            self.update_creator_index(&caller, token_id);

            // Update creator tokens
            let mut creator_tokens = self.creator_tokens.get(caller).unwrap_or_default();
            creator_tokens.push(token_id);
            self.creator_tokens.insert(caller, &creator_tokens);

            self.next_token_id += 1;

            self.env().emit_event(TokenMinted {
                token_id,
                creator: caller,
                music_type: MusicType::Album,
                title,
                artist,
            });

            Ok(token_id)
        }

        /// Purchase an edition of a music NFT
        #[ink(message, payable)]
        pub fn purchase_token(&mut self, token_id: u32) -> Result<u32> {
            let caller = self.env().caller();
            let payment = self.env().transferred_value();

            let mut nft = self.nfts.get(token_id).ok_or(Error::TokenNotFound)?;

            if !nft.is_active {
                return Err(Error::NotForSale);
            }

            if nft.minted_count >= nft.edition_size {
                return Err(Error::SoldOut);
            }

            // For demo purposes, we'll accept any payment amount
            // In production, you'd convert USD price to DOT and validate
            if payment == 0 {
                return Err(Error::InsufficientPayment);
            }

            let edition_number = nft.minted_count + 1;
            nft.minted_count += 1;

            // Update NFT
            self.nfts.insert(token_id, &nft);

            // Record ownership
            self.token_owners.insert((token_id, edition_number), &caller);

            // Update owner tokens
            let mut owner_tokens = self.owner_tokens.get(caller).unwrap_or_default();
            owner_tokens.push(TokenOwnership {
                token_id,
                owner: caller,
                edition_number,
                purchased_at: self.env().block_timestamp(),
                purchase_price: payment,
            });
            self.owner_tokens.insert(caller, &owner_tokens);

            // Calculate and transfer royalties
            self.distribute_payment(payment, &nft)?;

            self.env().emit_event(TokenPurchased {
                token_id,
                buyer: caller,
                seller: nft.creator,
                edition_number,
                price: payment,
            });

            self.env().emit_event(Transfer {
                from: None,
                to: caller,
                token_id,
                edition_number,
            });

            Ok(edition_number)
        }

        /// Get NFT by token ID
        #[ink(message)]
        pub fn get_nft(&self, token_id: u32) -> Option<MusicNFT> {
            self.nfts.get(token_id)
        }

        /// Get all NFTs by artist
        #[ink(message)]
        pub fn get_nfts_by_artist(&self, artist: String) -> Vec<u32> {
            self.artist_index.get(&artist).unwrap_or_default()
        }

        /// Get all NFTs by genre
        #[ink(message)]
        pub fn get_nfts_by_genre(&self, genre: String) -> Vec<u32> {
            self.genre_index.get(&genre).unwrap_or_default()
        }

        /// Get all NFTs by type
        #[ink(message)]
        pub fn get_nfts_by_type(&self, music_type: MusicType) -> Vec<u32> {
            self.type_index.get(&music_type).unwrap_or_default()
        }

        /// Get all NFTs by creator
        #[ink(message)]
        pub fn get_nfts_by_creator(&self, creator: AccountId) -> Vec<u32> {
            self.creator_index.get(&creator).unwrap_or_default()
        }

        /// Get owned tokens by account
        #[ink(message)]
        pub fn get_owned_tokens(&self, owner: AccountId) -> Vec<TokenOwnership> {
            self.owner_tokens.get(owner).unwrap_or_default()
        }

        /// Get all token IDs (for browsing)
        #[ink(message)]
        pub fn get_all_tokens(&self) -> Vec<u32> {
            self.all_tokens.clone()
        }

        /// Get total supply
        #[ink(message)]
        pub fn total_supply(&self) -> u32 {
            self.next_token_id - 1
        }

        /// Check if account owns specific token edition
        #[ink(message)]
        pub fn owns_token(&self, account: AccountId, token_id: u32, edition_number: u32) -> bool {
            self.token_owners.get((token_id, edition_number)) == Some(account)
        }

        /// Get available editions for a token
        #[ink(message)]
        pub fn get_available_editions(&self, token_id: u32) -> Option<u32> {
            let nft = self.nfts.get(token_id)?;
            Some(nft.edition_size - nft.minted_count)
        }

        /// Set token active status (only creator)
        #[ink(message)]
        pub fn set_token_active(&mut self, token_id: u32, is_active: bool) -> Result<()> {
            let caller = self.env().caller();
            let mut nft = self.nfts.get(token_id).ok_or(Error::TokenNotFound)?;

            if nft.creator != caller {
                return Err(Error::Unauthorized);
            }

            nft.is_active = is_active;
            self.nfts.insert(token_id, &nft);

            Ok(())
        }

        /// Update platform fee (only owner)
        #[ink(message)]
        pub fn set_platform_fee(&mut self, fee: u8) -> Result<()> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(Error::Unauthorized);
            }
            if fee > 100 {
                return Err(Error::InvalidInput);
            }
            self.platform_fee = fee;
            Ok(())
        }

        // Private helper functions
        fn update_artist_index(&mut self, artist: &String, token_id: u32) {
            let mut tokens = self.artist_index.get(artist).unwrap_or_default();
            tokens.push(token_id);
            self.artist_index.insert(artist, &tokens);
        }

        fn update_genre_indexes(&mut self, genres: &Vec<String>, token_id: u32) {
            for genre in genres {
                let mut tokens = self.genre_index.get(genre).unwrap_or_default();
                tokens.push(token_id);
                self.genre_index.insert(genre, &tokens);
            }
        }

        fn update_type_index(&mut self, music_type: &MusicType, token_id: u32) {
            let mut tokens = self.type_index.get(music_type).unwrap_or_default();
            tokens.push(token_id);
            self.type_index.insert(music_type, &tokens);
        }

        fn update_creator_index(&mut self, creator: &AccountId, token_id: u32) {
            let mut tokens = self.creator_index.get(creator).unwrap_or_default();
            tokens.push(token_id);
            self.creator_index.insert(creator, &tokens);
        }

        fn distribute_payment(&self, payment: u128, nft: &MusicNFT) -> Result<()> {
            let platform_fee_amount = payment * self.platform_fee as u128 / 100;
            let royalty_amount = payment * nft.royalty_percentage as u128 / 100;
            let creator_amount = payment - platform_fee_amount - royalty_amount;

            // Transfer to creator
            if creator_amount > 0 {
                if self.env().transfer(nft.creator, creator_amount).is_err() {
                    return Err(Error::TransferFailed);
                }
            }

            // Transfer platform fee to owner
            if platform_fee_amount > 0 {
                if self.env().transfer(self.owner, platform_fee_amount).is_err() {
                    return Err(Error::TransferFailed);
                }
            }

            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_mint_single() {
            let mut contract = MusicNFTContract::new(5);
            
            let token_id = contract.mint_single(
                "Test Single".to_string(),
                "A test single".to_string(),
                "Test Artist".to_string(),
                "QmTest123".to_string(),
                Some("QmImage123".to_string()),
                "QmAudio123".to_string(),
                vec!["Hip Hop".to_string()],
                None,
                Some(120),
                Some("Test lyrics".to_string()),
                1000, // $10.00
                100,
                10, // 10% royalty
                Some("group123".to_string()),
            ).unwrap();

            assert_eq!(token_id, 1);
            
            let nft = contract.get_nft(token_id).unwrap();
            assert_eq!(nft.title, "Test Single");
            assert_eq!(nft.music_type, MusicType::Single);
        }

        #[ink::test]
        fn test_mint_album() {
            let mut contract = MusicNFTContract::new(5);
            
            let tracks = vec![
                Track {
                    title: "Track 1".to_string(),
                    artist: "Artist".to_string(),
                    audio_ipfs: "QmTrack1".to_string(),
                    image_ipfs: None,
                    bpm: Some(120),
                    lyrics: None,
                    track_number: 1,
                    duration: Some(180),
                }
            ];

            let token_id = contract.mint_album(
                "Test Album".to_string(),
                "A test album".to_string(),
                "Test Artist".to_string(),
                "QmAlbum123".to_string(),
                Some("QmAlbumCover123".to_string()),
                tracks,
                vec!["Hip Hop".to_string()],
                None,
                2000, // $20.00
                50,
                15, // 15% royalty
                "LP".to_string(),
                Some("albumgroup123".to_string()),
            ).unwrap();

            assert_eq!(token_id, 1);
            
            let nft = contract.get_nft(token_id).unwrap();
            assert_eq!(nft.title, "Test Album");
            assert_eq!(nft.music_type, MusicType::Album);
            assert_eq!(nft.track_count, Some(1));
        }

        #[ink::test]
        fn test_indexing() {
            let mut contract = MusicNFTContract::new(5);
            
            // Mint a single
            let _token_id = contract.mint_single(
                "Test Single".to_string(),
                "A test single".to_string(),
                "Test Artist".to_string(),
                "QmTest123".to_string(),
                None,
                "QmAudio123".to_string(),
                vec!["Hip Hop".to_string()],
                None,
                None,
                None,
                1000,
                100,
                10,
                None,
            ).unwrap();

            // Test artist index
            let artist_tokens = contract.get_nfts_by_artist("Test Artist".to_string());
            assert_eq!(artist_tokens.len(), 1);

            // Test genre index
            let genre_tokens = contract.get_nfts_by_genre("Hip Hop".to_string());
            assert_eq!(genre_tokens.len(), 1);

            // Test type index
            let single_tokens = contract.get_nfts_by_type(MusicType::Single);
            assert_eq!(single_tokens.len(), 1);
        }
    }
}