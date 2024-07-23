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
  const [user, setUser] = useState<any>();
  const [links, setLinks] = useState<any>();
  const [isEditing, setEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [location, setLocation] = useState("");
  const [logoImage, setLogoImage] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");

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

  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      console.log(data);
      console.log(data.email);
      setFormName(data.name);
      setLocation(data.location);
      setUser(data);
  
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

  const getLinks = async () => {
    try {
      const { data } = await apiClient.get("/get-linkinbio");
      console.log(data);
      setLinks(data);
  
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

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
        headerImage: headerImage,
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


   // Check if user data is not yet loaded
  if (!user) {
    return <div>Thanks for signing up...</div>;
  }else{
    if (!isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-md">
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>   
        {/* <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{width:"22%", display:"inline", margin:"0 5%"}}
          onClick={() => setEditing(true)} >
          Edit
        </button> */}
        <img src={user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"100px", height:"100px" }} alt="Avatar" />
        <p>{user.name}</p>

        <p className="mt-5 mb-5">custom links coming very soon..</p>
         <a 
          className="btn btn-primary btn-block btn-lg btn-narrow"
          style={{width:"auto", display:"inline"}}
          href={"https://influanto.com/" + user.name} >
          Visit Your Link In Bio
        </a>
        {alert && <div className="alert mt-5 w-1/2">{alert}</div>}
      </div>
    );
  }else{
    return (
      <div className="p-4 bg-white shadow rounded-md">
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>
      
       <img src={user.image} style={{ borderRadius: '50%', width:"100px", height:"100px" }} alt="Avatar" />
        <form>
          <label className="label">Replace Header</label>
          <input
              type="file"
              className="input mb-2 p-2 w-full"
              accept="image/*"
              onChange={(e) => handleFileSelection(e)}
            />

          <label>name</label>
          <input type="text" className="input mb-2 w-full" placeholder={user.name} onChange={(e) => handleNameChange(e)}/>
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