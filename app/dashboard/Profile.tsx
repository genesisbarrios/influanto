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
import { faGlobe, faLocation } from "@fortawesome/free-solid-svg-icons";
import { set } from "mongoose";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const Profile =  () => {
  const [user, setUser] = useState<any>();

  const [isEditing, setEditing] = useState(false);
  const [isEditingStreaming, setEditingStreaming] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUserName, setFormUserName] = useState("");
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
      console.log(data.email);
      setAvatarImage(data.image);
      setFormName(data.name);
      setFormEmail(data.email);
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
    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/user", {
        name: formName,
        username: formUserName,
        image: avatarImage,
        location: location,
        website: website,
        bio: bio,
        instagram: instagram,
        twitter: twitter,
        facebook: facebook,
        linkedin: linkedin,
        youtube: youtube,
        tiktok: tiktok,
        github: github,
        patreon: patreon,
        substack: substack,
        telegram: telegram,
        etsy: etsy,
        spotify: spotify,
        appleMusic: appleMusic,
        tidal: tidal,
        amazonMusic: amazonMusic,
        soundcloud: soundcloud,
        deezer: deezer,
        pandora: pandora,
        youtubeMusic: youtubeMusic,
        bandcamp: bandcamp,
        soundxyz: soundxyz,
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
      console.log(avatar);
      setAvatarImage(avatar);
    }
  };

  const handleNameChange = (e:any) => {
    console.log('handle Name Change')
   setFormName(e.target.value);
  }

  const handleUserNameChange = (e:any) => {
    console.log('handle UserName Change')
    setFormUserName(e.target.value);
  }

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
  if (!user) {
    return <div>Loading...</div>;
  }else if (user && !isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-md text-black">
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
            <img src={user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline", marginBottom:"2%"}} alt="Avatar" />
            <p>{user.name}</p>
            <p>{user.username}</p>
            <p>{user.email}</p>
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
            <button 
                className="btn btn-danger btn-block btn-sm btn-narrow" 
                style={{width:"35%", display:"inline", margin:"2% 0 2% 0%", backgroundColor:"darkgrey", borderColor:"darkgrey"}}
                onClick={(e) => signOut()} >
                Sign Out
            </button>
          </div>
        </div>
    );
  }else if (isEditing){
    return (
      <div className="p-4 bg-white shadow rounded-md ">
        <div className="w-full flex flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 inline">Profile</h2>
        <br></br>
       
        <form>
         <img src={user.image} style={{ borderRadius: '50%', width:"75px", height:"75px", display:"inline"}} alt="Avatar" />
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
          <input type="text" className="input mb-2 sm:w-full" required placeholder={user?.name || "enter your name"} onChange={(e) => handleNameChange(e)}/>
          <br />
          <label style={{display:"block"}}>Username</label>
          <input type="text" className="input mb-2 sm:w-full" required placeholder={user?.username || "enter your username"} onChange={(e) => handleUserNameChange(e)}/>
          <br />
          <label style={{display:"block"}}>Location</label> 
          <input type="text" className="input mb-2 sm:w-full" placeholder={user?.location || "Enter Your Location"} onChange={(e) => handleLocationChange(e)} />
          <br />
          <label style={{display:"block"}}>Website</label> 
          <input type="text" className="input mb-2 sm:w-full" placeholder={user?.website || "Website Link"} onChange={(e) => handleWebsiteChange(e)} />
          <br />
          <label style={{display:"block"}}>Bio</label> 
          <input type="text" className="input mb-2 m:w-full" placeholder={user?.bio || "Describe Yourself"} onChange={(e) => handleBioChange(e)} />
          <br />

          <h1>Socials</h1>
          <div className="flex flex-wrap w-full">
            <div className="w-full lg:w-1/2 p-2">
              <label style={{display:"block"}}>Instagram</label> 
              <input type="text" className="input mb-2" placeholder={user?.instagram || "handle"} onChange={(e) => handleInstagramChange(e)} />
            
              <label style={{display:"block"}}>Twitter(X)</label> 
              <input type="text" className="input mb-2" placeholder={user?.twitter || "handle"} onChange={(e) => handleTwitterChange(e)} />
            
              <label style={{display:"block"}}>FaceBook</label> 
              <input type="text" className="input mb-2" placeholder={user?.facebook || "link"} onChange={(e) => handleFacebookChange(e)} />
              
              <label style={{display:"block"}}>LinkedIn</label> 
              <input type="text" className="input mb-2" placeholder={user?.linkedin || "handle"} onChange={(e) => handleLinkedInChange(e)} />
              
              <label style={{display:"block"}}>Etsy</label>   <br />
              <input type="text" className="input mb-2" placeholder={user?.etsy || "handle"} onChange={(e) => handleEtsyChange(e)} />
              
              <label style={{display:"block"}}>Patreon</label> 
              <input type="text" className="input mb-2" placeholder={user?.patreon || "handle"} onChange={(e) => handlePatreonChange(e)} />
            </div>
            <div className="w-full lg:w-1/2 p-2">
              <label>TikTok</label> 
              <input type="text" className="input mb-2" placeholder={user?.tiktok || "handle"} onChange={(e) => handleTikTokChange(e)} />
              <br />
              <label>YouTube</label> 
              <input type="text" className="input mb-2" placeholder={user?.youtube || "handle"} onChange={(e) => handleYouTubeChange(e)} />
              <br />
              <label>Telegram</label> 
              <input type="text" className="input mb-2" placeholder={user?.telegram || "handle"} onChange={(e) => handleTelegramChange(e)} />
              <br />
              <label>GitHub</label> 
              <input type="text" className="input mb-2" placeholder={user?.github || "handle"} onChange={(e) => handleGithubChange(e)} />
              <br />
              <label>SubStack</label> 
              <input type="text" className="input mb-2" placeholder={user?.substack || "handle"} onChange={(e) => handleSubstackChange(e)} />
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
              <label>Spotify</label> 
              <input type="text" className="input mb-2" placeholder={user?.spotify || "Spotify URI"} onChange={(e) => handleSpotifyChange(e)} />
              <br />
              <label>Apple Music</label> 
              <input type="text" className="input mb-2" placeholder={user?.appleMusic || "Artist ID"} onChange={(e) => handleAppleMusicChange(e)} />
              <br />
              <label>YouTube Music</label>   <br />
              <input type="text" className="input mb-2" placeholder={user?.youtubeMusic || "Channel ID"} onChange={(e) => handleYouTubeMusicChange(e)} />
              <br />
              <label>Amazon Music</label> 
              <input type="text" className="input mb-2" placeholder={user?.amazonMusic || "Artist ID"} onChange={(e) => handleAmazonMusicChange(e)} />
              <br />
              <label>Bandcamp</label> 
              <input type="text" className="input mb-2" placeholder={user?.bandcamp || "link"} onChange={(e) => handleBandcampChange(e)} />
              <br />
            </div>
            <div className="w-full sm:w-1/2 p-2">
              <label>Soundcloud</label>   <br />
              <input type="text" className="input mb-2" placeholder={user?.soundcloud || "handle"} onChange={(e) => handleSoundcloudChange(e)} />
              <br />
              <label>Tidal</label> 
              <input type="text" className="input mb-2" placeholder={user?.tidal || "Artist ID"} onChange={(e) => handleTidalChange(e)} />
              <br />
              <label>Pandora</label>   <br />
              <input type="text" className="input mb-2" placeholder={user?.pandora || "Artist ID"} onChange={(e) => handlePandoraChange(e)} />
              <br />
              <label>Deezer</label> 
              <input type="text" className="input mb-2" placeholder={user?.deezer || "Artist ID"} onChange={(e) => handleDeezerChange(e)} />
              <br />
              <label>Sound.xyz</label> 
              <input type="text" className="input mb-2" placeholder={user?.soundxyz || "handle"} onChange={(e) => handleSoundChange(e)} />
              <br />
            </div>
          </div>}
          {alert && <div className="alert mt-5 w-1/2">{alert}</div>}
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