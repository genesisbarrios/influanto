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

const Community =  () => {
  const [users, setUsers] = useState<any>();

  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");
  
  const getUsers = async () => {
    try {
      const { data } = await apiClient.get("/get-users");
      console.log(data);
      const filteredUsers = data.filter((user: any) => user.name && (user.bio || user.image || user.instagram || user.twitter || user.facebook || user.spotify || user.youtube));
      setUsers(filteredUsers);
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
   if(!users){
    getUsers();
   }else{
    //console.log("user:");
    //console.log(user);
   }
  }, [users]);
   // Check if user data is not yet loaded
  if (!users) {
    return <div>Loading...</div>;
  }else if (users){
    return (
     
      <div className="p-4 bg-white shadow rounded-md text-black">
         <div className="w-full flex justify-between items-center">
            <h2 className="text-2xl font-bold mb-2">Community</h2>
          </div>
          <br></br>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map((user:any) => (
           <a key={user._id} href={`https://influanto.com/${user.username}`} target="_blank" rel="noopener noreferrer" className="block">
           <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
             <img
               src={user.image || fallbackImageUrl}
               alt={user.name}
               width={50}
               height={50}
               className="rounded-full mx-auto mb-2"
             />
             <h3 className="text-sm font-semibold">{user.name}</h3>
             <p className="text-xs text-gray-600">{user.bio || "No bio available"}</p>
             <div className="flex justify-center space-x-3 mt-2">
               {user.instagram && (
                 <a href={user.instagram} target="_blank" rel="noopener noreferrer">
                   <FontAwesomeIcon icon={faInstagram} className="text-pink-500" />
                 </a>
               )}
               {user.twitter && (
                 <a href={user.twitter} target="_blank" rel="noopener noreferrer">
                   <FontAwesomeIcon icon={faTwitter} className="text-blue-400" />
                 </a>
               )}
               {user.facebook && (
                 <a href={user.facebook} target="_blank" rel="noopener noreferrer">
                   <FontAwesomeIcon icon={faFacebook} className="text-blue-600" />
                 </a>
               )}
               {user.spotify && (
                 <a href={user.spotify} target="_blank" rel="noopener noreferrer">
                   <FontAwesomeIcon icon={faSpotify} className="text-green-500" />
                 </a>
               )}
               {user.youtube && (
                 <a href={user.youtube} target="_blank" rel="noopener noreferrer">
                   <FontAwesomeIcon icon={faYoutube} className="text-red-500" />
                 </a>
               )}
             </div>
           </div>
         </a>
          ))}
        </div>
        </div>
    );
  }
};

export default Community;