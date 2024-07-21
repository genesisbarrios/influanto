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
  const [isEditing, setEditing] = useState(false);
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
  const [spotify, setSpotify] = useState("");
  const [tidal, setTidal] = useState("");
  const [amazonMusic, setAmazonMusic] = useState("");
  const [soundcloud, setSoundCloud] = useState("");
  const [deezer, setDeezer] = useState("");
  const [pandora, setPandora] = useState("");
  const [googlePlay, setGooglePlay] = useState("");
  const [patreon, setPatreon] = useState("");
  const [substack, setSubstack] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState(""); 
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
    setFacebook(e.target.value);
  };

  const handleYouTubeChange = (e:any) => {
    console.log('handle Facebook Change')
    setFacebook(e.target.value);
  };

  const handleTikTokChange = (e:any) => {
    console.log('handle Facebook Change')
    setFacebook(e.target.value);
  };

  const handleGithubChange = (e:any) => {
    console.log('handle Facebook Change')
    setFacebook(e.target.value);
  };

   // Check if user data is not yet loaded
  if (!session) {
    return <div>Thanks for signing up...</div>;
  }else{
    if (!isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Profile</h2>   
        <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{width:"22%", display:"inline", margin:"0 5%"}}
          onClick={() => setEditing(true)} >
          Edit
        </button>
        <img src={session.user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"15%"  }} alt="Avatar" />
        <p>{session.user.name}</p>
        <p>{session.user.email}</p>
        {alert && <div className="alert mt-5 w-1/2">{alert}</div>}
        <button 
            className="btn btn-danger btn-block btn-sm btn-narrow" 
            style={{width:"35%", display:"inline", margin:"5% 0 2% 0%", backgroundColor:"darkgrey"}}
            onClick={(e) => signOut()} >
            Sign Out
        </button>
      </div>
    );
  }else{
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Profile</h2>
      
       <img src={session.user.image} style={{ borderRadius: '50%', width:"15%" }} alt="Avatar" />
        <form>
          <label className="label">Replace Avatar</label>
          <input
              type="file"
              className="input mb-2 p-2 w-full"
              accept="image/*"
              onChange={(e) => handleFileSelection(e)}
            />

          <label>Name</label>
          <input type="text" className="input mb-2 w-full" placeholder={session.user.name} onChange={(e) => handleNameChange(e)}/>
          <br />
          <label>E-Mail</label> 
          <input type="email" className="input mb-2 w-full" placeholder={session.user.email} onChange={(e) => handleEmailChange(e)} />
          <br />
          <label>Location</label> 
          <input type="text" className="input mb-2 w-full" placeholder={location} onChange={(e) => handleLocationChange(e)} />
          <br />
          <h1>Socials</h1>
          <label>Instagram</label> 
          <input type="text" className="input mb-2 w-full" placeholder={instagram} onChange={(e) => handleInstagramChange(e)} />
          <br />
          <label>Twitter(X)</label> 
          <input type="text" className="input mb-2 w-full" placeholder={twitter} onChange={(e) => handleTwitterChange(e)} />
          <br />
          <label>FaceBook</label> 
          <input type="text" className="input mb-2 w-full" placeholder={facebook} onChange={(e) => handleFacebookChange(e)} />
          <br />
          <label>LinkedIn</label> 
          <input type="text" className="input mb-2 w-full" placeholder={linkedin} onChange={(e) => handleLinkedInChange(e)} />
          <br />
          <label>YouTube</label> 
          <input type="text" className="input mb-2 w-full" placeholder={youtube} onChange={(e) => handleYouTubeChange(e)} />
          <br />
          <label>TikTok</label> 
          <input type="text" className="input mb-2 w-full" placeholder={tiktok} onChange={(e) => handleTikTokChange(e)} />
          <br />
          <label>GitHub</label> 
          <input type="text" className="input mb-2 w-full" placeholder={github} onChange={(e) => handleGithubChange(e)} />
          <br />
          <button 
            className="btn btn-primary btn-block btn-sm btn-narrow"
            style={{width:"35%", display:"inline", margin:"2% 0"}}
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
  }
};

export default Profile;