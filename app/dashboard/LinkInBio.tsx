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
import PrintifyProducts from '@/components/PrintifyProducts';

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
  const [showProducts, setShowProducts] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Add this useEffect to fetch products when editing
  useEffect(() => {
    if (isEditing && user?.printifyShopId) {
      fetchAvailableProducts();
    }
  }, [isEditing, user?.printifyShopId]);

  // Add this useEffect to load selected products when user data loads
  useEffect(() => {
    if (user?.selectedProducts) {
      setSelectedProductIds(user.selectedProducts);
    }
  }, [user]);

  // Add these functions before the return statement
  const fetchAvailableProducts = async () => {
    setIsLoadingProducts(true);
    try {
     const response = await fetch(`/api/products/${user.id}`);
    
      if (response.ok) {
        const products = await response.json();
        setAvailableProducts(products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        // Remove product
        return prev.filter(id => id !== productId);
      } else if (prev.length < 6) {
        // Add product (max 6)
        return [...prev, productId];
      } else {
        // Show alert when trying to select more than 6
        setAlertt('Maximum 6 products can be selected');
        setTimeout(() => setAlertt(''), 3000);
        return prev;
      }
    });
  };

  const saveSelectedProducts = async () => {
    try {
      await apiClient.post('/save-selected-products', {
        selectedProducts: selectedProductIds
      });
      setAlertt('Selected products saved successfully!');
    } catch (error) {
      setAlertt('Failed to save selected products');
    }
  };

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

  useEffect(() => {
  if (linkInBio?.font) {
    document.documentElement.style.setProperty('--preview-font', linkInBio.font);
  }
  
  // Apply background color to the page
  if (bgColor) {
    document.body.style.backgroundColor = bgColor;
  }
  
  // Apply background image to the page if it exists
  if (linkInBio?.bgImage) {
    document.body.style.backgroundImage = `url(${linkInBio.bgImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.backgroundImage = 'none';
  }
  
  return () => {
    // Cleanup on unmount
    document.documentElement.style.removeProperty('--preview-font');
    document.body.style.backgroundColor = '';
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  };
}, [linkInBio?.font, bgColor, linkInBio?.bgImage]);


// Add another useEffect specifically for real-time background image changes
useEffect(() => {
  // Apply background image to the page in real-time
  if (linkInBio?.bgImage) {
    document.body.style.backgroundImage = `url(${linkInBio.bgImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.backgroundImage = 'none';
  }
}, [linkInBio?.bgImage]); // This will trigger whenever bgImage changes


// Add another useEffect for real-time background color changes
useEffect(() => {
  if (bgColor) {
    document.body.style.backgroundColor = bgColor;
  }
}, [bgColor]); // This will trigger whenever bgColor changes


  const handleEditLinkInBio = async (e:any) => {
    e.preventDefault();
    console.log('Edit Link In Bio');
    console.log(links);

    try {
      const { data } = await apiClient.post("/linkinbio", {
        bgColor: bgColor,
        textColor: textColor,
        linksColor: linksColor,
        links: links,
        font: linkInBio?.font,
        cardBgColor: linkInBio?.cardBgColor,
        bgImage: linkInBio?.bgImage
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
    fontFamily: linkInBio?.font || 'inherit', // Apply font to the container
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
      <div 
        className="p-4 bg-white shadow rounded-md text-black" 
        style={{
          ...containerStyle,
          backgroundColor: linkInBio?.cardBgColor || 'white',
        }}
      >
       <div className="w-full flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Link In Bio</h2>
          <button 
            className="btn btn-primary btn-sm btn-narrow"
            style={{
              margin:"0 2%",
              fontFamily: linkInBio?.font || 'inherit'
            }}
            onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
        <br></br>
      <div style={{
        margin:"0 auto", 
        textAlign:"center", 
        color: textColor,
        fontFamily: linkInBio?.font || 'inherit'
      }}>
        <img src={data.user.image ?? fallbackImageUrl} onError={(e) => e.currentTarget.src = fallbackImageUrl} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline" }} alt="Avatar" />
        <p style={{ fontFamily: linkInBio?.font || 'inherit' }}>{data.user.name}</p>
        <br></br>
        {links && user && (
          <div>
              {links.map((link:any, index:number) => (
                link.url && link.name && (
                  <div key={index} className="p-2 border rounded-lg mb-2" style={{
                    display:"flex", 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: linkInBio?.cardBgColor || 'transparent',
                    fontFamily: linkInBio?.font || 'inherit'
                  }}>
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
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{
                          color: linksColor,
                          fontFamily: linkInBio?.font || 'inherit'
                        }}>{link.name}</a>
                      </>
                    )}
              </div>
                )
              ))}
              <br />
              <a
                  className="btn btn-primary btn-block btn-lg btn-narrow"
                  style={{ 
                    width: "auto", 
                    display: "inline",
                    fontFamily: linkInBio?.font || 'inherit'
                  }}
                  href={`https://influanto.com/${user.username}`}
              >
                  Visit
              </a>

              {/* DISPLAY SELECTED PRODUCTS ONLY */}
              {user?.hasAccess && user?.printifyShopId && user?.selectedProducts?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-center" style={{
                    color: textColor,
                    fontFamily: linkInBio?.font || 'inherit'
                  }}>
                    🛍️ Shop Our Products
                  </h3>
                  
                  <PrintifyProducts 
                    userId={user.id} 
                    shopId={user.printifyShopId}
                    selectedProductIds={user.selectedProducts}
                    textColor={textColor}
                    linksColor={linksColor}
                    cardBgColor={linkInBio?.cardBgColor}
                    font={linkInBio?.font}
                  />
                </div>
              )}

          </div>
      )}
      </div>
      {alert && <div className="alert mt-5 w-full">{alert}</div>}
    </div>
    
</>
)}else{
  return (
    <div 
      className="p-4 shadow rounded-md" 
      style={{
        ...containerStyle,
        backgroundColor: linkInBio?.cardBgColor || 'white',
        fontFamily: linkInBio?.font || 'inherit'
      }}
    >
      <div className="w-full flex flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 inline" style={{
          fontFamily: linkInBio?.font || 'inherit'
        }}>Link In Bio</h2>
        <br></br>
      <form>
      <h1 style={{ fontFamily: linkInBio?.font || 'inherit' }}>Edit Links</h1>
        <div className="flex flex-wrap w-full">
          <div className="w-full lg:w-full p-2">
           {links.map((link:any, index:number) => (
              <div key={index} className="mb-4" style={{
                fontFamily: linkInBio?.font || 'inherit'
              }}>
                  <label style={{ 
                    display: "block",
                    fontFamily: linkInBio?.font || 'inherit'
                  }}>
                    Link {index + 1}
                  {isYouTubeLink(index, link.url) && (
                  <div>
                    <label style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                      Display Video:
                      <input
                        type="checkbox" 
                        className="mr-2"
                        checked={link.displayVideo || false}
                        onChange={(e) => updateYouTubeLinkOptions(index, e.target.checked)}
                      />
                    </label>
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
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                  />
                  <input
                      type="text"
                      className="input mb-2 w-3/4"
                      placeholder="Name"
                      value={link.name}
                      onChange={(e) => updateLink(index, 'name', e.target.value)}
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                  />
                  <br></br>
                   {isYouTubeLink(index, link.url) && (
                    <div>
                        <label style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                            Display Video:
                            <input
                                type="checkbox" className="mr-2"
                                checked={link.displayVideo || false}
                                onChange={(e) => updateYouTubeLinkOptions(index, e.target.checked)}
                            />
                        </label>
                    </div>
                )}
                {!isYouTubeLink(index, link.url) && !link.image && 
                  <CldUploadWidget
                    uploadPreset="LinkInBioThumbnail"
                    options={{ folder: `user_${user.id}_links`, publicId: `link_${index}_thumbnail` }}
                    onSuccess={(result: any) => {
                      console.log('Upload callback triggered');
                      handleImageUpload(index, result);
                    }}
                  >
                    {({ open }: { open: () => void }) => (
                    <button 
                      type="button" 
                      onClick={() => open()} 
                      className="btn btn-primary btn-sm btn-narrow"
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                    >
                      Upload Image
                    </button>
                    )}
                  </CldUploadWidget>
                }
                   <button
                      type="button"
                      className="btn btn-alert btn-sm btn-narrow ml-2"
                      onClick={() => removeLink(index)}
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                  >
                      Remove
                  </button>
              </div>
              
          ))}
        
          <button
              type="button"
              className="btn btn-primary btn-sm btn-narrow"
              onClick={addLink}
              style={{ fontFamily: linkInBio?.font || 'inherit' }}
          >
              Add Link
          </button>

          {/************ Styles ************/}
          
          <h1 className="mt-8 mb-2 w-full" style={{
            fontFamily: linkInBio?.font || 'inherit'
          }}>Styles</h1>
          
          <div className="flex flex-wrap items-center gap-2 w-full"> 
             <div className="flex items-center gap-1">
               <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>BG</span>
               <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
             </div>
             <div className="flex items-center gap-1">
               <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Text</span>
               <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
             </div>
             <div className="flex items-center gap-1">
               <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Links</span>
               <input
                  type="color"
                  value={linksColor}
                  onChange={(e) => setLinksColor(e.target.value)}
                  className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
             </div>
             {user.hasAccess && (
              <>
                {/* Premium Styling Options */}
                <div className="mt-4 w-full">
                  <h2 className="text-md font-semibold mb-2" style={{
                    fontFamily: linkInBio?.font || 'inherit'
                  }}>Premium Styles</h2>
                  
                  {/* Font Picker */}
                  <div className="mb-3">
                    <label className="mr-2" style={{
                      fontFamily: linkInBio?.font || 'inherit'
                    }}>Font:</label>
                    <select
                      value={linkInBio?.font || "sans-serif"}
                      onChange={e => setLinkInBio({ ...linkInBio, font: e.target.value })}
                      className="input w-40"
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                    >
                      <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans Serif</option>
                      <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
                      <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
                      <option value="cursive" style={{ fontFamily: 'cursive' }}>Cursive</option>
                      <option value="fantasy" style={{ fontFamily: 'fantasy' }}>Fantasy</option>
                    </select>
                  </div>
                  
                  {/* Card Background Color */}
                  <div className="mb-3 flex items-center gap-2">
                    <label className="mr-2" style={{
                      fontFamily: linkInBio?.font || 'inherit'
                    }}>Card BG:</label>
                    <input
                      type="color"
                      value={linkInBio?.cardBgColor || "#ffffff"}
                      onChange={e => setLinkInBio({ ...linkInBio, cardBgColor: e.target.value })}
                      className="w-8 h-8 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  
                 {/* Background Image Selector */}
                  <div className="mb-3">
                    <label className="mr-2" style={{
                      fontFamily: linkInBio?.font || 'inherit'
                    }}>Background Image:</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`border rounded-lg p-1 ${!linkInBio?.bgImage ? "border-blue-500" : "border-gray-300"}`}
                        onClick={() => {
                          setLinkInBio({ ...linkInBio, bgImage: null });
                          // Immediately clear background
                          document.body.style.backgroundImage = 'none';
                        }}
                        style={{ fontFamily: linkInBio?.font || 'inherit' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', marginBottom: 4 }}>
                            None
                            </div>
                        </div>
                      </button>
                      {[
                        "https://images.pexels.com/photos/7598077/pexels-photo-7598077.jpeg",
                        "https://images.pexels.com/photos/7630061/pexels-photo-7630061.jpeg",
                        "https://images.pexels.com/photos/6788581/pexels-photo-6788581.jpeg"

                      ].map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`border rounded-lg p-1 ${linkInBio?.bgImage === img ? "border-blue-500" : "border-gray-300"}`}
                          onClick={() => {
                            setLinkInBio({ ...linkInBio, bgImage: img });
                            // Immediately apply background
                            document.body.style.backgroundImage = `url(${img})`;
                            document.body.style.backgroundSize = 'cover';
                            document.body.style.backgroundPosition = 'center';
                            document.body.style.backgroundRepeat = 'no-repeat';
                            document.body.style.backgroundAttachment = 'fixed';
                          }}
                        >
                          <img src={img} alt={`bg-${idx}`} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                        </button>
                      ))}
                    </div>
                  </div>
 </div>
              </>
             )}
              
           </div>
          </div>
        </div>

        {alert && <div className="alert mt-5 w-100" style={{backgroundColor:"darkred", border:"1px darkred solid"}}>{alert}</div>}
        <button 
          className="btn btn-primary btn-block btn-sm btn-narrow"
          style={{
            width:"35%", 
            display:"inline", 
            margin:"8% 0 0",
            fontFamily: linkInBio?.font || 'inherit'
          }}
          onClick={(e) => handleEditLinkInBio(e)} 
          type="submit">
          Submit
      </button>
      <button
        className="btn btn-alert btn-block btn-sm btn-narrow"
        style={{ 
          width: "35%", 
          display: "inline", 
          margin: "2% 5%",
          fontFamily: linkInBio?.font || 'inherit'
        }}
        onClick={() => setEditing(false)}>
        Cancel
      </button>

      {/* PRODUCT SELECTION SECTION - ONLY IN EDITING VIEW */}
      {user?.hasAccess && user?.printifyShopId && (
        <div className="mt-8 w-full border-t pt-6">
          <h2 className="text-lg font-semibold mb-4" style={{
            fontFamily: linkInBio?.font || 'inherit'
          }}>
            🛍️ Select Products for Link in Bio (Max 6)
          </h2>
          
          {isLoadingProducts ? (
            <div className="text-center py-8" style={{
              fontFamily: linkInBio?.font || 'inherit'
            }}>
              <div className="animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-gray-600">Loading your products...</p>
            </div>
          ) : availableProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {availableProducts.map((product: any) => (
                  <div 
                    key={product.id}
                    className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      selectedProductIds.includes(product.id) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                    style={{
                      backgroundColor: linkInBio?.cardBgColor || 'white'
                    }}
                  >
                    {/* Selection Toggle Overlay */}
                    <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedProductIds.includes(product.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedProductIds.includes(product.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      )}
                    </div>

                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-gray-400 text-2xl mb-1">📦</div>
                            <span className="text-xs text-gray-500" style={{
                              fontFamily: linkInBio?.font || 'inherit'
                            }}>
                              No Image
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium truncate mb-1" style={{
                        fontFamily: linkInBio?.font || 'inherit'
                      }}>
                        {product.title}
                      </h4>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-green-600" style={{
                          fontFamily: linkInBio?.font || 'inherit'
                        }}>
                          ${product.variants?.[0]?.price || 'N/A'}
                        </p>
                        
                        {product.variants && product.variants.length > 1 && (
                          <span className="text-xs text-gray-500" style={{
                            fontFamily: linkInBio?.font || 'inherit'
                          }}>
                            {product.variants.length} variants
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Badge */}
                    {selectedProductIds.includes(product.id) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-center py-1">
                        <span className="text-xs font-semibold" style={{
                          fontFamily: linkInBio?.font || 'inherit'
                        }}>
                          ✓ SELECTED
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Selection Summary and Actions */}
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-700" style={{
                    fontFamily: linkInBio?.font || 'inherit'
                  }}>
                    {selectedProductIds.length}/5 products selected
                  </span>
                  {selectedProductIds.length === 5 && (
                    <p className="text-xs text-orange-600 mt-1" style={{
                      fontFamily: linkInBio?.font || 'inherit'
                    }}>
                      Maximum selection reached
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {selectedProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="btn btn-alert btn-sm"
                      style={{
                        fontFamily: linkInBio?.font || 'inherit'
                      }}
                    >
                      Clear All
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={saveSelectedProducts}
                    className="btn btn-primary btn-sm"
                    disabled={selectedProductIds.length === 0}
                    style={{
                      fontFamily: linkInBio?.font || 'inherit'
                    }}
                  >
                    Save Selection ({selectedProductIds.length})
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg" style={{
              fontFamily: linkInBio?.font || 'inherit'
            }}>
              <div className="text-4xl text-gray-400 mb-2">🏪</div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Products Found</h3>
              <p className="text-sm text-gray-500">
                Make sure your Printify store has published products.
              </p>
            </div>
          )}
        </div>
      )}

      </form>
      </div>
    </div>
 
    );
  }   
}
};

export default LinkInBio;