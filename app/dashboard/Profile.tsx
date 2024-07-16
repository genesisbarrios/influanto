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
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      const { data } = await apiClient.post("/user", {
        email: formEmail,
        name: formName,
        image: avatarImage
      });

      console.log(data);
    } catch (e) {
      console.error(e?.message);
    } finally {
      setIsLoading(false);
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
        <img src={session.user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%' }} alt="Avatar" />
        <p>{session.user.name}</p>
        <p>{session.user.email}</p>
        <button 
            className="btn btn-danger btn-block btn-sm btn-narrow" 
            style={{width:"35%", display:"inline", margin:"10% 0 2% 0%", backgroundColor:"darkgrey"}}
            onClick={(e) => signOut()} >
            Sign Out
        </button>
      </div>
    );
  }else{
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Profile</h2>
      
       <img src={session.user.image} style={{ borderRadius: '50%', width:"50%" }} alt="Avatar" />
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
          <input type="email" className="input mb-2 w-full" placeholder={session.user.email} onChange={(e) => handleEmailChange(e)} />
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