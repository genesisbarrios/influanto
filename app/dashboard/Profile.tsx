"use client"

import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import posthog from "posthog-js";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";
import { faInstagram, faFacebook, faTelegram, faTiktok, faSoundcloud, faLinkedin, faApple, faAmazon, faDiscord, faEtsy, faYoutube, faPatreon, faGithub, faWebAwesome, faWebflow, faTwitter, faSpotify, faBandcamp, faDeezer, faYoutubeSquare, faSquareYoutube } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faLocation, faEnvelope } from "@fortawesome/free-solid-svg-icons";

import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
import PrintifyIntegration from "@/components/PrintifyIntegration";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import NewsletterSignup from "@/components/NewsletterSignup";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
import SettingsDropdown from "@/components/SettingsDropdown";


const Profile =  () => {
  const [user, setUser] = useState<any>();
  const {data, status} = useSession();
  const [isEditing, setEditing] = useState(false);
  const [isEditingStreaming, setEditingStreaming] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUserName, setFormUserName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [formImage, setFormImage] = useState(null);
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [discord, setDiscord] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedIn] = useState("");
  const [youtube, setYouTube] = useState("");
  const [tiktok, setTikTok] = useState("");
  const [github, setGithub] = useState("");
  const [patreon, setPatreon] = useState("");
  const [substack, setSubstack] = useState("");
  const [telegram, setTelegram] = useState("");
  const [etsy, setEtsy] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [spotify, setSpotify] = useState("");
  const [appleMusic, setAppleMusic] = useState("");
  const [tidal, setTidal] = useState("");
  const [amazonMusic, setAmazonMusic] = useState("");
  const [soundcloud, setSoundCloud] = useState("");
  const [deezer, setDeezer] = useState("");
  const [pandora, setPandora] = useState("");
  const [youtubeMusic, setYouTubeMusic] = useState("");
  const [bandcamp, setBandcamp] = useState("");
  const [displayEmail, setDisplayEmail] = useState(Boolean);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [isEditingPixel, setIsEditingPixel] = useState(false);
  const [pixelInput, setPixelInput] = useState("");
  const [pixelSaving, setPixelSaving] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertt] = useState("");
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showNewsletterStyle, setShowNewsletterStyle] = useState(false);
  const [newsletterStyle, setNewsletterStyle] = useState<{ heading?: string; subtitle?: string; buttonColor?: string; textColor?: string; bgColor?: string }>({});
  const setNL = (patch: Record<string, string>) => setNewsletterStyle(prev => ({ ...prev, ...patch }));
  
// In Profile.tsx, add this function before the return statement

const disconnectPrintify = async () => {
  if (confirm('Are you sure you want to disconnect your Printify store?')) {
    try {
      await fetch('/api/printify/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      alert('✅ Printify disconnected successfully!');
      // Refresh to update the UI
      window.location.reload();
    } catch (error) {
      alert('❌ Failed to disconnect Printify');
    }
  }
};

  // Replace the existing validation functions and add missing ones:

const validateUsername = (value: string) => {
  // Remove spaces and convert to lowercase
  const cleanValue = value.replace(/\s+/g, '').toLowerCase();
  
  // Check for invalid characters (only allow letters, numbers, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]*$/.test(cleanValue)) {
      setAlertt("Username can only contain letters, numbers, underscores, and hyphens.");
      return false;
  }
  
  // Check minimum length
  if (cleanValue.length > 0 && cleanValue.length < 3) {
      setAlertt("Username must be at least 3 characters long.");
      return false;
  }
  
  // Check maximum length
  if (cleanValue.length > 30) {
      setAlertt("Username cannot be longer than 30 characters.");
      return false;
  }
  
  // Check if username starts with a letter or number
  if (cleanValue.length > 0 && !/^[a-zA-Z0-9]/.test(cleanValue)) {
      setAlertt("Username must start with a letter or number.");
      return false;
  }
  
  setAlertt("");
  return true;
};

const validateName = (value: string) => {
  if (value.length > 50) {
    setAlertt("Name cannot be longer than 50 characters.");
    return false;
  }
  if (value.includes("@") || value.includes("http")) {
    setAlertt("Name cannot contain @ symbols or links.");
    return false;
  }
  setAlertt("");
  return true;
};

const validateLocation = (value: string) => {
  if (value.length > 100) {
    setAlertt("Location cannot be longer than 100 characters.");
    return false;
  }
  if (value.includes("@") || value.includes("http")) {
    setAlertt("Location cannot contain @ symbols or links.");
    return false;
  }
  setAlertt("");
  return true;
};

const validateBio = (value: string) => {
  if (value.length > 500) {
    setAlertt("Bio cannot be longer than 500 characters.");
    return false;
  }
  if (value.includes("@")) {
    setAlertt("Bio cannot contain @ symbols.");
    return false;
  }
  setAlertt("");
  return true;
};

const validateWebsite = (value: string) => {
  if (!value) return true; // Empty is allowed
  if (!value.startsWith("https://") && !value.startsWith("http://")) {
    setAlertt("Website must start with 'https://' or 'http://'.");
    return false;
  }
  if (value.length > 200) {
    setAlertt("Website URL is too long.");
    return false;
  }
  setAlertt("");
  return true;
};

const validateSocialHandle = (value: string, platform: string) => {
  if (!value) return true; // Empty is allowed
  
  if (value.includes("@") && platform !== "youtube") {
    setAlertt(`${platform} handle cannot contain @ symbols.`);
    return false;
  }
  
  if (value.includes("http")) {
    setAlertt(`${platform} handle should not contain links.`);
    return false;
  }
  
  if (value.includes(" ")) {
    setAlertt(`${platform} handle cannot contain spaces.`);
    return false;
  }
  
  if (value.length > 50) {
    setAlertt(`${platform} handle is too long.`);
    return false;
  }
  
  setAlertt("");
  return true;
};

const validateYouTubeHandle = (value: string) => {
  if (!value) return true; // Empty is allowed
  
  if (!value.includes("@")) {
    setAlertt("YouTube handle must include @ symbol.");
    return false;
  }
  
  if (value.includes("http")) {
    setAlertt("YouTube handle should not contain links.");
    return false;
  }
  
  if (value.includes(" ")) {
    setAlertt("YouTube handle cannot contain spaces.");
    return false;
  }
  
  setAlertt("");
  return true;
};

const validateFacebookLink = (value: string) => {
  if (!value) return true; // Empty is allowed
  
  if (!value.startsWith("https://")) {
    setAlertt("Facebook link must start with 'https://'.");
    return false;
  }
  
  if (!value.includes("facebook.com")) {
    setAlertt("Must be a valid Facebook URL.");
    return false;
  }
  
  setAlertt("");
  return true;
};

const validateBandcampLink = (value: string) => {
  if (!value) return true; // Empty is allowed
  
  if (!value.startsWith("https://")) {
    setAlertt("Bandcamp link must start with 'https://'.");
    return false;
  }
  
  if (!value.includes("bandcamp.com")) {
    setAlertt("Must be a valid Bandcamp URL.");
    return false;
  }
  
  setAlertt("");
  return true;
};

const validateSpotifyURI = (value: string) => {
  if (!value) return true; // Empty is allowed
  
  // Can be either Spotify URI or artist ID
  if (value.includes(" ")) {
    setAlertt("Spotify URI/ID cannot contain spaces.");
    return false;
  }
  
  if (value.length > 100) {
    setAlertt("Spotify URI/ID is too long.");
    return false;
  }
  
  setAlertt("");
  return true;
};

const validateArtistID = (value: string, platform: string) => {
  if (!value) return true; // Empty is allowed
  
  if (value.includes(" ")) {
    setAlertt(`${platform} Artist ID cannot contain spaces.`);
    return false;
  }
  
  if (value.includes("@") || value.includes("http")) {
    setAlertt(`${platform} Artist ID should not contain @ or links.`);
    return false;
  }
  
  if (value.length > 100) {
    setAlertt(`${platform} Artist ID is too long.`);
    return false;
  }
  
  setAlertt("");
  return true;
};

const handleNameChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state so user can type
  setFormName(newValue);
  
  // Validate only if there's a value, but don't prevent typing
  if (newValue && !validateName(newValue)) {
    // Error already set in validateName function
  } else {
    setAlertt("");
  }
};

const handleUserNameChange = (e: any) => {
  const newValue = e.target.value.replace(/\s+/g, '').toLowerCase();
  // Always update the state so user can type
  setFormUserName(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateUsername(newValue)) {
    // Error already set in validateUsername function
  } else {
    setAlertt("");
  }
};

const handleLocationChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setLocation(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateLocation(newValue)) {
    // Error already set in validateLocation function
  } else {
    setAlertt("");
  }
};

const handleBioChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setBio(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateBio(newValue)) {
    // Error already set in validateBio function
  } else {
    setAlertt("");
  }
};

const handleWebsiteChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setWebsite(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateWebsite(newValue)) {
    // Error already set in validateWebsite function
  } else {
    setAlertt("");
  }
};

const handleInstagramChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setInstagram(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "Instagram")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleTwitterChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setTwitter(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "Twitter")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleDiscordChange = (e: any) => {
  const newValue = (e.currentTarget?.value ?? "").trim();
  // Always update the state
  setDiscord(newValue);
  // clear any prior alerts
  setAlertt("");
};

const handleFacebookChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setFacebook(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateFacebookLink(newValue)) {
    // Error already set in validateFacebookLink function
  } else {
    setAlertt("");
  }
};

const handleLinkedInChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setLinkedIn(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "LinkedIn")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleYouTubeChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setYouTube(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateYouTubeHandle(newValue)) {
    // Error already set in validateYouTubeHandle function
  } else {
    setAlertt("");
  }
};

const handleTikTokChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setTikTok(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "TikTok")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleGithubChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setGithub(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "GitHub")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleEtsyChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setEtsy(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "Etsy")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handlePatreonChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setPatreon(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "Patreon")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleTelegramChange = (e: any) => {
  const newValue = (e.target?.value ?? "").trim();
  // Always update the state so user can type / clear the field
  setTelegram(newValue);

  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "Telegram")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleSubstackChange = (e: any) => {
  const newValue = (e.target?.value ?? "").trim();
  // Always update the state
  setSubstack(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "Substack")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleSpotifyChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setSpotify(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSpotifyURI(newValue)) {
    // Error already set in validateSpotifyURI function
  } else {
    setAlertt("");
  }
};

const handleAppleMusicChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setAppleMusic(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateArtistID(newValue, "Apple Music")) {
    // Error already set in validateArtistID function
  } else {
    setAlertt("");
  }
};

const handleSoundcloudChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setSoundCloud(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateSocialHandle(newValue, "SoundCloud")) {
    // Error already set in validateSocialHandle function
  } else {
    setAlertt("");
  }
};

const handleTidalChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setTidal(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateArtistID(newValue, "Tidal")) {
    // Error already set in validateArtistID function
  } else {
    setAlertt("");
  }
};

const handleAmazonMusicChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setAmazonMusic(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateArtistID(newValue, "Amazon Music")) {
    // Error already set in validateArtistID function
  } else {
    setAlertt("");
  }
};

const handleBandcampChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setBandcamp(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateBandcampLink(newValue)) {
    // Error already set in validateBandcampLink function
  } else {
    setAlertt("");
  }
};

const handleDeezerChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setDeezer(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateArtistID(newValue, "Deezer")) {
    // Error already set in validateArtistID function
  } else {
    setAlertt("");
  }
};

const handlePandoraChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setPandora(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateArtistID(newValue, "Pandora")) {
    // Error already set in validateArtistID function
  } else {
    setAlertt("");
  }
};

const handleYouTubeMusicChange = (e: any) => {
  const newValue = e.target.value;
  // Always update the state
  setYouTubeMusic(newValue);
  
  // Validate only if there's a value
  if (newValue && !validateArtistID(newValue, "YouTube Music")) {
    // Error already set in validateArtistID function
  } else {
    setAlertt("");
  }
};

  const saveMetaPixel = async () => {
    setPixelSaving(true);
    try {
      const formData = new FormData();
      formData.append("metaPixelId", pixelInput.trim());
      await apiClient.post("/user", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMetaPixelId(pixelInput.trim());
      setUser((prev: any) => ({ ...prev, metaPixelId: pixelInput.trim() }));
      setIsEditingPixel(false);
    } catch (e: any) {
      setAlertt(e?.message || "Failed to save Pixel ID");
    } finally {
      setPixelSaving(false);
    }
  };

  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      console.log(data);
      setAvatarImage(data?.image);
      setFormName(data.name);
      setFormUserName(data.username);
      setFormEmail(data.email);
      setDisplayEmail(data.displayEmail);
      setLocation(data.location);
      setWebsite(data.website);
      setBio(data.bio);
      setInstagram(data.instagram);
      setTwitter(data.twitter);
      setFacebook(data.facebook);
      setDiscord(data.discord);
      setLinkedIn(data.linkedin);
      setYouTube(data.youtube);
      setTikTok(data.tiktok);
      setGithub(data.github);
      setPatreon(data.patreon);
      setSubstack(data.substack);
      setTelegram(data.telegram);
      setEtsy(data.etsy);
      setSpotify(data.spotify);
      setAppleMusic(data.appleMusic);
      setTidal(data.tidal);
      setAmazonMusic(data.amazonMusic);
      setSoundCloud(data.soundcloud);
      setDeezer(data.deezer);
      setPandora(data.pandora);
      setYouTubeMusic(data.youtubeMusic);
      setBandcamp(data.bandcamp);
      setMetaPixelId(data.metaPixelId || "");
      setNewsletterStyle(data.newsletterStyle && typeof data.newsletterStyle === "object" ? data.newsletterStyle : {});
      setUser(data);
  
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

  useEffect(() => {
    getUser();
    setFormEmail(data?.user?.email ?? "");
    if(!avatarImage){
      setAvatarImage(data?.user?.image ?? null);
    }
  }, []);

  useEffect(() => {
   if(!user){
    getUser();
   }else{
    //console.log("user:");
    //console.log(user);
   }
  }, [user]);


      useEffect(() => {
        document.title = "Profile | Influanto";
  
        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', 'Profile | Influanto.');
        
        // Update og:title
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', 'Profile | Influanto');
  
        // Update og:description
        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
          ogDescription = document.createElement('meta');
          ogDescription.setAttribute('property', 'og:description');
          document.head.appendChild(ogDescription);
        }
        ogDescription.setAttribute('content', 'The all in one music marketing tool.');
        
        // Update twitter:title
        let twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (!twitterTitle) {
          twitterTitle = document.createElement('meta');
          twitterTitle.setAttribute('name', 'twitter:title');
          document.head.appendChild(twitterTitle);
        }
        twitterTitle.setAttribute('content', 'Profile | Influanto');
  
        // Update twitter:description
        let twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (!twitterDescription) {
          twitterDescription = document.createElement('meta');
          twitterDescription.setAttribute('name', 'twitter:description');
          document.head.appendChild(twitterDescription);
        }
        twitterDescription.setAttribute('content', 'The all in one music marketing tool.');
      }, []);
  
  
    // In your component where the disconnect button is
  const handleDisconnect = async () => {
    try {
      console.log('🔄 Starting disconnect...');
      
      const response = await fetch('/api/printify-disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Disconnect successful:', data);
        
        // Refresh the page or update state to reflect changes
        window.location.reload(); // or use your state management
        
      } else {
        const error = await response.json();
        console.error('❌ Disconnect failed:', error);
      }
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  };

  const handleEditProfile = async (e:any) => {
    e.preventDefault();
    console.log('Edit Profile');
    console.log(user.email);
    setIsLoading(true);
    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();
      formData.append("newsletterStyle", JSON.stringify(newsletterStyle || {}));
      if (formName != null && formName != "") formData.append("name", formName);
      if (formUserName != null && formUserName != "") formData.append("username", formUserName);
      if (formEmail !== undefined && formEmail !== null) formData.append("email", user?.email);
      if (displayEmail !== undefined && displayEmail !== null) formData.append("displayEmail", displayEmail.toString());
      if (location !== undefined && location !== null) formData.append("location", location);
      if (website !== undefined && website !== null) formData.append("website", website);
      if (bio !== undefined && bio !== null) formData.append("bio", bio);
      if (instagram !== undefined && instagram !== null) formData.append("instagram", instagram);
      if (twitter !== undefined && twitter !== null) formData.append("twitter", twitter);
      if (facebook !== undefined && facebook !== null) formData.append("facebook", facebook);
      if (discord !== undefined && discord !== null) formData.append("discord", discord);
      if (linkedin !== undefined && linkedin !== null) formData.append("linkedin", linkedin);
      if (youtube !== undefined && youtube !== null) formData.append("youtube", youtube);
      if (tiktok !== undefined && tiktok !== null) formData.append("tiktok", tiktok);
      if (github !== undefined && github !== null) formData.append("github", github);
      if (patreon !== undefined && patreon !== null) formData.append("patreon", patreon);
      if (substack !== undefined && substack !== null) formData.append("substack", substack);
      if (telegram !== undefined && telegram !== null) formData.append("telegram", telegram);
      if (etsy !== undefined && etsy !== null) formData.append("etsy", etsy);
      if (spotify !== undefined && spotify !== null) formData.append("spotify", spotify);
      if (appleMusic !== undefined && appleMusic !== null) formData.append("appleMusic", appleMusic);
      if (tidal !== undefined && tidal !== null) formData.append("tidal", tidal);
      if (amazonMusic !== undefined && amazonMusic !== null) formData.append("amazonMusic", amazonMusic);
      if (soundcloud !== undefined && soundcloud !== null) formData.append("soundcloud", soundcloud);
      if (deezer !== undefined && deezer !== null) formData.append("deezer", deezer);
      if (pandora !== undefined && pandora !== null) formData.append("pandora", pandora);
      if (youtubeMusic !== undefined && youtubeMusic !== null) formData.append("youtubeMusic", youtubeMusic);
      if (bandcamp !== undefined && bandcamp !== null) formData.append("bandcamp", bandcamp);

      // Only append the image if it exists
      if (formImage) {
        formData.append("image", formImage);
      }
  
      // Send the form data
      const { data } = await apiClient.post("/user", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setAlertt("Loading.. Updating Your Profile..");
  
      console.log(data);
  
    } catch (error) {
      console.error("Error:", error.response || error.message);
      posthog.captureException(error);
      setAlertt(error?.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
      setEditing(false);
      posthog.capture("profile_updated");
      setAlertt("Profile updated successfully");
    }
  };
    
  const handleFileSelection = (e:any) => {
    if (e.target.files && e.target.files.length > 0) {
      // Update the state with the first selected file
      //const avatar = convertToBase64(e.target.files[0]);
      const avatar = e.target.files[0];
      console.log(avatar);
      setFormImage(avatar);
    }
  };

  const containerStyle = {
    width: "100%", // Limit width on larger screens
    margin: "0 auto", // Center the container
    padding: "10px", // Add padding to prevent content from touching edges
  };
  

   // Check if user data is not yet loaded
  if (!user) {
    return <div>Loading...</div>;
  }else if (user && !isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-md text-black" style={containerStyle}>
         <div className="w-full flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Profile</h2>
           

            {/* settings */}
            <div className="flex justify-end items-center mb-4 mt-4">
               <button 
              className="btn btn-primary btn-sm btn-narrow mr-4"
              style={{margin:"0"}}
              onClick={() => setEditing(true)}>
              Edit
            </button>

              <SettingsDropdown />
            </div>
          </div>
          <br></br>

          <div style={{margin:"0 auto",  textAlign:"center" }}>
            <img src={avatarImage || fallbackImageUrl} style={{ borderRadius: '50%', width:"75px", height:"75px", display:"inline"}} alt="Avatar" />
            <p>{user.name}</p>
            <p>{user.username}</p>
            <p>
              {user.location && <span className='mr-2'><FontAwesomeIcon icon={faLocation} />{user.location}</span>}
              {user.website && <a href={ user.website } target="_blank"><FontAwesomeIcon icon={faGlobe} /> Website</a>}
            </p>
          
            <p className="text-xs">{user.bio}</p>
            <h3 className="mt-5">Socials</h3>
            {user.instagram && <a href={"https://instagram.com/" + user.instagram } target="_blank" style={{marginRight:"10px", color:"orange"}}><FontAwesomeIcon icon={faInstagram} /></a>}
            {user.tiktok && <a href={"https://tiktok.com/@" + user.tiktok } target="_blank" style={{marginRight:"10px", color:"pink"}}><FontAwesomeIcon icon={faTiktok} /></a>}
            {user.twitter && <a href={"https://twitter.com/" + user.twitter } target="_blank" style={{marginRight:"10px", color:"lightblue"}}><FontAwesomeIcon icon={faTwitter} /></a>}
            {user.facebook && <a href={user.facebook } target="_blank" style={{marginRight:"10px", color:"blue"}}><FontAwesomeIcon icon={faFacebook} /></a>}
            {user.discord && <a href={user.discord } target="_blank" style={{marginRight:"10px", color:"purple"}}><FontAwesomeIcon icon={faDiscord} /></a>}
            {user.etsy && <a href={"https://etsy.com/shop/" + user.etsy } target="_blank" style={{marginRight:"10px", color:"brown"}}><FontAwesomeIcon icon={faEtsy} /></a> }
            {user.youtube && <a href={"https://youtube.com/@" + user.youtube } target="_blank" style={{marginRight:"10px", color:"red"}}><FontAwesomeIcon icon={faYoutube} /></a>}
            {user.telegram && <a href={"https://t.me/" + user.telegram } target="_blank" style={{marginRight:"10px", color:"lightblue"}}><FontAwesomeIcon icon={faTelegram} /></a>}
            {user.linkedin && <a href={"https://linkedin.com/" + user.linkedin } target="_blank" style={{marginRight:"10px", color:"darkblue"}}><FontAwesomeIcon icon={faLinkedin} /></a>}
            {user.github && <a href={"https://github.com/" + user.github } target="_blank" style={{marginRight:"10px"}}><FontAwesomeIcon icon={faGithub} /></a>}
            {user.patreon && <a href={"https://patreon.com/" + user.patreon } target="_blank" style={{marginRight:"10px", color:"black"}}><FontAwesomeIcon icon={faPatreon} /></a>}
            {user.substack && <a href={"https://substack.com/" + user.substack } target="_blank" style={{display:"inline-block"}}><img src="/substack.png" width={16}/></a>}
            {displayEmail && <a href={`mailto:${user.email}`}><FontAwesomeIcon icon={faEnvelope} color="grey" /></a>}

            <h3 className="mt-5">Listen</h3>
            {user.spotify && <a href={"https://open.spotify.com/artist/" + user.spotify } target="_blank" style={{marginRight:"10px", color:"green"}}><FontAwesomeIcon icon={faSpotify} /></a>}
            {user.appleMusic && <a href={"https://music.apple.com/" + user.appleMusic } target="_blank" style={{marginRight:"10px", color:"pink"}}><FontAwesomeIcon icon={faApple} /></a>}
            {user.tidal && <a href={"https://tidal.com/" + user.tidal } target="_blank" style={{marginRight:"10px", color:"black", display:"inline-block"}}><img src="/tidal.png" width={16}/></a>}
            {user.youtubeMusic && <a href={"https://music.youtube.com/channel/" + user.youtubeMusic } target="_blank" style={{marginRight:"10px", color:"red"}}><FontAwesomeIcon icon={faSquareYoutube} /></a>}
            {user.amazonMusic && <a href={"https://music.amazon.com/" + user.amazonMusic } target="_blank" style={{marginRight:"10px", color:"orange"}}><FontAwesomeIcon icon={faAmazon} /></a>}
            {user.soundcloud && <a href={"https://soundcloud.com/" + user.soundcloud } target="_blank" style={{marginRight:"10px", color:"orange"}}><FontAwesomeIcon icon={faSoundcloud} /></a>}
            {user.deezer && <a href={"https://deezer.com/" + user.deezer } target="_blank" style={{marginRight:"10px", color:"purple"}}><FontAwesomeIcon icon={faDeezer} /></a>}
            {user.pandora && <a href={"https://pandora.com/" + user.pandora } target="_blank" style={{marginRight:"10px", color:"darkblue", display:"inline-block"}}><img src="/pandora.png" width={16}/></a>}
            {user.bandcamp && <a href={ user.bandcamp } target="_blank" style={{marginRight:"10px", color:"lightblue"}}><FontAwesomeIcon icon={faBandcamp} /></a>}
            
            <br></br>
            {alertMsg && <div className="alert mt-10 w-1/2 m-auto">{alertMsg}</div>}
            
            <br></br>

            <AnalyticsDashboard />

            {/* ── Newsletter Embed ── */}
            {user?.username && (() => {
              const embedCode = `<iframe src="https://influanto.com/embed/newsletter/${user.username}" width="100%" height="440" style="border:none;max-width:480px;" title="Newsletter signup"></iframe>`;
              return (
                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 15 }}>📨</span>
                    <h3 className="font-bold text-base text-gray-800">Embed your newsletter</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Paste this code on any website to collect newsletter signups (works once newsletter signups are enabled on your Link in Bio).</p>
                  <textarea
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                    value={embedCode}
                    rows={3}
                    className="w-full text-xs font-mono p-2 border border-gray-200 rounded bg-gray-50 text-gray-700"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={async () => { try { await navigator.clipboard.writeText(embedCode); setEmbedCopied(true); setTimeout(() => setEmbedCopied(false), 2000); } catch { /* ignore */ } }}
                    >
                      {embedCopied ? '✓ Copied' : '📋 Copy embed code'}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowNewsletterStyle(s => !s)}>
                      {showNewsletterStyle ? '✕ Close style' : '✏️ Edit style'}
                    </button>
                    <a href={`/embed/newsletter/${user.username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 underline">Preview</a>
                  </div>
                </div>
              );
            })()}

            {/* ── Newsletter Style ── */}
            {showNewsletterStyle && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white text-left">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 15 }}>🎨</span>
                <h3 className="font-bold text-base text-gray-800">Newsletter Style</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">Customize the signup form that appears on your pages and embed.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Heading</label>
                  <input className="input input-sm input-bordered w-full" placeholder="📣 Join my newsletter" value={newsletterStyle.heading ?? ""} onChange={e => setNL({ heading: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Subtitle</label>
                  <input className="input input-sm input-bordered w-full" placeholder="Get updates on new releases…" value={newsletterStyle.subtitle ?? ""} onChange={e => setNL({ subtitle: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm">Button
                  <input type="color" className="w-8 h-8 rounded border border-gray-300 cursor-pointer" value={newsletterStyle.buttonColor || "#4f46e5"} onChange={e => setNL({ buttonColor: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm">Text
                  <input type="color" className="w-8 h-8 rounded border border-gray-300 cursor-pointer" value={newsletterStyle.textColor || "#111827"} onChange={e => setNL({ textColor: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm">Background
                  <input type="color" className="w-8 h-8 rounded border border-gray-300 cursor-pointer" value={newsletterStyle.bgColor || "#ffffff"} onChange={e => setNL({ bgColor: e.target.value })} />
                </label>
              </div>

              {/* Live preview */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1">Preview</p>
                <div className="rounded-lg border border-gray-200 p-2" style={{ background: "#f3f4f6" }}>
                  <NewsletterSignup username={user?.username || "you"} source="link_in_bio" fields={["name", "email"]} style={newsletterStyle} />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm mt-3"
                onClick={async () => {
                  try {
                    const fd = new FormData();
                    fd.append("newsletterStyle", JSON.stringify(newsletterStyle || {}));
                    await apiClient.post("/user", fd, { headers: { "Content-Type": "multipart/form-data" } });
                    setUser((prev: any) => ({ ...prev, newsletterStyle }));
                    setAlertt("Newsletter style saved");
                  } catch { setAlertt("Could not save newsletter style"); }
                }}
              >
                Save newsletter style
              </button>
            </div>
            )}

            {/* ── Meta Pixel ── */}
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white text-left">
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0866FF" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span className="font-semibold text-sm text-gray-800">Meta Pixel</span>
              </div>

              {isEditingPixel ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="input input-sm w-full border border-gray-300"
                    placeholder="Enter Pixel ID (e.g. 1234567890)"
                    value={pixelInput}
                    onChange={(e) => setPixelInput(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-gray-400">
                    Find your Pixel ID in Meta Events Manager → Data Sources.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={saveMetaPixel}
                      disabled={pixelSaving}
                      className="btn btn-primary btn-sm"
                    >
                      {pixelSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditingPixel(false)}
                      className="btn btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : user?.metaPixelId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-700">✅ Pixel Connected</div>
                    <div className="text-xs text-gray-500 mt-0.5">ID: {user.metaPixelId}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPixelInput(user.metaPixelId); setIsEditingPixel(true); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { setPixelInput(""); saveMetaPixel(); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">No pixel connected</p>
                  <button
                    onClick={() => { setPixelInput(""); setIsEditingPixel(true); }}
                    className="btn btn-sm btn-outline"
                  >
                    Connect Pixel
                  </button>
                </div>
              )}
            </div>

            {/* Show connection status if connected */}
            {user?.printifyShopId && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">
                      ✅ Printify Store Connected
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Store: {user.printifyStoreName || 'Connected Store'}<br/>
                      Shop ID: {user.printifyShopId}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDisconnect()}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
            
            <PrintifyIntegration user={user} />
           

          {/* Premium Sign Up - Enhanced aesthetic version */}
          {!user.hasAccess &&
          <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg">
            {/* Header with icon */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                Unlock Premium Features
              </h3>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </span>
                <span>Advanced Styling Features</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </span>
                <span>Advanced QR Code Generator</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xs">✓</span>
                </span>
                <span>More Release Pages</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <ButtonCheckout
                mode="subscription"
                priceId={config.stripe.plans[1].priceId} 
              />
              
              {/* Enhanced trial notice */}
              <div className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-lg">⏰</span>
                  <span className="text-sm font-semibold text-gray-800">
                    14-Day FREE Trial
                  </span>
                  <span className="text-lg">⏰</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Start your free trial today • No commitment required • Cancel anytime
                </p>
                <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>💳</span>
                    <span>No charges for 14 days</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🔄</span>
                    <span>Cancel with one click</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          }
          </div>
        </div>
    );
  }else if (isEditing){
    return (
      <div className="p-4 bg-white shadow rounded-md " style={containerStyle}>
        <div className="w-full flex flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 inline">Profile</h2>
        <br></br>
      
      <form>
        <img src={avatarImage || fallbackImageUrl} style={{ borderRadius: '50%', width:"75px", height:"75px", display:"inline"}} alt="Avatar" />
        <div style={{display:"inline"}}>
          <input style={{display:"inline", marginLeft:"10px"}} 
              type="file"
              className="input mb-2 p-2 w-1/2"
              accept="image/*"
              onChange={(e) => handleFileSelection(e)}
            />
        </div>
        <br></br>
        <label style={{display:"block"}}>Name</label>
        <input 
          type="text" 
          className="input mb-2 w-3/4" 
          required 
          placeholder="Enter your name"
          value={formName || ""}
          onChange={(e) => handleNameChange(e)}
        />
        <br />
        <label style={{display:"block"}}>Username</label>
        <input 
          type="text" 
          className="input mb-2 w-3/4" 
          required 
          placeholder="Enter your username"
          value={formUserName || ""}
          onChange={(e) => handleUserNameChange(e)}
        />
        <br />
        <label style={{display:"block"}}>Location</label> 
        <input 
          type="text" 
          className="input mb-2 w-3/4" 
          placeholder="Enter Your Location"
          value={location || ""}
          onChange={(e) => handleLocationChange(e)} 
        />
        <br />
        <label style={{display:"block"}}>Website</label> 
        <input 
          type="text" 
          className="input mb-2 w-3/4" 
          placeholder="Website Link"
          value={website || ""}
          onChange={(e) => handleWebsiteChange(e)} 
        />
        <br />
        <label style={{display:"block"}}>Bio</label> 
        <input 
          type="text" 
          className="input mb-2 w-3/4" 
          placeholder="Describe Yourself"
          value={bio || ""}
          onChange={(e) => handleBioChange(e)} 
        />
        <br />
        <label style={{display:"block"}}>Email</label>
        <p className="text-sm mb-2">{user?.email}</p>
        <label style={{display:"block"}}>
          <input 
            type="checkbox" 
            className="mr-2" 
            checked={displayEmail || false} 
            onChange={(e) => setDisplayEmail(e.target.checked)} 
          /> 
          Display Email
        </label>
        <br />

        <h1>Socials</h1>
        <div className="flex flex-wrap w-full">
          <div className="w-full lg:w-1/2 p-2">
            <label style={{display:"block"}}>Instagram</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={instagram || ""}
              onChange={(e) => handleInstagramChange(e)} 
            />
          
            <label style={{display:"block"}}>Twitter(X)</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={twitter || ""}
              onChange={(e) => handleTwitterChange(e)} 
            />

            <label style={{display:"block"}}>Discord</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="link"
              value={discord || ""}
              onChange={(e) => handleDiscordChange(e)} 
            />
          
            <label style={{display:"block"}}>FaceBook</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="link"
              value={facebook || ""}
              onChange={(e) => handleFacebookChange(e)} 
            />
            
            <label style={{display:"block"}}>LinkedIn</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={linkedin || ""}
              onChange={(e) => handleLinkedInChange(e)} 
            />
            
            <label style={{display:"block"}}>Etsy</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={etsy || ""}
              onChange={(e) => handleEtsyChange(e)} 
            />
          </div>

          <div className="w-full lg:w-1/2 p-2">
          <label style={{display:"block"}}>TikTok</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={tiktok || ""}
              onChange={(e) => handleTikTokChange(e)} 
            />
            <br />
            <label>YouTube</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="@handle"
              value={youtube || ""}
              onChange={(e) => handleYouTubeChange(e)} 
            />
            <br />
            <label>Telegram</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={telegram || ""}
              onChange={(e) => handleTelegramChange(e)} 
            />
            <br />
            <label  style={{display:"block"}}>GitHub</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={github || ""}
              onChange={(e) => handleGithubChange(e)} 
            />
            <br />
            <label>SubStack</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={substack || ""}
              onChange={(e) => handleSubstackChange(e)} 
            />
              <label style={{display:"block"}}>Patreon</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={patreon || ""}
              onChange={(e) => handlePatreonChange(e)} 
            />
            <br />
          </div>
        </div>
        <h1 style={{display:"inline"}}>Listen</h1>
        {!isEditingStreaming &&  <button 
          type="button"
          className="btn btn-alert btn-sm btn-narrow ml-2"
          style={{ width: "auto", display: "inline"}}
          onClick={() => setEditingStreaming(true)}>
          Edit Streaming Links  
        </button> }
        <br></br>
        {isEditingStreaming && <div className="flex flex-wrap w-full">
          <div className="w-full sm:w-1/2 p-2">
            <label  style={{display:"block"}}>Spotify</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Spotify URI"
              value={spotify || ""}
              onChange={(e) => handleSpotifyChange(e)} 
            />
            <br />
            <label>Apple Music</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Artist ID"
              value={appleMusic || ""}
              onChange={(e) => handleAppleMusicChange(e)} 
            />
            <br />
            <label>YouTube Music</label>   <br />
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Channel ID"
              value={youtubeMusic || ""}
              onChange={(e) => handleYouTubeMusicChange(e)} 
            />
            <br />
            <label>Amazon Music</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Artist ID"
              value={amazonMusic || ""}
              onChange={(e) => handleAmazonMusicChange(e)} 
            />
            <br />
            <label>Bandcamp</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="link"
              value={bandcamp || ""}
              onChange={(e) => handleBandcampChange(e)} 
            />
            <br />
          </div>
          <div className="w-full sm:w-1/2 p-2">
            <label>Soundcloud</label>   <br />
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="handle"
              value={soundcloud || ""}
              onChange={(e) => handleSoundcloudChange(e)} 
            />
            <br />
            <label>Tidal</label> <br />
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Artist ID"
              value={tidal || ""}
              onChange={(e) => handleTidalChange(e)} 
            />
            <br />
            <label>Pandora</label>   <br />
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Artist ID"
              value={pandora || ""}
              onChange={(e) => handlePandoraChange(e)} 
            />
            <br />
            <label style={{display:"block"}}>Deezer</label> 
            <input 
              type="text" 
              className="input mb-2 w-3/4" 
              placeholder="Artist ID"
              value={deezer || ""}
              onChange={(e) => handleDeezerChange(e)} 
            />
            <br />
          </div>
        </div>}
        {alertMsg && <div className="alert mt-5 w-100" style={{backgroundColor:"darkred", border:"1px darkred solid"}}>{alertMsg}</div>}
        <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{width:"35%", display:"inline", margin:"8% 0 0"}}
          onClick={(e) => handleEditProfile(e)} 
          type="submit">
          Submit
      </button>
      <button
        className="btn btn-alert btn-block btn-sm btn-narrow"
        style={{ width: "35%", display: "inline", margin: "2% 5%" }}
        onClick={() => setEditing(false)}>
        Cancel
      </button>
      </form>
        </div>
      </div>
      );
    }   
};

export default Profile;