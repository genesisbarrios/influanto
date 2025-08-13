"use client"
/* eslint-disable */
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
import { faGlobe, faLocation, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { set } from "mongoose";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
import { useRouter } from 'next/navigation'; 
import { usePathname, useSearchParams } from 'next/navigation'
import Head from "next/head";

const LinkInBioPage =  () => {
  const router = useRouter();
  const [user, setUser] = useState<any>();
  const [userName, setUserName] = useState("");
  const [displayEmail, setDisplayEmail] = useState<Boolean>();
  const [bgColor, setBgColor] = useState("");
  const [textColor, setTextColor]  = useState("");
  const [linksColor, setLinksColor] = useState("");
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");
  
  // Premium styling states
  const [cardBgColor, setCardBgColor] = useState("");
  const [font, setFont] = useState("");
  const [bgImage, setBgImage] = useState("");
  
  // Add missing states for merch functionality
  const [linkInBio, setLinkInBio] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const pathname = usePathname()
  const searchParams = useSearchParams()
 
  useEffect(() => {
    const url = `${pathname}`
    //console.log(url);
    setUserName(url.split("/")[1]);
    //console.log(userName);
  }, [pathname, searchParams, userName])

  // Add function to fetch products
  const fetchAvailableProducts = async () => {
    if (!user?.id) return;
    
    //console.log('🔍 Starting fetch for public page...');
    //console.log('🔍 User ID:', user.id);
    
    setIsLoadingProducts(true);
    try {
      const url = `/api/products/${user.id}`;
      //console.log('📞 Fetching:', url);
      
      const response = await fetch(url);
      
      //console.log('📡 Response status:', response.status);
      //console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const products = await response.json();
        //console.log('✅ Products received:', products);
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

  const getUser = async () => {
    if(userName){
        try {
        const response = await apiClient.get(`/linkinbio/${userName}`);
        const data = response.data;

        //console.log('🔍 API Response:', data);
        setUser(data.user);
        setBgColor(data.linkInBio?.backgroundColor);
        setTextColor(data.linkInBio?.textColor);
        setLinksColor(data.linkInBio?.linksColor);
        setLinks(data.linkInBio?.links);
        
        // Set premium styling options
        setCardBgColor(data.linkInBio?.cardBgColor);
        setFont(data.linkInBio?.font);
        setBgImage(data.linkInBio?.bgImage);
        
        // Set linkInBio data for merch section
        setLinkInBio(data.linkInBio);
        
        // Set selected products if they exist
        if (data.linkInBio?.selectedProducts && Array.isArray(data.linkInBio.selectedProducts)) {
          //console.log('🔍 Setting selected products:', data.linkInBio.selectedProducts);
          setSelectedProductIds(data.linkInBio.selectedProducts);
        }
        
        console.log('🔍 LinkInBio data:', data.linkInBio);
        } catch (e) {
        //console.error(e?.message);
        setAlertt(e?.message);
        } 
    }
  }
  
  function isYouTubeLinkCheck(url: string): boolean {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  }

  // Function to get the YouTube video ID
  function getYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
   if(!user){
    getUser();
   }else{
    //console.log("user:");
    //console.log(links);
   }
  }, [user, userName, bgColor, textColor, linksColor, links]);

  // Add useEffect to fetch products when we have user data and selected products
  useEffect(() => {
    if (user?.id && user?.printifyShopId && linkInBio?.selectedProducts?.length > 0) {
      console.log('🔍 Fetching products for public page...');
      fetchAvailableProducts();
    }
  }, [user?.id, user?.printifyShopId, linkInBio?.selectedProducts]);
  
  useEffect(() => {
    // Apply background color
    if (document && bgColor) {
      document.body.style.backgroundColor = bgColor;
    }
    
    // Apply background image
    if (bgImage) {
      document.body.style.backgroundImage = `url(${bgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = 'none';
    }
    
    // Apply font
    if (font) {
      document.documentElement.style.setProperty('--page-font', font);
      document.body.style.fontFamily = font;
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
      document.body.style.fontFamily = "";
      document.documentElement.style.removeProperty('--page-font');
    };
  }, [bgColor, bgImage, font]);
  
   // Check if user data is not yet loaded
  if (!user) {
    return <div className="m-5 text-center">Loading...</div>;
  }else if (user){

return (
 <>
  <Head>
    <title>{user.name} Links | Influanto</title>
    <meta name="description" content={`${user.name}'s Links. Powered by Influanto.com`} />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content={`${user.name}'s Links. Powered by Influanto.com`} />
    <meta property="og:description" content={`${user.name}'s Links. Powered by Influanto.com`} />
    <meta name="twitter:title" content={`${user.name}'s Links. Powered by Influanto.com`} />
    <meta name="twitter:description" content={`${user.name}'s Links. Powered by Influanto.com`} />
    <meta property="og:image" content={user.image || fallbackImageUrl} />
    <meta name="twitter:image" content={user.image || fallbackImageUrl} />
  </Head>
  
  {/* Main container with proper spacing for mobile */}
  <div style={{
    minHeight: "100vh",
    paddingBottom: user.hasAccess ? "20px" : "80px", // Extra padding when logo is present
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start"
  }}>
    <div 
      className="p-6 shadow rounded-lg w-[90%] max-w-[90%] md:w-[50%] md:max-w-[50%] lg:w-[40%] lg:max-w-[40%]" 
      style={{
        margin: "0 auto", 
        textAlign: "center", 
        marginTop: "5%", 
        marginBottom: "5%", 
        color: textColor || "#333333",
        backgroundColor: cardBgColor || 'white', // Apply card background color
        fontFamily: font || 'inherit' // Apply font to the card
      }}
    > 
      <div style={{
        margin:"0 auto", 
        textAlign:"center", 
        color: textColor || "#333333",
        fontFamily: font || 'inherit'
      }}>
        <img 
          src={user.image || fallbackImageUrl} 
          onError={(e) => e.currentTarget.src = fallbackImageUrl} 
          style={{ 
            borderRadius: '50%', 
            width:"100px", 
            height:"100px", 
            display:"inline", 
            marginBottom:"2%" 
          }} 
          alt="Avatar" 
        />
                
        <p style={{ fontFamily: font || 'inherit', color: textColor || "#333333" }}>{user.name}</p>
        <p style={{ fontFamily: font || 'inherit', color: textColor || "#333333" }}>
          {user.location && <span className='mr-2'><FontAwesomeIcon icon={faLocation} color="darkred" />{user.location}</span>}
          {user.website && <a href={ user.website } target="_blank" style={{ color: textColor || "#333333" }}><FontAwesomeIcon icon={faGlobe} color="lightblue" /> Website</a>}
        </p>
      
        <p style={{marginBottom:"2%", fontFamily: font || 'inherit', color: textColor || "#333333"}}>{user.bio}</p>

        {/* Social media links */}
        <div style={{ fontFamily: font || 'inherit', color: textColor || "#333333" }}>
          {user.instagram && <a href={"https://instagram.com/" + user.instagram } target="_blank" style={{marginRight:"10px", color:"orange"}}><FontAwesomeIcon icon={faInstagram} /></a>}
          {user.tiktok && <a href={"https://tiktok.com/@" + user.tiktok } target="_blank" style={{marginRight:"10px", color:"pink"}}><FontAwesomeIcon icon={faTiktok} /></a>}
          {user.twitter && <a href={"https://twitter.com/" + user.twitter } target="_blank" style={{marginRight:"10px", color:"lightblue"}}><FontAwesomeIcon icon={faTwitter} /></a>}
          {user.facebook && <a href={user.facebook } target="_blank" style={{marginRight:"10px", color:"blue"}}><FontAwesomeIcon icon={faFacebook} /></a>}
          {user.youtube && <a href={"https://youtube.com/@" + user.youtube } target="_blank" style={{marginRight:"10px", color:"red"}}><FontAwesomeIcon icon={faYoutube} /></a>}
          {user.telegram && <a href={"https://t.me/" + user.telegram } target="_blank" style={{marginRight:"10px", color:"lightblue"}}><FontAwesomeIcon icon={faTelegram} /></a>}
          {user.linkedin && <a href={"https://linkedin.com/" + user.linkedin } target="_blank" style={{marginRight:"10px", color:"darkblue"}}><FontAwesomeIcon icon={faLinkedin} /></a>}
          {user.github && <a href={"https://github.com/" + user.github } target="_blank" style={{marginRight:"10px"}}><FontAwesomeIcon icon={faGithub} /></a>}
          {user.patreon && <a href={"https://patreon.com/" + user.patreon } target="_blank" style={{marginRight:"10px", color:"black"}}><FontAwesomeIcon icon={faPatreon} /></a>}
          {user.substack && <a href={"https://substack.com/" + user.substack } target="_blank" style={{display:"inline-block"}}><img src="/substack.png" width={16}/></a>}
          {displayEmail && <a href={`mailto:${user.email}`} style={{ color: textColor || "#333333" }}><FontAwesomeIcon icon={faEnvelope} color="grey" /></a>}
        </div>

        {/* Music platforms */}
        {user.spotify && <h3 className="mt-5" style={{ fontFamily: font || 'inherit', color: textColor || "#333333" }}>Listen</h3>}
        <div style={{ fontFamily: font || 'inherit', color: textColor || "#333333", marginBottom:"2%" }}>
          {user.spotify && <a href={"https://open.spotify.com/artist/" + user.spotify } target="_blank" style={{marginRight:"10px", color:"green"}}><FontAwesomeIcon icon={faSpotify} /></a>}
          {user.appleMusic && <a href={"https://music.apple.com/" + user.appleMusic } target="_blank" style={{marginRight:"10px", color:"pink"}}><FontAwesomeIcon icon={faApple} /></a>}
          {user.tidal && <a href={"https://tidal.com/" + user.tidal } target="_blank" style={{marginRight:"10px", color:"black", display:"inline-block"}}><img src="/tidal.png" width={16}/></a>}
          {user.youtubeMusic && <a href={"https://music.youtube.com/channel/" + user.youtubeMusic } target="_blank" style={{marginRight:"10px", color:"red"}}><FontAwesomeIcon icon={faSquareYoutube} /></a>}
          {user.amazonMusic && <a href={"https://music.amazon.com/" + user.amazonMusic } target="_blank" style={{marginRight:"10px", color:"orange"}}><FontAwesomeIcon icon={faAmazon} /></a>}
          {user.soundcloud && <a href={"https://soundcloud.com/" + user.soundcloud } target="_blank" style={{marginRight:"10px", color:"orange"}}><FontAwesomeIcon icon={faSoundcloud} /></a>}
          {user.deezer && <a href={"https://deezer.com/" + user.deezer } target="_blank" style={{marginRight:"10px", color:"purple"}}><FontAwesomeIcon icon={faDeezer} /></a>}
          {user.pandora && <a href={"https://pandora.com/" + user.pandora } target="_blank" style={{marginRight:"10px", color:"darkblue", display:"inline-block"}}><img src="/pandora.png" width={16}/></a>}
          {user.bandcamp && <a href={ user.bandcamp } target="_blank" style={{marginRight:"10px", color:"lightblue"}}><FontAwesomeIcon icon={faBandcamp} /></a>}
          {user.soundxyz && <a href={"https://sound.xyz/" + user.soundxyz } target="_blank" style={{marginRight:"10px", display:"inline-block"}}><img src="/soundxyz.png" width={16}/></a>}
        </div>

        {/* Custom links */}
        {links.map((link, index) => 
          link.url && (
            <div 
              key={index} 
              className="p-2 border rounded-lg mb-2" 
              style={{
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: cardBgColor || 'transparent', // Apply card background to links
                fontFamily: font || 'inherit'
              }}
            >
              {isYouTubeLinkCheck(link.url) && link.displayVideo ? (
                <iframe
                    width="100%"
                    height="315"
                    style={{ maxWidth: '100%', borderRadius: '12px' }}
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(link.url)}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            ) : (
              <>
                {link.image && <img src={link.image} alt="Link Image" style={{borderRadius: '50%', width: '30px', height: '30px', marginRight: '10px'}} />}
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    color: linksColor,
                    fontFamily: font || 'inherit'
                  }}
                >
                  {link.name}
                </a>
              </>
            )}
            </div>
          )
        )}

        <hr style={{margin: "5% 0"}}></hr>

{/* MERCH SECTION */}
{user?.hasAccess && user?.printifyShopId && linkInBio?.selectedProducts?.length > 0 && (
  <div className="mt-6 mb-4">
    <h3 className="text-lg font-semibold mb-3 text-center" style={{
      color: textColor,
      fontFamily: font || 'inherit'
    }}>
      Merch
    </h3>
    
    {isLoadingProducts ? (
      <div className="text-center py-8" style={{
        fontFamily: font || 'inherit'
      }}>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    ) : (
      <div className="w-full" style={{ 
        overflowX: "auto", 
        paddingBottom: "8px",
        WebkitOverflowScrolling: "touch"
      }}>
        <div className="flex gap-3" style={{
          width: 'max-content',
          minWidth: '100%',
          paddingLeft: "4px",
          paddingRight: "4px"
        }}>
          {linkInBio.selectedProducts.map((productId: string) => {
            const product = availableProducts.find(p => p.id === productId);
            if (!product) {
              console.log('❌ Product not found for ID:', productId);
              return null;
            }
            
            const productUrl = product.url || '#';
            
            return (
              <a 
                key={productId}
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-3 rounded-lg cursor-pointer transition-transform hover:scale-105 block"
                style={{
                  width: '160px', // Fixed width for consistency
                  minWidth: '160px', // Ensures consistent size
                  maxWidth: '160px', // Prevents growing larger
                  backgroundColor: cardBgColor || 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  textDecoration: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {/* Product Image */}
                <div className="w-full h-24 rounded overflow-hidden bg-gray-100 mb-2" style={{ 
                  width: "100%", 
                  height: "100px", 
                  borderRadius: "6px", 
                  overflow: "hidden", 
                  backgroundColor: "#f0f0f0", 
                  marginBottom: "4px"
                }} >
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('❌ Image failed to load:', product.images[0]);
                        e.currentTarget.src = `https://via.placeholder.com/160x96/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <span className="text-gray-400 text-lg">📦</span>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div>
                  <div className="text-xs font-medium mb-1" style={{
                    color: textColor,
                    fontFamily: font || 'inherit',
                    lineHeight: '1.2',
                    wordWrap: 'break-word',
                    height: '2.4em', // Fixed height to maintain consistency
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.title && product.title.length > 25 
                      ? `${product.title.substring(0, 25)}...` 
                      : product.title || 'Product'
                    }
                  </div>
                  <div className="text-sm font-bold text-center" style={{
                    color: linksColor,
                    fontFamily: font || 'inherit'
                  }}>
                    ${product.variants?.[0]?.price || product.price || 'N/A'}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    )}
  </div>
)}
        {alert && <div className="alert mt-10 w-1/2 m-auto" style={{ fontFamily: font || 'inherit' }}>{alert}</div>}
        <br></br>
      </div>
    </div>
  </div>

  {/* Fixed logo with enhanced mobile styling */}
  {!user.hasAccess && (
    <div style={{ 
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      textAlign: "center",
      zIndex: 1000,
    }}>
      <a href="https://influanto.com" target="_blank" rel="noopener noreferrer">
        <img 
          src="/icon.png" 
          alt="Influanto" 
          style={{ 
            width: "28px", 
            height: "28px", 
            display: "inline-block",
            borderRadius: "50%" 
          }} 
        />
      </a>
    </div>
  )}
</>
);
  }
}

export default LinkInBioPage;