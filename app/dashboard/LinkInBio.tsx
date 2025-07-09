"use client"
/* eslint-disable */
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
    { url: "", name: "", image: "" }
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

  const updateLink = (index: number, field: any, value: any) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
    console.log('Updated links state:', newLinks); // Log to confirm state update
  };

  const removeLink = async (index: number) => {
    const imageToDelete = links[index]?.image;

    if (imageToDelete) {
        try {
            let publicId = imageToDelete.split('/').slice(-2).join('/').split('.')[0]; // Extract publicId including folder structure if present
            publicId = publicId.substring(publicId.indexOf('/') + 1); // Slice whatever comes before the first '/'
            console.log(imageToDelete);
            console.log(`Sending publicId to backend: ${publicId}`);
            if (publicId) {
                await apiClient.delete('/delete-image', {
                    data: { publicId }, // Use 'data' to send payload with DELETE
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log(`Image with publicId ${publicId} deleted successfully`);
            }
        } catch (error) {
            console.error('Error deleting image from Cloudinary:', error.response?.data || error.message); // Log detailed error
        }
    }

    const newLinks = links.filter((_: any, i: any) => i !== index);
    setLinks(newLinks);
};

  const updateImage = (index: number, imageUrl: string) => {
    const newLinks = [...links];
    newLinks[index].image = imageUrl;
    setLinks(newLinks);
  };

  function isYouTubeLinkCheck(url: string): boolean {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  }

  // Function to check if a URL is a YouTube link
  function isYouTubeLink(index: number, url: string): boolean {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    const test = youtubeRegex.test(url);
    return test;
  }

  // Function to update YouTube link options
  function updateYouTubeLinkOptions(index: number, value: boolean) {
    // Assuming you have a state or a method to update the link
    const updatedLinks = [...links];
    updatedLinks[index].displayVideo = value;
    setLinks(updatedLinks);
    console.log(updatedLinks);
  }

  // Function to get the YouTube video ID
  function getYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  const handleImageUpload = (index: number, result: any) => {
    console.log('handle upload triggered');
    console.log('Upload result:', result);
    const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v${result.info.version}/${result.info.public_id}.png`; // Fixed URL construction
    updateLink(index, 'image', imageUrl); // Save the image URL to the links array
    console.log('Image URL saved to link:', imageUrl);
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
    maxWidth: "100%", // Ensure it doesn't exceed container
    margin: "0 auto",
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
        <div className="p-4 bg-white shadow rounded-md text-black" style={containerStyle}>
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
          <img src={data.user.image ?? fallbackImageUrl} onError={(e) => e.currentTarget.src = fallbackImageUrl} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline" }} alt="Avatar" />
          <p>{data.user.name}</p>
          <br></br>
          {links && user && (
            <div>
                {links.map((link:any, index:number) => (
                  link.url && link.name && (
                    <div key={index} className="p-2 border rounded-lg mb-2" style={{display:"flex", alignItems: 'center', justifyContent: 'center'}}>
                      {isYouTubeLinkCheck(link.url) ? (
                        <iframe
                            width="100%"
                            height="200"
                            style={{maxWidth: "400px"}}
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(link.url)}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe> ) : (
                        <>
                          {link.image && <img src={link.image} alt="Link Image" style={{borderRadius: '50%', width: '30px', height: '30px', marginRight: '10px'}} />}
                          <a href={link.url} target="_blank" rel="noopener noreferrer" style={{color: linksColor}}>{link.name}</a>
                        </>
                      )}
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
      <div className="p-4 bg-white shadow rounded-md " style={containerStyle}>
        <div className="w-full flex flex-wrap">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 inline">Link In Bio</h2>
          <br></br>
        <form>
        <h1>Edit Links</h1>
          <div className="flex flex-wrap w-full">
            <div className="w-full lg:w-full p-2">
             {links.map((link:any, index:number) => (
                <div key={index} className="mb-4">
                    <label style={{ display: "block" }}>
                      Link {index + 1}
                      {isYouTubeLinkCheck(link.url) && (
                        <div>
                            <iframe
                                width="100%"
                                height="200"
                                style={{maxWidth: "400px"}}
                                src={`https://www.youtube.com/embed/` +  getYouTubeVideoId(link.url)}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                      {link.image && (
                        <img src={link.image} alt={`Link ${index + 1} thumbnail`} style={{ width: "30px", height: "30px", borderRadius: "50%", marginLeft: "10px" }} />
                      )}
                    </label>
                    <input
                        type="text"
                        className="input mt-2 mb-2 w-3/4"
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
                    <br></br>
                     {isYouTubeLink(index, link.url) && (
                      <div>
                          <label>
                              Display Video:
                              <input
                                  type="checkbox" className="mr-2"
                                  defaultChecked={link.displayVideo || false}
                                  checked={link.displayVideo || false}
                                  onChange={(e) => updateYouTubeLinkOptions(index, e.target.checked)}
                              />
                          </label>
                      </div>
                  )}
                  {!isYouTubeLink(index, link.url) && !link.image && 
                    <CldUploadWidget
                      uploadPreset="LinkInBioThumbnail" // Ensure this matches your Cloudinary preset
                      options={{ folder: `user_${user.id}_links`, publicId: `link_${index}_thumbnail` }} // Adjusted folder and publicId
                      onSuccess={(result: any) => {
                        console.log('Upload callback triggered'); // Log to confirm callback is triggered
                        handleImageUpload(index, result);
                      }}
                    >
                      {({ open }: { open: () => void }) => (
                      <button type="button" onClick={() => open()} className="btn btn-primary btn-sm btn-narrow">
                        Upload Image
                      </button>
                      )}
                    </CldUploadWidget>
                  }
                     <button
                        type="button"
                        className="btn btn-alert btn-sm btn-narrow ml-2"
                        onClick={() => removeLink(index)}
                    >
                        Remove
                    </button>
                </div>
                
            ))}
          
            <button
                type="button"
                className="btn btn-primary btn-sm btn-narrow"
                onClick={addLink}
            >
                Add Link
            </button>
            <h1 className="mt-8 mb-2 w-full">Styles</h1>
            <div className="flex flex-wrap items-center gap-2 w-full"> 
               <div className="flex items-center gap-1">
                 <span className="text-sm">BG</span>
                 <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
               </div>
               <div className="flex items-center gap-1">
                 <span className="text-sm">Text</span>
                 <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
               </div>
               <div className="flex items-center gap-1">
                 <span className="text-sm">Links</span>
                 <input
                    type="color"
                    value={linksColor}
                    onChange={(e) => setLinksColor(e.target.value)}
                    className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
               </div>
             </div>
            </div>
          </div>

          {alert && <div className="alert mt-5 w-100" style={{backgroundColor:"darkred", border:"1px darkred solid"}}>{alert}</div>}
          <button 
            className="btn btn-primary btn-block btn-sm btn-narrow"
            style={{width:"35%", display:"inline", margin:"8% 0 0"}}
            onClick={(e) => handleEditLinkInBio(e)} 
            type="submit">
            Submit
        </button>
        <button
          className="btn btn-alert btn-block btn-sm btn-narrow"
          style={{ width: "35%", display: "inline", margin: "2% 5%" }}
          onClick={() => setEditing(false)}>
          Cancel
        </button>
        </form>
        </div>
      </div>
   
      );
    }   
  }
};

export default LinkInBio;