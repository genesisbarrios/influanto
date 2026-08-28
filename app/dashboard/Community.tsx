"use client"

import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faTwitter, faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const Community = () => {
  const [users, setUsers] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");

  const getUsers = async () => {
    try {
      const { data } = await apiClient.get("/get-users");
      const filteredUsers = data.filter((user: any) => 
        user.name && (user.image || user.instagram || user.twitter || user.facebook || user.spotify || user.youtube) &&
        user.username &&
        user.username !== null &&
        user.username !== "" &&
        user.name !== null &&
        user.name !== "" &&
        user.bio !== null && 
        user.bio !== undefined &&
        user.bio !== ""   
      );
      setUsers(filteredUsers);
    } catch (e) {
      setAlertt(e?.message);
    }
  }

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    if (!users) {
      getUsers();
    }
  }, [users]);


    useEffect(() => {
      document.title = "Community | Influanto";

      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', 'Community | Influanto.');
      
      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', 'Community | Influanto');

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
      twitterTitle.setAttribute('content', 'Community | Influanto');

      // Update twitter:description
      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', 'The all in one music marketing tool.');
    }, []);

  if (!users) {
    return <div>Loading...</div>;
  } else if (users) {
    return (
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="w-full flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-2">Community</h2>
        </div>
        <br />

        <div className="grid grid-cols-3 gap-4">
          {users.map((user: any) => (
            <a key={user._id} href={`https://influanto.com/${user.username}`} target="_blank" rel="noopener noreferrer" className="block">
              <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                <div className="flex items-center space-x-4 mb-2">
                  <img
                    src={user.image || fallbackImageUrl}
                    alt={user.name}
                    width={50}
                    height={50}
                    className="rounded-full mr-2"
                  />
                  <h3 className="text-sm text-blue-500 font-semibold">{user.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">  {user.bio && user.bio.length > 60 ? user.bio.slice(0, 60) + "..." : user.bio}</p>
                <div className="flex justify-center space-x-3">
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
