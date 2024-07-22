"use client"

import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";

const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const Profile =  () => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>();

  const [isEditing, setEditing] = useState(false);
  const [isEditingStreaming, setEditingStreaming] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [avatarImage, setAvatarImage] = useState(null);
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

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");
  
  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      console.log(data);
      setUser(data.data);
  
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
   if(!user){
    getUser();
   }
  }, [user]);
  
  // Assuming avatarImage is a File object
  const convertToBase64 = (avatarImage:any) => {
    if (avatarImage && avatarImage instanceof File) {
      const reader = new FileReader();

      reader.onload = function(event) {
        // Set the Base64 string to the state
        setAvatarImage(event.target.result);
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
    console.log(session.user.image);
    console.log(avatarImage);
    console.log(formName);
    console.log(formEmail);
    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/user", {
        email: formEmail,
        name: formName,
        image: avatarImage
      });

      console.log(data);
      setAlertt("Loading.. Updating Your Profile..");
    
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } finally {
      setIsLoading(false);
      setEditing(false);
      setAlertt("Profile updated successfully");
    }

  }
    
  const handleFileSelection = (e:any) => {
    if (e.target.files && e.target.files.length > 0) {
      // Update the state with the first selected file
      const avatar = convertToBase64(e.target.files[0]);
      setAvatarImage(avatar);
    }
  };

  const handleNameChange = (e:any) => {
    console.log('handle Name Change')
   setFormName(e.target.value);
  }

  const handleEmailChange = (e:any) => {
    console.log('handle Email Change')
    setFormEmail(e.target.value);
  };

  const handleWebsiteChange = (e:any) => {
    console.log('handle Email Change')
    setWebsite(e.target.value);
  };

  const handleBioChange = (e:any) => {
    console.log('handle Email Change')
    setBio(e.target.value);
  };

  const handleLocationChange = (e:any) => {
    console.log('handle Location Change')
    setLocation(e.target.value);
  };

  const handleInstagramChange = (e:any) => {
    console.log('handle Instagram Change')
    setInstagram(e.target.value);
  };

  const handleTwitterChange = (e:any) => {
    console.log('handle Twitter Change')
    setTwitter(e.target.value);
  };

  const handleFacebookChange = (e:any) => {
    console.log('handle Facebook Change')
    setFacebook(e.target.value);
  };

  const handleLinkedInChange = (e:any) => {
    console.log('handle Facebook Change')
    setLinkedIn(e.target.value);
  };

  const handleYouTubeChange = (e:any) => {
    console.log('handle Facebook Change')
    setYouTube(e.target.value);
  };

  const handleTikTokChange = (e:any) => {
    console.log('handle Facebook Change')
    setTikTok(e.target.value);
  };

  const handleGithubChange = (e:any) => {
    console.log('handle Facebook Change')
    setGithub(e.target.value);
  };

  const handleEtsyChange = (e:any) => {
    console.log('handle Email Change')
    setEtsy(e.target.value);
  };

  const handlePatreonChange = (e:any) => {
    console.log('handle Email Change')
    setPatreon(e.target.value);
  };

  const handleTelegramChange = (e:any) => {
    console.log('handle Email Change')
    setTelegram(e.target.value);
  };
  
  const handleSubstackChange = (e:any) => {
    console.log('handle Email Change')
    setSubstack(e.target.value);
  };

  const handleSpotifyChange = (e:any) => {
    console.log('handle Email Change')
    setSpotify(e.target.value);
  };
  
  const handleAppleMusicChange = (e:any) => {
    console.log('handle Email Change')
    setAppleMusic(e.target.value);
  };

  const handleSoundcloudChange = (e:any) => {
    console.log('handle Email Change')
    setSoundCloud(e.target.value);
  };
  
  const handleSoundChange = (e:any) => {
    console.log('handle Email Change')
    setSoundxyz(e.target.value);
  };

  const handleTidalChange = (e:any) => {
    console.log('handle Email Change')
    setTidal(e.target.value);
  };
  
  const handleAmazonMusicChange = (e:any) => {
    console.log('handle Email Change')
    setAmazonMusic(e.target.value);
  };

  const handleBandcampChange = (e:any) => {
    console.log('handle Email Change')
    setBandcamp(e.target.value);
  };

  const handleDeezerChange = (e:any) => {
    console.log('handle Email Change')
    setDeezer(e.target.value);
  };
  
  const handlePandoraChange = (e:any) => {
    console.log('handle Email Change')
    setPandora(e.target.value);
  };

  const handleYouTubeMusicChange = (e:any) => {
    console.log('handle Email Change')
    setYouTubeMusic(e.target.value);
  };

   // Check if user data is not yet loaded
  if (!session || !user) {
    return <div>Thanks for signing up...</div>;
  }else if (session && user && !isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Profile</h2>   
        <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{width:"22%", display:"inline", margin:"0 5%"}}
          onClick={() => setEditing(true)} >
          Edit
        </button>
        <img src={user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"15%"  }} alt="Avatar" />
        <p>{user.name}</p>
        <p>{user.email}</p>
        <p>{user.location}</p>
        <p>{user.website}</p>
        <p>{user.bio}</p>
        {alert && <div className="alert mt-5 w-1/2">{alert}</div>}
        <button 
            className="btn btn-danger btn-block btn-sm btn-narrow" 
            style={{width:"35%", display:"inline", margin:"5% 0 2% 0%", backgroundColor:"darkgrey"}}
            onClick={(e) => signOut()} >
            Sign Out
        </button>
      </div>
    );
  }else if (session && user && isEditing){
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Profile</h2>
      
       <img src={user.image} style={{ borderRadius: '50%', width:"15%" }} alt="Avatar" />
        <form>
          <label className="label">Replace Avatar</label>
          <input
              type="file"
              className="input mb-2 p-2 w-full"
              accept="image/*"
              onChange={(e) => handleFileSelection(e)}
            />

          <label>Name</label>
          <input type="text" className="input mb-2 w-full" placeholder={user.name || "enter your name"} onChange={(e) => handleNameChange(e)}/>
          <br />
          <label>E-Mail</label> 
          <input type="email" className="input mb-2 w-full" placeholder={user.email} onChange={(e) => handleEmailChange(e)} />
          <br />
          <label>Location</label> 
          <input type="text" className="input mb-2 w-full" placeholder={user.location || "Enter Your Location"} onChange={(e) => handleLocationChange(e)} />
          <br />
          <label>Website</label> 
          <input type="text" className="input mb-2 w-full" placeholder={user.website || "Enter Your Website"} onChange={(e) => handleWebsiteChange(e)} />
          <br />
          <label>Bio</label> 
          <input type="text" className="input mb-2 w-full" placeholder={user.bio || "Describe Yourself"} onChange={(e) => handleBioChange(e)} />
          <br />

          <h1>Socials</h1>
          <div className="w-full flex">
            <div className="w-1/2 p-2">
              <label>Instagram</label> 
              <input type="text" className="input mb-2" placeholder={user.instagram || "handle"} onChange={(e) => handleInstagramChange(e)} />
              <br />
              <label>Twitter(X)</label> 
              <input type="text" className="input mb-2" placeholder={user.twitter || "handle"} onChange={(e) => handleTwitterChange(e)} />
              <br />
              <label>FaceBook</label> 
              <input type="text" className="input mb-2" placeholder={user.facebook || "link"} onChange={(e) => handleFacebookChange(e)} />
              <br />
              <label>LinkedIn</label> 
              <input type="text" className="input mb-2" placeholder={user.linkedin || "handle"} onChange={(e) => handleLinkedInChange(e)} />
              <br />
              <label>Etsy</label>   <br />
              <input type="text" className="input mb-2" placeholder={user.etsy || "handle"} onChange={(e) => handleEtsyChange(e)} />
              <br />
              <label>Patreon</label> 
              <input type="text" className="input mb-2" placeholder={user.patreon || "handle"} onChange={(e) => handlePatreonChange(e)} />
              <br />
            </div>
            <div className="w-1/2 p-2">
              <label>TikTok</label> 
              <input type="text" className="input mb-2" placeholder={user.tiktok || "handle"} onChange={(e) => handleTikTokChange(e)} />
              <br />
              <label>YouTube</label> 
              <input type="text" className="input mb-2" placeholder={user.youtube || "handle"} onChange={(e) => handleYouTubeChange(e)} />
              <br />
              <label>Telegram</label> 
              <input type="text" className="input mb-2" placeholder={user.telegram || "handle"} onChange={(e) => handleTelegramChange(e)} />
              <br />
              <label>GitHub</label> 
              <input type="text" className="input mb-2" placeholder={user.github || "handle"} onChange={(e) => handleGithubChange(e)} />
              <br />
              <label>SubStack</label> 
              <input type="text" className="input mb-2" placeholder={user.substack || "handle"} onChange={(e) => handleSubstackChange(e)} />
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
          {isEditingStreaming && <div className="w-full flex">
            <div className="w-1/2 p-2">
              <label>Spotify</label> 
              <input type="text" className="input mb-2" placeholder={user.spotify || "Spotify URI"} onChange={(e) => handleSpotifyChange(e)} />
              <br />
              <label>Apple Music</label> 
              <input type="text" className="input mb-2" placeholder={user.appleMusic || "Apple Music ID"} onChange={(e) => handleAppleMusicChange(e)} />
              <br />
              <label>YouTube Music</label>   <br />
              <input type="text" className="input mb-2" placeholder={user.youtubeMusic || "handle"} onChange={(e) => handleYouTubeMusicChange(e)} />
              <br />
              <label>Amazon Music</label> 
              <input type="text" className="input mb-2" placeholder={user.amazonMusic || "handle"} onChange={(e) => handleAmazonMusicChange(e)} />
              <br />
              <label>Bandcamp</label> 
              <input type="text" className="input mb-2" placeholder={user.bandcamp || "handle"} onChange={(e) => handleBandcampChange(e)} />
              <br />
            </div>
            <div className="w-1/2 p-2">
              <label>Soundcloud</label>   <br />
              <input type="text" className="input mb-2" placeholder={user.soundcloud || "handle"} onChange={(e) => handleSoundcloudChange(e)} />
              <br />
              <label>Tidal</label> 
              <input type="text" className="input mb-2" placeholder={user.tidal || "handle"} onChange={(e) => handleTidalChange(e)} />
              <br />
              <label>Pandora</label>   <br />
              <input type="text" className="input mb-2" placeholder={user.pandora || "handle"} onChange={(e) => handlePandoraChange(e)} />
              <br />
              <label>Deezer</label> 
              <input type="text" className="input mb-2" placeholder={user.deezer || "handle"} onChange={(e) => handleDeezerChange(e)} />
              <br />
              <label>Sound.xyz</label> 
              <input type="text" className="input mb-2" placeholder={user.soundxyz || "handle"} onChange={(e) => handleSoundChange(e)} />
              <br />
            </div>
          </div>}
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
      );
    }   
};

export default Profile;