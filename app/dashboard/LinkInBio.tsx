"use client"

import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import linkInBioSchema from "@/models/LinkInBio";
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";

const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const LinkInBio =  () => {
  const { data: session, status } = useSession();
  const [isEditing, setEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [location, setLocation] = useState("");
  const [logoImage, setLogoImage] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");

  // Assuming avatarImage is a File object
  const convertToBase64 = (avatarImage:any) => {
    if (avatarImage && avatarImage instanceof File) {
      const reader = new FileReader();

      reader.onload = function(event) {
        // Set the Base64 string to the state
        setLogoImage(event.target.result);
      };

      reader.onerror = function(error) {
        console.log('Error: ', error);
      };

      reader.readAsDataURL(avatarImage);
    } else {
      console.log('avatarImage is not a file');
    }
  };

  const handleEditLinkInBio = async (e:any) => {
    e.preventDefault();
    console.log('Edit Link In Bio');
    console.log(logoImage);
    console.log(formName);

    try {
      const { data } = await apiClient.post("/linkinbio", {
        name: formName,
        logoImage: logoImage,
        headerImage: headerImage,
        location: location,
        socials: [],
        streamingLinks: [],
        links:[]
      });

      console.log(data);
      setAlertt("Link In Bio updated successfully");
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } finally {
      setIsLoading(false);
      setEditing(false);
    }
  }

  const handleFileSelection = (e:any) => {
    if (e.target.files && e.target.files.length > 0) {
      // Update the state with the first selected file
      const img = convertToBase64(e.target.files[0]);
      setLogoImage(img);
    }
  };

  const handleNameChange = (e:any) => {
    console.log('handle Name Change')
   setFormName(e.target.value);
  }

  const handleLocationChange = (e:any) => {
    console.log('handle Email Change')
    setLocation(e.target.value);
  };

   // Check if user data is not yet loaded
  if (!session) {
    return <div>Thanks for signing up...</div>;
  }else{
    if (!isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>   
        <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{width:"22%", display:"inline", margin:"0 5%"}}
          onClick={() => setEditing(true)} >
          Edit
        </button>
        <img src={session.user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"15%"  }} alt="Avatar" />
        <p>{session.user.name}</p>
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
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>
      
       <img src={session.user.image} style={{ borderRadius: '50%', width:"15%" }} alt="Avatar" />
        <form>
          <label className="label">Replace Avatar</label>
          <input
              type="file"
              className="input mb-2 p-2 w-full"
              accept="image/*"
              onChange={(e) => handleFileSelection(e)}
            />

          <label>name</label>
          <input type="text" className="input mb-2 w-full" placeholder={session.user.name} onChange={(e) => handleNameChange(e)}/>
          <br />
          <label>email</label> 
          <input type="location" className="input mb-2 w-full" onChange={(e) => handleLocationChange(e)} />
          <br />
          <button 
            className="btn btn-primary btn-block btn-sm btn-narrow"
            style={{width:"35%", display:"inline", margin:"2% 0"}}
            onClick={(e) => handleEditLinkInBio(e)} 
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

export default LinkInBio;