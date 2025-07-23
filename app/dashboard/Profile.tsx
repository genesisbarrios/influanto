"use client"

import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";
import { faInstagram, faFacebook, faTelegram, faTiktok, faSoundcloud, faLinkedin, faApple, faAmazon, faEtsy, faYoutube, faPatreon, faGithub, faWebAwesome, faWebflow, faTwitter, faSpotify, faBandcamp, faDeezer, faYoutubeSquare, faSquareYoutube } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faLocation, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { set } from "mongoose";
import ButtonCheckout from "@/components/ButtonCheckout";
import config from "@/config";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

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
  const [soundxyz, setSoundxyz] = useState("");
  const [displayEmail, setDisplayEmail] = useState(Boolean);

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");
  
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

  const validateInput = (value: string, allowLinks = false) => {
    if (!allowLinks && (value.includes("http://") || value.includes("https://"))) {
        setAlertt("Links are not allowed in this field.");
        return false;
    }
    if (value.includes("@")) {
        setAlertt("The '@' character is not allowed in this field.");
        return false;
    }
    return true;
  };

  const validateYoutubeInput = (value: string, allowLinks = false) => {
    if (value.includes("@")) {
        return true;
    }else{
      setAlertt("The '@' character must be included in your YouTube Handle.");
    }
    return true;
  };

  const validateFacebookLink = (value: string) => {
    if (!value.startsWith("https://")) {
        setAlertt("Facebook link must start with 'https://'.");
        return false;
    }
    return true;
  };

  const validateWebsite = (value: string) => {
    if (!value.startsWith("https://")) {
        setAlertt("Website must start with 'https://'.");
        return false;
    }
    setAlertt("");
    return true;
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
      setSoundxyz(data.soundxyz);
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
  
  // Assuming avatarImage is a File object
  const convertToBase64 = (avatarImage:any) => {
    if (avatarImage && avatarImage instanceof File) {
      const reader = new FileReader();

      reader.onload = function(event) {
        // Set the Base64 string to the state
        if (event.target && typeof event.target.result === 'string') {
          setAvatarImage(event.target.result);
        }
      };

      reader.onerror = function(error) {
        console.log('Error: ', error);
      };

      reader.readAsDataURL(avatarImage);
    } else {
      console.log('avatarImage is not a file');
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
      if (formName != null && formName != "") formData.append("name", formName);
      if (formUserName != null && formUserName != "") formData.append("username", formUserName);
      if (formEmail != null && formEmail != "") formData.append("email", user?.email);
      if (displayEmail != null) formData.append("displayEmail", displayEmail.toString());
      if (location != null && location != "") formData.append("location", location);
      if (website != null && website != "") formData.append("website", website);
      if (bio != null && bio != "") formData.append("bio", bio);
      if (instagram != null && instagram != "") formData.append("instagram", instagram);
      if (twitter != null && twitter != "") formData.append("twitter", twitter);
      if (facebook != null && facebook != "") formData.append("facebook", facebook);
      if (linkedin != null && linkedin != "") formData.append("linkedin", linkedin);
      if (youtube != null && youtube != "") formData.append("youtube", youtube);
      if (tiktok != null && tiktok != "") formData.append("tiktok", tiktok);
      if (github != null && github != "") formData.append("github", github);
      if (patreon != null && patreon != "") formData.append("patreon", patreon);
      if (substack != null && substack != "") formData.append("substack", substack);
      if (telegram != null && telegram != "") formData.append("telegram", telegram);
      if (etsy != null && etsy != "") formData.append("etsy", etsy);
      if (spotify != null && spotify != "") formData.append("spotify", spotify);
      if (appleMusic != null && appleMusic != "") formData.append("appleMusic", appleMusic);
      if (tidal != null && tidal != "") formData.append("tidal", tidal);
      if (amazonMusic != null && appleMusic != "") formData.append("amazonMusic", amazonMusic);
      if (soundcloud != null && soundcloud != "") formData.append("soundcloud", soundcloud);
      if (deezer != null && deezer != "") formData.append("deezer", deezer);
      if (pandora != null && pandora != "") formData.append("pandora", pandora);
      if (youtubeMusic != null && youtubeMusic != "") formData.append("youtubeMusic", youtubeMusic);
      if (bandcamp != null && bandcamp != "") formData.append("bandcamp", bandcamp);
      if (soundxyz != null && soundxyz != "") formData.append("soundxyz", soundxyz);

  
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
      setAlertt(error?.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
      setEditing(false);
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

  const handleNameChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setFormName(newValue);
    }
  };

  const handleUserNameChange = (e: any) => {
    const newValue = e.target.value.replace(/\s+/g, '').toLowerCase();
    if (validateUsername(newValue)) {
        setFormUserName(newValue);
    }
  };

  const handleWebsiteChange = (e: any) => {
    const newValue = e.target.value;
    if (validateWebsite(newValue)) {
        setWebsite(newValue);
    }
  };

  const handleBioChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setBio(newValue);
    }
  };

  const handleLocationChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setLocation(newValue);
    }
  };

  const handleInstagramChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setInstagram(newValue);
    }
  };

  const handleTwitterChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setTwitter(newValue);
    }
  };

  const handleFacebookChange = (e: any) => {
    const newValue = e.target.value;
    if (validateFacebookLink(newValue)) {
        setFacebook(newValue);
    }
  };

  const handleLinkedInChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setLinkedIn(newValue);
    }
  };

  const handleYouTubeChange = (e: any) => {
    const newValue = e.target.value;
    if (validateYoutubeInput(newValue)) {
        setYouTube(newValue);
    }
  };

  const handleTikTokChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setTikTok(newValue);
    }
  };

  const handleGithubChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setGithub(newValue);
    }
  };

  const handleEtsyChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setEtsy(newValue);
    }
  };

  const handlePatreonChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setPatreon(newValue);
    }
  };

  const handleTelegramChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setTelegram(newValue);
    }
  };

  const handleSubstackChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setSubstack(newValue);
    }
  };

  const handleSpotifyChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setSpotify(newValue);
    }
  };

  const handleAppleMusicChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setAppleMusic(newValue);
    }
  };

  const handleSoundcloudChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setSoundCloud(newValue);
    }
  };

  const handleSoundChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setSoundxyz(newValue);
    }
  };

  const handleTidalChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setTidal(newValue);
    }
  };

  const handleAmazonMusicChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setAmazonMusic(newValue);
    }
  };

  const handleBandcampChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setBandcamp(newValue);
    }
  };

  const handleDeezerChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setDeezer(newValue);
    }
  };

  const handlePandoraChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setPandora(newValue);
    }
  };

  const handleYouTubeMusicChange = (e: any) => {
    const newValue = e.target.value;
    if (validateInput(newValue)) {
        setYouTubeMusic(newValue);
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
            <button 
              className="btn btn-primary btn-sm btn-narrow"
              style={{margin:"0 2%"}}
              onClick={() => setEditing(true)}>
              Edit
            </button>
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
            {user.soundxyz && <a href={"https://sound.xyz/" + user.soundxyz } target="_blank" style={{marginRight:"10px", display:"inline-block"}}><img src="/soundxyz.png" width={16}/></a>}
            
            <br></br>
            {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
            
            <br></br>

            {/* Premium Sign Up */}
            {/* {!user.hasAccess &&
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                🚀 Unlock Premium Features
              </div>
              <div className="text-xs text-blue-600 mb-3">
                • Advanced Styling Features<br/>
                • Advanced QR Code Generator<br/>
                • More Release Pages + 30 QR codes limit<br/>
                • Connect to Printify and link your Merch<br/>
              </div>
             <ButtonCheckout
                mode="subscription"
                priceId={config.stripe.plans[1].priceId} 
              />
            </div>
            } */}
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
          <input type="text" className="input mb-2 w-3/4" required placeholder={user?.name || "enter your name"} onChange={(e) => handleNameChange(e)}/>
          <br />
          <label style={{display:"block"}}>Username</label>
          <input type="text" className="input mb-2 w-3/4" required placeholder={user?.username || "enter your username"} onChange={(e) => handleUserNameChange(e)}/>
          <br />
          <label style={{display:"block"}}>Location</label> 
          <input type="text" className="input mb-2 w-3/4" placeholder={user?.location || "Enter Your Location"} onChange={(e) => handleLocationChange(e)} />
          <br />
          <label style={{display:"block"}}>Website</label> 
          <input type="text" className="input mb-2 w-3/4" placeholder={user?.website || "Website Link"} onChange={(e) => handleWebsiteChange(e)} />
          <br />
          <label style={{display:"block"}}>Bio</label> 
          <input type="text" className="input mb-2 w-3/4" placeholder={user?.bio || "Describe Yourself"} onChange={(e) => handleBioChange(e)} />
          <br />
          <label style={{display:"block"}}>Email</label>
          <p className="text-sm mb-2">{user?.email}</p>
          <label style={{display:"block"}}>
            <input 
              type="checkbox" 
              className="mr-2" 
              checked={displayEmail} 
              onChange={(e) => setDisplayEmail(e.target.checked)} 
            /> 
            Display Email
          </label>
          <br />

          <h1>Socials</h1>
          <div className="flex flex-wrap w-full">
            <div className="w-full lg:w-1/2 p-2">
              <label style={{display:"block"}}>Instagram</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.instagram || "handle"} onChange={(e) => handleInstagramChange(e)} />
            
              <label style={{display:"block"}}>Twitter(X)</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.twitter || "handle"} onChange={(e) => handleTwitterChange(e)} />
            
              <label style={{display:"block"}}>FaceBook</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.facebook || "link"} onChange={(e) => handleFacebookChange(e)} />
              
              <label style={{display:"block"}}>LinkedIn</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.linkedin || "handle"} onChange={(e) => handleLinkedInChange(e)} />
              
              <label style={{display:"block"}}>Etsy</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.etsy || "handle"} onChange={(e) => handleEtsyChange(e)} />
              
              <label style={{display:"block"}}>Patreon</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.patreon || "handle"} onChange={(e) => handlePatreonChange(e)} />
            </div>
            <div className="w-full lg:w-1/2 p-2">
            <label style={{display:"block"}}>TikTok</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.tiktok || "handle"} onChange={(e) => handleTikTokChange(e)} />
              <br />
              <label>YouTube</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.youtube || "handle"} onChange={(e) => handleYouTubeChange(e)} />
              <br />
              <label>Telegram</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.telegram || "handle"} onChange={(e) => handleTelegramChange(e)} />
              <br />
              <label  style={{display:"block"}}>GitHub</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.github || "handle"} onChange={(e) => handleGithubChange(e)} />
              <br />
              <label>SubStack</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.substack || "handle"} onChange={(e) => handleSubstackChange(e)} />
              <br />
            </div>
          </div>
          <h1 style={{display:"inline"}}>Listen</h1>
          {!isEditingStreaming &&  <button 
            type="button"
            className="btn btn-alert btn-sm btn-narrow ml-2"
            style={{ width: "auto", display: "inline"}}
            onClick={() => setEditingStreaming(true)}> {/* Changed to setEditing(false) to handle cancel */}
            Edit Streaming Links  
          </button> }
          <br></br>
          {isEditingStreaming && <div className="flex flex-wrap w-full">
            <div className="w-full sm:w-1/2 p-2">
              <label  style={{display:"block"}}>Spotify</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.spotify || "Spotify URI"} onChange={(e) => handleSpotifyChange(e)} />
              <br />
              <label>Apple Music</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.appleMusic || "Artist ID"} onChange={(e) => handleAppleMusicChange(e)} />
              <br />
              <label>YouTube Music</label>   <br />
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.youtubeMusic || "Channel ID"} onChange={(e) => handleYouTubeMusicChange(e)} />
              <br />
              <label>Amazon Music</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.amazonMusic || "Artist ID"} onChange={(e) => handleAmazonMusicChange(e)} />
              <br />
              <label>Bandcamp</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.bandcamp || "link"} onChange={(e) => handleBandcampChange(e)} />
              <br />
            </div>
            <div className="w-full sm:w-1/2 p-2">
              <label>Soundcloud</label>   <br />
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.soundcloud || "handle"} onChange={(e) => handleSoundcloudChange(e)} />
              <br />
              <label>Tidal</label> <br />
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.tidal || "Artist ID"} onChange={(e) => handleTidalChange(e)} />
              <br />
              <label>Pandora</label>   <br />
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.pandora || "Artist ID"} onChange={(e) => handlePandoraChange(e)} />
              <br />
              <label style={{display:"block"}}>Deezer</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.deezer || "Artist ID"} onChange={(e) => handleDeezerChange(e)} />
              <br />
              <label>Sound.xyz</label> 
              <input type="text" className="input mb-2 w-3/4" placeholder={user?.soundxyz || "handle"} onChange={(e) => handleSoundChange(e)} />
              <br />
            </div>
          </div>}
          {alert && <div className="alert mt-5 w-100" style={{backgroundColor:"darkred", border:"1px darkred solid"}}>{alert}</div>}
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
          onClick={() => setEditing(false)}> {/* Changed to setEditing(false) to handle cancel */}
          Cancel
        </button>
        </form>
        </div>
      </div>
      );
    }   
};

export default Profile;