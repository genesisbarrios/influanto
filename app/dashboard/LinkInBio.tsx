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

useEffect(() => {
  if (isEditing && user?.printifyShopId) {
    fetchAvailableProducts();
  }
}, [isEditing, user?.printifyShopId]);

// Add this useEffect to ensure products are loaded when editing and we have selected products
useEffect(() => {
  if (isEditing && user?.printifyShopId && selectedProductIds.length > 0 && availableProducts.length === 0) {
    console.log('🔍 Fetching products because we have selected products but no available products');
    fetchAvailableProducts();
  }
}, [isEditing, user?.printifyShopId, selectedProductIds.length, availableProducts.length]);

useEffect(() => {
  if (linkInBio?.selectedProducts) {
    setSelectedProductIds(linkInBio.selectedProducts);
  }
}, [linkInBio?.selectedProducts]);

const fetchAvailableProducts = async () => {
  console.log('🔍 Starting fetch...');
  console.log('🔍 User ID:', user?.id);
  console.log('🔍 Full URL:', `/api/products/${user.id}`);
  
  setIsLoadingProducts(true);
  try {
    const url = `/api/products/${user.id}`;
    console.log('📞 Fetching:', url);
    
    const response = await fetch(url);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      const products = await response.json();
      console.log('✅ Products received:', products);
      setAvailableProducts(products);
    } else {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  } finally {
    setIsLoadingProducts(false);
  }
};

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        // Remove product
        return prev.filter(id => id !== productId);
      } else if (prev.length < 10) {
        // Add product (max 10)
        return [...prev, productId];
      } else {
        // Show alert when trying to select more than 10
        setAlertt('Maximum 10 products can be selected');
        setTimeout(() => setAlertt(''), 3000);
        return prev;
      }
    });
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

  // Add this useEffect after your existing ones (around line 50)
// Fetch products for display in non-editing view
useEffect(() => {
  if (!isEditing && user?.printifyShopId && linkInBio?.selectedProducts?.length > 0) {
    fetchAvailableProducts();
  }
}, [user?.printifyShopId, linkInBio?.selectedProducts, isEditing]);

  const getLinks = async () => {
  try {
    const { data } = await apiClient.get("/get-links");
    setLinkInBio(data);
    setBgColor(data.bgColor);
    setTextColor(data.textColor);
    setLinksColor(data.linksColor);
    setLinks(data.links);
    // Fix: Make sure selectedProducts is loaded from the API response
    if (data.selectedProducts && Array.isArray(data.selectedProducts)) {
      setSelectedProductIds(data.selectedProducts);
    }
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
    console.log('Selected Product IDs being sent:', selectedProductIds);
    console.log(links);

    try {
      const { data } = await apiClient.post("/linkinbio", {
        bgColor: bgColor,
        textColor: textColor,
        linksColor: linksColor,
        links: links,
        font: linkInBio?.font,
        cardBgColor: linkInBio?.cardBgColor,
        bgImage: linkInBio?.bgImage,
        selectedProducts: selectedProductIds
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

           {/* MERCH SECTION */}
          {user?.hasAccess && user?.printifyShopId && linkInBio?.selectedProducts?.length > 0 && (
            <div className="mt-6 mb-4">
              <h3 className="text-lg font-semibold mb-3 text-center" style={{
                color: textColor,
                fontFamily: linkInBio?.font || 'inherit'
              }}>
                Merch
              </h3>
              
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3" style={{
                  width: 'max-content',
                  minWidth: '100%'
                }}>
                  {linkInBio.selectedProducts.map((productId: string) => {
                    // Find the product from availableProducts by ID
                    const product = availableProducts.find(p => p.id === productId);
                    if (!product) return null;
                    
                    return (
                      <div 
                        key={productId} 
                        className="flex-shrink-0 p-3 rounded-lg" 
                        style={{
                          width: '33.333%',
                          minWidth: '200px',
                          backgroundColor: linkInBio?.cardBgColor || 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        {/* Product Image */}
                        <div className="w-full h-32 rounded overflow-hidden bg-gray-100 mb-3">
                          {product.images && product.images.length > 0 && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/200x128/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                              <span className="text-gray-400 text-2xl">📦</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div>
                          <div className="text-sm font-medium mb-2" style={{
                            color: textColor,
                            fontFamily: linkInBio?.font || 'inherit',
                            lineHeight: '1.3',
                            wordWrap: 'break-word',
                            minHeight: '2.6em', // Ensure consistent height
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {product.title && product.title.length > 40 
                              ? `${product.title.substring(0, 40)}...` 
                              : product.title || 'Product'
                            }
                          </div>
                          <div className="text-lg font-bold text-center" style={{
                            color: linksColor,
                            fontFamily: linkInBio?.font || 'inherit'
                          }}>
                            ${product.variants?.[0]?.price || 'N/A'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
                 
                  
                {/* Background Image Selector */}
                <div className="mb-3">
                  <label className="mr-2" style={{
                    fontFamily: linkInBio?.font || 'inherit'
                  }}>Background Image:</label>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      className={`border rounded-lg p-2 ${!linkInBio?.bgImage ? "border-blue-500" : "border-gray-300"}`}
                      onClick={() => {
                        setLinkInBio({ ...linkInBio, bgImage: null });
                        // Immediately clear background
                        document.body.style.backgroundImage = 'none';
                      }}
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: 8, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '12px', 
                          marginBottom: 4 
                        }}>
                          None
                        </div>
                      </div>
                    </button>
                    {[
                      "https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg",
                      "https://images.pexels.com/photos/3308588/pexels-photo-3308588.jpeg",
                      "https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg",
                      "https://images.pexels.com/photos/7598077/pexels-photo-7598077.jpeg",
                      "https://images.pexels.com/photos/7630061/pexels-photo-7630061.jpeg",
                      "https://images.pexels.com/photos/1292998/pexels-photo-1292998.jpeg",
                      "https://images.pexels.com/photos/6788581/pexels-photo-6788581.jpeg"
                    ].map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`border rounded-lg p-2 ${linkInBio?.bgImage === img ? "border-blue-500 border-2" : "border-gray-300"}`}
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
                        <img 
                          src={img} 
                          alt={`bg-${idx}`} 
                          style={{ 
                            width: 80, 
                            height: 80, 
                            objectFit: "cover", 
                            borderRadius: 8 
                          }} 
                        />
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

         {/* PRODUCT SELECTION SECTION - ONLY IN EDITING VIEW */}
    {user?.hasAccess && user?.printifyShopId && (
      <div className="mt-8 w-full border-t pt-6">
        <h2 className="text-lg font-semibold mb-4" style={{
          fontFamily: linkInBio?.font || 'inherit'
        }}>
          🛍️ Select Products from Printify (Max 10)
        </h2>
        
        {isLoadingProducts ? (
          <div className="text-center py-8" style={{
            fontFamily: linkInBio?.font || 'inherit'
          }}>
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading your products...</p>
          </div>
        ) : availableProducts.length > 0 ? (
          <>
            {/* Selection Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-700" style={{
                  fontFamily: linkInBio?.font || 'inherit'
                }}>
                  {selectedProductIds.length}/10 products selected
                </span>
                {selectedProductIds.length === 10 && (
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
              </div>
            </div>

         {/* Scrollable Products Table */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    ✓
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Img
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableProducts.map((product: any, index: number) => (
                  <tr 
                    key={product.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedProductIds.includes(product.id) 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : ''
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    {/* Selection Checkbox */}
                    <td className="px-2 py-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedProductIds.includes(product.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300'
                      }`}>
                        {selectedProductIds.includes(product.id) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        )}
                      </div>
                    </td>

                    {/* Product Image */}
                    <td className="px-2 py-2">
                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', product.images[0]);
                              e.currentTarget.src = `https://via.placeholder.com/40x40/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                            <span className="text-gray-400 text-xs">📦</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="px-2 py-3">
                      <div className="text-sm font-medium text-gray-900 max-w-[250px]" style={{
                        fontFamily: linkInBio?.font || 'inherit',
                        lineHeight: '1.3',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}>
                        {product.title && product.title.length > 60 
                          ? `${product.title.substring(0, 60)}...` 
                          : product.title || 'Untitled Product'
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1" style={{
                        fontFamily: linkInBio?.font || 'inherit'
                      }}>
                        {product.variants?.length || 1} variant{(product.variants?.length || 1) > 1 ? 's' : ''}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-2 py-2">
                      <div className="text-sm font-semibold text-green-600" style={{
                        fontFamily: linkInBio?.font || 'inherit'
                      }}>
                        ${product.variants?.[0]?.price || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* Footer with product count */}
          <div className="text-xs text-gray-500 mt-2 text-center" style={{
            fontFamily: linkInBio?.font || 'inherit'
          }}>
            Showing {availableProducts.length} products • Scroll to see more
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

  {alert && <div className="alert mt-5 w-100" style={{backgroundColor:"darkred", border:"1px darkred solid"}}>{alert}</div>}
      <div style={{textAlign:"center"}}>
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
      </div>

      </form>
      </div>
    </div>
 
    );
  }   
}
};

export default LinkInBio;