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
  const [bgImage, setBgImage] = useState<any>();
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
    setBgImage(data.bgImage);
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
  
  return () => {
    // Cleanup on unmount
    document.documentElement.style.removeProperty('--preview-font');
    document.body.style.backgroundColor = '';
  };
}, [linkInBio?.font, bgColor]);

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
        bgImage: bgImage,
        textColor: textColor,
        linksColor: linksColor,
        links: links,
        font: linkInBio?.font,
        cardBgColor: linkInBio?.cardBgColor,
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
  maxWidth: "480px", // Fixed pixel value instead of viewport units
  margin: "0 auto",
  fontFamily: linkInBio?.font || 'inherit',
  backgroundColor: linkInBio?.cardBgColor || 'white',
  boxSizing: "border-box" as const,
  overflow: "hidden",
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
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta property="og:title" content="FREE Link In Bio Tool" />
      <meta property="og:description" content="Generate and manage your Link In Bio easily." />
      <meta name="twitter:title" content="Link In Bio Tool" />
      <meta name="twitter:description" content="Generate and manage your Link In Bio easily." />
    </Head>
     <div 
        className="mx-auto bg-white shadow rounded-md text-black"
        style={{
          width: "calc(100% - 16px)", // Always leave 8px margin on each side
          maxWidth: "480px", // Fixed max width
          padding: "0.5rem 1rem", // Responsive padding
          fontFamily: linkInBio?.font || 'inherit',
          backgroundColor: linkInBio?.cardBgColor || 'white',
          boxSizing: "border-box",
          overflow: "hidden"
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
                          style={{maxWidth: "100%"}}
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
      <div style={{ 
        marginTop: "24px", 
        marginBottom: "16px", 
        width: "100%"
      }}>
        <h3 style={{
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "12px",
          textAlign: "center",
          color: textColor,
          fontFamily: linkInBio?.font || 'inherit'
        }}>
          Merch
        </h3>
        
        {/* Responsive Grid Container */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", // Responsive grid
          gap: "8px",
          width: "100%",
          maxWidth: "100%",
          padding: "0 4px"
        }}>
          {linkInBio.selectedProducts.map((productId: string) => {
            const product = availableProducts.find(p => p.id === productId);
            if (!product) {
              console.log('❌ Product not found for ID:', productId);
              return null;
            }
            
            const productUrl = product.url || '#';
            
            return (
              <div 
                key={productId}
                style={{ 
                  width: "100%", // Take full grid cell width
                  minWidth: "80px",
                  maxWidth: "120px", // Prevent cards from getting too large
                  margin: "0 auto" // Center in grid cell
                }}
              >
                <a 
                  href={productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '6px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: linkInBio?.cardBgColor || 'rgba(255,255,255,0.1)',
                    textDecoration: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {/* Product Image */}
                  <div style={{ 
                    width: "100%", 
                    height: "60px",
                    borderRadius: "6px", 
                    overflow: "hidden", 
                    backgroundColor: "#f0f0f0", 
                    marginBottom: "6px" 
                  }}>
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        onError={(e) => {
                          console.log('❌ Image failed to load:', product.images[0]);
                          e.currentTarget.src = `https://via.placeholder.com/80x60/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`;
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(45deg, #e3f2fd, #f3e5f5)"
                      }}>
                        <span style={{ color: "#999", fontSize: "12px" }}>📦</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div>
                    <div style={{
                      fontSize: "10px",
                      fontWeight: "500",
                      marginBottom: "3px",
                      color: textColor,
                      fontFamily: linkInBio?.font || 'inherit',
                      lineHeight: '1.2',
                      height: '2.4em',
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      textAlign: 'center'
                    }}>
                      {product.title && product.title.length > 12 
                        ? `${product.title.substring(0, 12)}...` 
                        : product.title || 'Product'
                      }
                    </div>
                    <div style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      textAlign: "center",
                      color: linksColor,
                      fontFamily: linkInBio?.font || 'inherit'
                    }}>
                      ${product.variants?.[0]?.price || product.price || 'N/A'}
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
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
  className="shadow rounded-md mx-auto" 
  style={{
    width: "calc(100% - 16px)", // Always leave 8px margin on each side
    maxWidth: "600px", // Fixed max width for editing (was 60px!)
    padding: "1rem",
    fontFamily: linkInBio?.font || 'inherit',
    backgroundColor: linkInBio?.cardBgColor || 'white',
    boxSizing: "border-box",
    overflow: "hidden"
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
}}>Colors:</h1>

<div className="w-full"> 
  {/* Color Pickers Row */}
  <div className="flex justify-center items-center gap-4 mb-4 flex-wrap">
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
    <div className="flex items-center gap-1">
      <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>BG</span>
      <input
        type="color"
        value={bgColor}
        onChange={(e) => setBgColor(e.target.value)}
        className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer"
      />
    </div>
  </div>

  {/* Background Image Selector */}
  <div className="mb-3 w-full">
    <label className="block mb-3 font-medium" style={{
      fontFamily: linkInBio?.font || 'inherit'
    }}>Background Image:</label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 justify-items-center max-w-lg mx-auto">
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
            width: 60, 
            height: 60, 
            backgroundColor: '#f0f0f0', 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '10px', 
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
            setBgImage(img);
          }}
        >
          <img 
            src={img} 
            alt={`bg-${idx}`} 
            style={{ 
              width: 60, 
              height: 60, 
              objectFit: "cover", 
              borderRadius: 6 
            }} 
          />
        </button>
      ))}
    </div>
  </div>

  {user.hasAccess && (
    <>
      {/* Premium Styling Options */}
      <div className="mt-4 w-full">
        <h2 className="text-md font-semibold mb-2" style={{
          fontFamily: linkInBio?.font || 'inherit'
        }}>Premium Styles</h2>
        
        <div className="flex justify-center items-center gap-6 flex-wrap">
          {/* Card Background Color */}
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{
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
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{
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
    <div className="mb-4">
      <h2 className="text-lg font-semibold" style={{
        fontFamily: linkInBio?.font || 'inherit'
      }}>
        🛍️ Select Products from Printify (Max 10)
      </h2>
    </div>
    
    {isLoadingProducts ? (
      <div className="text-center py-8" style={{
        fontFamily: linkInBio?.font || 'inherit'
      }}>
        <div className="animate-pulse mx-auto max-w-sm">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading your products...</p>
      </div>
    ) : availableProducts.length > 0 ? (
      <>
        {/* Selection Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-w-md mx-auto flex justify-between items-center">
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
          
          {selectedProductIds.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="btn btn-alert btn-sm"
                style={{
                  fontFamily: linkInBio?.font || 'inherit'
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

          {/* Mobile-Friendly Products Grid */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {/* Mobile: Card Layout, Desktop: Table Layout */}
              <div className="md:hidden">
                {/* Mobile Card Layout */}
                <div className="space-y-3 p-3">
                  {availableProducts.map((product: any) => (
                    <div 
                      key={product.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedProductIds.includes(product.id) 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
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

                        {/* Product Image */}
                        <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images && product.images.length > 0 && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://via.placeholder.com/48x48/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                              <span className="text-gray-400 text-xs">📦</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 leading-tight" style={{
                            fontFamily: linkInBio?.font || 'inherit'
                          }}>
                            {product.title && product.title.length > 40 
                              ? `${product.title.substring(0, 40)}...` 
                              : product.title || 'Untitled Product'
                            }
                          </div>
                          <div className="text-xs text-gray-500 mt-1" style={{
                            fontFamily: linkInBio?.font || 'inherit'
                          }}>
                            {product.variants?.length || 1} variant{(product.variants?.length || 1) > 1 ? 's' : ''}
                          </div>
                          <div className="text-sm font-semibold text-green-600 mt-1" style={{
                            fontFamily: linkInBio?.font || 'inherit'
                          }}>
                            ${product.variants?.[0]?.price || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <table className="w-full">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availableProducts.map((product: any) => (
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
                          <div className="text-sm font-medium text-gray-900" style={{
                            fontFamily: linkInBio?.font || 'inherit'
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
      </div>

      </form>
      </div>
    </div>
 
    );
  }   
}
};

export default LinkInBio;