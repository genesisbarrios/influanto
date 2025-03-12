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
import Head from 'next/head';
import { text } from "stream/consumers";
import { CldUploadWidget } from 'next-cloudinary';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const LinkInBio =  () => {
  const {data, status} = useSession();
  const [user, setUser] = useState<any>();
  const [bgColor, setBgColor] = useState<any>();
  const [textColor, setTextColor] = useState <any>();
  const [linksColor, setLinksColor] = useState <any>();
  const [linkInBio, setLinkInBio] = useState<any>();
  const [links, setLinks] = useState<any[]>([
    { url: "", name: "" }
  ]);

  const [isEditing, setEditing] = useState(false);
  const [location, setLocation] = useState("");
  const [logoImage, setLogoImage] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");

  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      console.log(data);
      console.log(data.email);
      setUser(data);
  
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

  const addLink = () => {
    setLinks([...links, { url: "", name: "" }]);
  };

  const updateLink = (index:number, field:any, value:any) => {
      const newLinks = [...links];
      newLinks[index][field] = value;
      setLinks(newLinks);
      console.log(newLinks);
  };

  const removeLink = (index:number) => {
      const newLinks = links.filter((_:any, i:any) => i !== index);
      setLinks(newLinks);
  };

  const updateImage = (index: number, imageUrl: string) => {
    const newLinks = [...links];
    newLinks[index].image = imageUrl;
    setLinks(newLinks);
  };

  const handleImageUpload = (index: number, result: any) => {
    const imageUrl = result.info.secure_url;
    updateImage(index, imageUrl);
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    getLinks();
  }, []);

  useEffect(() => {
    
  }, [links]);


  const getLinks = async () => {
    try {
      const { data } = await apiClient.get("/get-links");
      setLinkInBio(data);
      setBgColor(data.bgColor);
      setTextColor(data.textColor);
      setLinksColor(data.linksColor);
      setLinks(data.links)
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
    console.log(links);

    try {
      const { data } = await apiClient.post("/linkinbio", {
        bgColor: bgColor,
        textColor: textColor,
        linksColor: linksColor,
        links: links
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

  const containerStyle = {
    width: "100%",
    maxWidth: "400px", // Limit width on larger screens
    margin: "0 auto", // Center the container
    padding: "10px", // Add padding to prevent content from touching edges
  };
  

   // Check if user data is not yet loaded
  if (!data) {
    return <div>Thanks for signing up...</div>;
  }else{
    if (!isEditing){
    return (
      <>
      <Head>
        <title>Influanto | FREE Link In Bio Tool</title>
        <meta name="description" content="FREE Link In Bio Tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="FREE Link In Bio Tool" />
        <meta property="og:description" content="Generate and manage your Link In Bio easily." />
        <meta name="twitter:title" content="Link In Bio Tool" />
        <meta name="twitter:description" content="Generate and manage your Link In Bio easily." />
      </Head>
      <div className="p-4 bg-white shadow rounded-md text-black">
         <div className="w-full flex justify-between items-center">
            <h2 className="text-2xl font-bold mb-2">Link In Bio</h2>
            <button 
              className="btn btn-primary btn-sm btn-narrow"
              style={{margin:"0 2%"}}
              onClick={() => setEditing(true)}>
              Edit
            </button>
          </div>
          <br></br>
        <div style={{margin:"0 auto", textAlign:"center", color: textColor }}>
          <img src={data.user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline" }} alt="Avatar" />
          <p>{data.user.name}</p>
          <br></br>
          {links && user && (
            <div>
                {links.map((link:any, index:number) => (
                    link.url && link.name && (
                        <div key={index} className="p-2 border rounded-lg mb-2">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{color: linksColor}}>{link.name}</a>
                        </div>
                    )
                ))}
                <br />
                <a
                    className="btn btn-primary btn-block btn-lg btn-narrow"
                    style={{ width: "auto", display: "inline" }}
                    href={`https://influanto.com/${user.username}`}
                >
                    Visit
                </a>
            </div>
        )}
        </div>
        {alert && <div className="alert mt-5 w-full">{alert}</div>}
      </div>
  </>
    );
  }else{
    return (
      <div className="p-4 bg-white shadow rounded-md"  style={containerStyle}>
        <h2 className="text-xl sm:text-2xl font-bold mb-2 inline">Link In Bio</h2>
        <form>
        <h1>Edit Links</h1>
          <div className="flex flex-wrap w-full">
            <div className="w-full lg:w-full p-2">
             {links.map((link:any, index:number) => (
                <div key={index} className="mb-4">
                    <label style={{ display: "block" }}>
                      Link {index + 1}
                      {link.image && (
                        <img src={link.image} alt={`Link ${index + 1} thumbnail`} style={{ width: "30px", height: "30px", borderRadius: "50%", marginLeft: "10px" }} />
                      )}
                    </label>
                    <input
                        type="text"
                        className="input mt-2 mb-2 mr-4 w-3/4"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                    />
                    <input
                        type="text"
                        className="input mb-2 w-3/4"
                        placeholder="Name"
                        value={link.name}
                        onChange={(e) => updateLink(index, 'name', e.target.value)}
                    />
                    <CldUploadWidget
                      uploadPreset="LinkInBioThumbnail" // Replace with your actual upload preset
                      onUploadAdded={(results: any) => {
                        const result = JSON.parse(results);
                        handleImageUpload(index, result);
                      }}
                    >
                      {({ open }: { open: () => void }) => (
                      <button type="button" onClick={() => open()} className="btn btn-primary btn-sm">
                        Upload Image
                      </button>
                      )}
                    </CldUploadWidget>
                     <button
                        type="button"
                        className="btn btn-alert btn-sm ml-2"
                        onClick={() => removeLink(index)}
                    >
                        Remove
                    </button>
                </div>
                
            ))}
          
            <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addLink}
            >
                Add Link
            </button>
            <h1 style={{display:"block"}} className="mt-8 mb-2">Styles</h1>
            <div className="flex flex-wrap w-full"> 
               <h2 style={{display:"block"}} className="mr-2">BG</h2>
               <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{display:"block"}} className="ml-2 mr-2">Text</h2>
               <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{display:"block"}} className="ml-2 mr-2">Links</h2>
               <input
                  type="color"
                  value={linksColor}
                  onChange={(e) => setLinksColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
             </div>
            </div>
          </div>

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