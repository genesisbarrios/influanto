
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import React, { useEffect, useState } from 'react';

import { useSession, signOut } from "next-auth/react";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";

// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string; // Assuming there's an avatar URL you want to display
}



const Profile =  () => {
  const { data: session, status } = useSession();
  const [isEditing, setEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  // useEffect(() => {
  //   console.log('gfetch user');
  //   fetchUser();
  // }, []);

  
   // Check if user data is not yet loaded
  if (!session) {
    return <div>Thanks for signing up...</div>;
  }else{
    if (!isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>   
        <p>Coming Soon...</p>
        <a
          href="/profile"
          className="btn btn-alert btn-block btn-sm btn-narrow"
          style={{ width: "25%", display: "inline mt-5" }}>
          Setup Your Profile
        </a>
        {/* <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{width:"10%", display:"inline", margin:"0 5%"}}
          onClick={() => setEditing(true)} >
          Edit
        </button>
        <img src={session.user.image} style={{ borderRadius: '50%' }} alt="Avatar" />
        <p>{session.user.name}</p>
        <p>{session.user.email}</p> */}
       
      </div>
    );
  }else{
    return (
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>
        <button
          className="btn btn-alert btn-block btn-sm btn-narrow"
          style={{ width: "15%", display: "inline", margin: "0 5%" }}
          onClick={() => setEditing(false)}> {/* Changed to setEditing(false) to handle cancel */}
          Cancel
        </button>
        <img src={session.user.image} style={{ borderRadius: '50%' }} alt="Avatar" />
        <form>
          <label className="label">Replace Avatar</label>
          <input
              type="file"
              className="input mb-2 p-2 w-full"
              accept="image/*"
              onChange={(e) => {/* Handle file selection */}}
            />

          <label>name</label><input type="text" className="input mb-2 w-full" value={session.user.name} onChange={(e) => {/* Handle name change */}} />
          <br />
          <label>email</label> <input type="email" className="input mb-2 w-full" value={session.user.email} onChange={(e) => {/* Handle email change */}} />
          <br />
          <button 
            className="btn btn-primary btn-block btn-sm btn-narrow"
            style={{width:"10%", display:"inline", margin:"0 5%"}}
            
            type="submit">
            Edit
        </button>
        </form>
      </div>
    );
  }
}

 
};

export default Profile;