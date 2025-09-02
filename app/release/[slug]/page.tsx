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
import { faGlobe, faLocation, faEnvelope, faShoppingBag } from "@fortawesome/free-solid-svg-icons";
import { set } from "mongoose";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
import { useRouter } from 'next/navigation'; 
import { usePathname, useSearchParams } from 'next/navigation'


const ReleasePageView =  () => {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [user, setUser] = useState<any>();
  const [userName, setUserName] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [displayEmail, setDisplayEmail] = useState<Boolean>();
  const [avatarImage, setAvatarImage] = useState(null);
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedIn] = useState("");
  const [youtube, setYouTube] = useState("");
  const [tiktok, setTikTok] = useState("");
  const [github, setGithub] = useState("");
  const [patreon, setPatreon] = useState("");
  const [substack, setSubstack] = useState("");
  const [telegram, setTelegram] = useState("");
  const [etsy, setEtsy] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [spotify, setSpotify] = useState("");
  const [appleMusic, setAppleMusic] = useState("");
  const [tidal, setTidal] = useState("");
  const [amazonMusic, setAmazonMusic] = useState("");
  const [soundcloud, setSoundCloud] = useState("");
  const [deezer, setDeezer] = useState("");
  const [pandora, setPandora] = useState("");
  const [youtubeMusic, setYouTubeMusic] = useState("");
  const [bandcamp, setBandcamp] = useState("");
  const [soundxyz, setSoundxyz] = useState("");
  const [bgColor, setBgColor] = useState("");
  const [textColor, setTextColor]  = useState("");
  const [linksColor, setLinksColor] = useState("");
  const [releasePage, setReleasePage] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");

  // Add merch-related states
  const [merchProducts, setMerchProducts] = useState<any[]>([]);
  const [isLoadingMerch, setIsLoadingMerch] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();

useEffect(() => {
  // Only run when we have ALL the required data loaded
  if (user && userName && releasePage && slug) {
    const releaseTitle = releasePage.name ? `"${releasePage.name}"` : "New Release";
    const userDisplayName = user.name || userName;
    
    console.log('🏷️ Setting metadata for release page:', { userDisplayName, releaseTitle, slug });
    
    // Set page title
    document.title = `${userDisplayName}'s ${releaseTitle} | Influanto`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 
      `Listen to ${userDisplayName}'s latest release ${releaseTitle}. ${releasePage.description || 'Available on all streaming platforms.'} Follow ${userDisplayName} on Influanto.`
    );
    
    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${userDisplayName}'s ${releaseTitle} | Influanto`);
    
    // Update og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 
      `Listen to ${userDisplayName}'s latest release ${releaseTitle}. ${releasePage.description || 'Available on all streaming platforms.'} Follow ${userDisplayName} on Influanto.`
    );
    
    // Update og:image - use release image if available, fallback to user image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    const imageUrl = releasePage.image || user.image || fallbackImageUrl;
    ogImage.setAttribute('content', imageUrl);
    
    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', `https://influanto.com/release/${slug}`);
    
    // Update og:type to music for releases
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.setAttribute('content', 'music.song');
    
    // Add music-specific Open Graph tags
    let ogMusicMusician = document.querySelector('meta[property="music:musician"]');
    if (!ogMusicMusician) {
      ogMusicMusician = document.createElement('meta');
      ogMusicMusician.setAttribute('property', 'music:musician');
      document.head.appendChild(ogMusicMusician);
    }
    ogMusicMusician.setAttribute('content', userDisplayName);
    
    // Update twitter:title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', `${userDisplayName}'s ${releaseTitle} | Influanto`);
    
    // Update twitter:description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', 
      `Listen to ${userDisplayName}'s latest release ${releaseTitle}. ${releasePage.description || 'Available on all streaming platforms.'}`
    );
    
    // Update twitter:image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', imageUrl);
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://influanto.com/release/${slug}`);
    
    // Update author
    let author = document.querySelector('meta[name="author"]');
    if (!author) {
      author = document.createElement('meta');
      author.setAttribute('name', 'author');
      document.head.appendChild(author);
    }
    author.setAttribute('content', userDisplayName);
    
    // Update keywords
    let keywords = document.querySelector('meta[name="keywords"]');
    if (!keywords) {
      keywords = document.createElement('meta');
      keywords.setAttribute('name', 'keywords');
      document.head.appendChild(keywords);
    }
    keywords.setAttribute('content', 
      `${userDisplayName}, ${releasePage.name || 'music'}, release, music, streaming, ${userName}, influanto`
    );
    
    console.log('✅ Metadata updated successfully');
  } else {
    console.log('⏳ Waiting for data to load...', { 
      hasUser: !!user, 
      hasUserName: !!userName, 
      hasReleasePage: !!releasePage, 
      hasSlug: !!slug 
    });
  }
}, [user, userName, releasePage, slug]); // This will run when ALL dependencies are loaded

  useEffect(() => {
    const url = `${pathname}`
    console.log(url);
    setSlug(url.split("/")[2]);
    console.log(slug);
  }, [pathname, searchParams, userName])

// Function to fetch merch products
const fetchMerchProducts = async (userId: string, selectedProductIds: string[]) => {
  if (!selectedProductIds || selectedProductIds.length === 0) {
    console.log('🚫 No selected products to fetch');
    setMerchProducts([]);
    return;
  }

  console.log('🛍️ Fetching merch products for release page...');
  console.log('👤 User ID:', userId);
  console.log('🆔 Selected Product IDs:', selectedProductIds);
  setIsLoadingMerch(true);
  
  try {
    const url = `/api/products/${userId}`;
    console.log('📞 Fetching products from:', url);
    
    const response = await fetch(url);
    
    if (response.ok) {
      const allProducts = await response.json();
      console.log('✅ All products received:', allProducts);
      console.log('📊 Total products count:', allProducts.length);
      
      // Filter products based on selectedProductIds
      const filteredProducts = allProducts.filter((product: any) => {
        const isSelected = selectedProductIds.includes(product.id);
        console.log(`🔍 Product ${product.id} (${product.title}): ${isSelected ? 'SELECTED' : 'not selected'}`);
        return isSelected;
      });
      
      console.log('✅ Filtered merch products:', filteredProducts);
      console.log('📊 Filtered products count:', filteredProducts.length);
      setMerchProducts(filteredProducts);
    } else {
      const errorText = await response.text();
      console.error('❌ Error response:', response.status, errorText);
      setMerchProducts([]);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    setMerchProducts([]);
  } finally {
    setIsLoadingMerch(false);
  }
};

  // Replace the getReleasePage function with this enhanced version:

const getReleasePage = async () => {
  if (slug) {
    try {
      const response = await apiClient.get(`/release/${slug}`);
      const data = response.data;

      // Ensure all properties are being set
      setInstagram(data.user.instagram || "");
      setTwitter(data.user.twitter || "");
      setFacebook(data.user.facebook || "");
      setLinkedIn(data.user.linkedin || "");
      setYouTube(data.user.youtube || "");
      setTikTok(data.user.tiktok || "");
      setGithub(data.user.github || "");
      setPatreon(data.user.patreon || "");
      setSubstack(data.user.substack || "");
      setTelegram(data.user.telegram || "");
      setEtsy(data.user.etsy || "");
      setSpotify(data.user.spotify || "");
      setAppleMusic(data.user.appleMusic || "");
      setTidal(data.user.tidal || "");
      setAmazonMusic(data.user.amazonMusic || "");
      setSoundCloud(data.user.soundcloud || "");
      setDeezer(data.user.deezer || "");
      setPandora(data.user.pandora || "");
      setYouTubeMusic(data.user.youtubeMusic || "");
      setBandcamp(data.user.bandcamp || "");
      setSoundxyz(data.user.soundxyz || "");

      setAvatarImage(data.user.image);
      setFormName(data.user.name);
      setFormEmail(data.user.email);
      setDisplayEmail(data.user.displayEmail);
      setLocation(data.user.location);
      setWebsite(data.user.website);
      setBio(data.user.bio);
      setUser(data.user);
      setBgColor(data.releasePage?.bgColor);
      setTextColor(data.releasePage?.textColor);
      setLinksColor(data.releasePage?.linksColor);
      setReleasePage(data.releasePage);

      // Fetch merch products if there are selectedProducts
      if (data.releasePage?.selectedProducts && data.releasePage.selectedProducts.length > 0) {
        console.log('🛍️ Release page has selected products:', data.releasePage.selectedProducts);
        
        // Check if we have a valid user ID
        if (data.user?.id) {
          console.log('✅ Valid user ID found, fetching products...');
          await fetchMerchProducts(data.user.id, data.releasePage.selectedProducts);
        } else {
          console.error('❌ No valid user ID found:', user);
        }
      } else {
        console.log('🚫 No selected products found');
      }
    } catch (e) {
      console.error('❌ Error in getReleasePage:', e);
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

  function getYouTubeEmbedUrl(url: string): string {
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const playlistIdMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;

    if (videoId && playlistId) {
      return `https://www.youtube.com/embed/${videoId}?list=${playlistId}`;
    } else if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    return url; // Fallback to the original URL if no match
  }

  function getPlatformName(url: string): string {
    if (url.includes("spotify.com")) return "Spotify";
    if (url.includes("apple.com")) return "Apple Music";
    if (url.includes("tidal.com")) return "Tidal";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
    if (url.includes("soundcloud.com")) return "SoundCloud";
    if (url.includes("deezer.com")) return "Deezer";
    if (url.includes("pandora.com")) return "Pandora";
    if (url.includes("bandcamp.com")) return "Bandcamp";
    if (url.includes("sound.xyz")) return "Sound.xyz";
    if (url.includes("amazon.com")) return "Amazon Music"; // Capitalize Amazon Music
    
    // Default case: Extract the name before the first dot
    const match = url.match(/:\/\/(www\.)?([^\.]+)/);
    return match ? match[2] : "Unknown Platform";
  }

  function getPlatformIcon(platformName: string) {
    switch (platformName.toLowerCase()) {
      case "spotify":
        return faSpotify;
      case "apple music":
        return faApple;
      case "tidal":
        return faAmazon; // Replace with Tidal icon if available
      case "youtube":
        return faYoutube;
      case "soundcloud":
        return faSoundcloud;
      case "deezer":
        return faDeezer;
      case "pandora":
        return faGlobe; // Replace with Pandora icon if available
      case "bandcamp":
        return faBandcamp;
      case "sound.xyz":
        return faGlobe; // Replace with Sound.xyz icon if available
      case "amazon music":
        return faAmazon;// Replace with Sound.xyz icon if available
      default:
        return faGlobe; // Default icon
    }
  }

  // Render merch section
  const renderMerchSection = () => {
    if (!releasePage?.selectedProducts || releasePage.selectedProducts.length === 0) {
      return null;
    }

    return (
      <div style={{ 
        marginTop: "40px", 
        marginBottom: "40px",
        width: "100%",
        maxWidth: window.innerWidth <= 768 ? "95%" : "60%",
        margin: "40px auto"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          marginBottom: "20px" 
        }}>
          <h3 style={{ 
            color: textColor || "white", 
            margin: 0, 
            fontSize: "18px", 
            fontWeight: "bold" 
          }}>
            Merch
          </h3>
        </div>

        {isLoadingMerch ? (
          <div style={{ 
            textAlign: "center", 
            color: textColor || "white", 
            padding: "20px" 
          }}>
            Loading merch...
          </div>
        ) : merchProducts.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: textColor || "white", 
            padding: "20px" 
          }}>
            No merch available
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: window.innerWidth <= 768 ? "1fr 1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            padding: "0 20px"
          }}>
            {merchProducts.map((product: any) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  padding: "15px",
                  textAlign: "center",
                  border: `1px solid ${linksColor || "white"}20`,
                  transition: "transform 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onClick={() => {
                  if (product.url) {
                    window.open(product.url, '_blank');
                  }
                }}
              >
                {product.images && product.images[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "10px"
                    }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150x150/4ecdc4/ffffff?text=Merch';
                    }}
                  />
                )}
                
                <div style={{
                  color: textColor || "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "5px",
                  lineHeight: "1.2"
                }}>
                  {product.title || 'Untitled Product'}
                </div>
                
                <div style={{
                  color: linksColor || "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "10px"
                }}>
                  ${product.variants?.[0]?.price || product.price || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    getReleasePage();
  }, []);

  useEffect(() => {
   if(!user){
    getReleasePage();
   }else{
    console.log("user:");
    console.log(user);
    console.log(releasePage);
   }
  }, [user, userName, bgColor, textColor, linksColor, user, releasePage]);
  
  useEffect(() => {
    if (releasePage) {
      setBgColor(releasePage.backgroundColor || "");
      setTextColor(releasePage.textColor || "");
      setLinksColor(releasePage.linksColor || "");
    }
  }, [releasePage]);

  useEffect(() => {
    if (bgColor) {
      document.documentElement.style.setProperty("--bg-color", bgColor);
    }
    
    return () => {
      document.body.style.backgroundColor = ""; // Reset when the component unmounts
    };
  }, [bgColor]);

  useEffect(() => {
    getReleasePage();
  }, [slug]);
  
   // Check if user data is not yet loaded
  if (!user) {
    return <div className="m-5 text-center">Loading...</div>;
  }else if (user){
    return (
      <div
        style={{
          textAlign: "center", minHeight:"100vh",
          padding: "5% 0",
          color: textColor || "white",
          backgroundColor: bgColor || "black",
          fontFamily: releasePage?.font || 'inherit',
        }}
      >
        <div>
          {/* Image */}
          <img
            src={releasePage.image || fallbackImageUrl}
            onError={(e) => (e.currentTarget.src = fallbackImageUrl)}
            style={{
              borderRadius: "15px",
              width: "200px",
              height: "auto",
              display: "inline",
              marginBottom: "2%",
            }}
            alt="Avatar"
          />

          {/* Name and Description */}
          <p>{releasePage.name}</p>
          <p style={{ marginBottom: "2%" }}>{releasePage.description}</p>
            
        {/* Links */}
        <div
          style={{
            margin: "0 auto",
            width: "25%",
            textAlign: "center",
            marginTop: "2%",
            fontFamily: releasePage?.font || 'inherit',
            ...(window.innerWidth <= 768 ? { width: "80%" } : {}),
          }}
        >
       
{/* Display releasePage.video at the top if it exists */}
{releasePage.video && (
  <div style={{ marginBottom: "30px" }}>
    <div 
      className="video-responsive"
      style={{
        position: "relative",
        paddingBottom: "56.25%", // 16:9 aspect ratio (9/16 = 0.5625)
        height: 0,
        overflow: "hidden",
        borderRadius: "12px",
        backgroundColor: "#000"
      }}
    >
      <iframe
        style={{ 
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none"
        }}
        src={getYouTubeEmbedUrl(releasePage.video)}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Featured Video"
      />
    </div>
  </div>
)}

          {/* Render ALL links (including YouTube) as regular links */}
          {releasePage.links?.map((link: { url: string; name: string }, index: number) => {
            if (!link.url) return null;
            
            const platformName = getPlatformName(link.url);
            const platformIcon = getPlatformIcon(platformName);
            const buttonText = ["Amazon Music", "Bandcamp", "Sound.xyz"].includes(platformName)
              ? "Buy / Stream"
              : "Stream";

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  fontFamily: releasePage?.font || 'inherit',
                  ...(window.innerWidth <= 768 ? { width: "80%" } : {}),
                }}
              >
                <div style={{  
                  marginBottom: "20px", 
                  display: "flex", 
                  alignItems: "center", 
                  flex: 1,
                  fontFamily: releasePage?.font || 'inherit'
                }}>
                  {platformIcon && (
                    <FontAwesomeIcon
                      icon={platformIcon}
                      style={{
                        marginRight: "10px",
                        fontSize: "20px",
                        color: linksColor || "white",
                      }}
                    />
                  )}
                  <p style={{ 
                    margin: 0, 
                    fontWeight: "bold", 
                    color: linksColor || "white",
                    fontFamily: releasePage?.font || 'inherit'
                  }}>
                    {link.name || platformName}
                  </p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",  
                    marginBottom: "20px",
                    padding: "5px 10px", 
                    fontSize: "13px",
                    backgroundColor: releasePage.linksColor,
                    color: "white",
                    borderRadius: "5px",
                    textDecoration: "none",
                    fontFamily: releasePage?.font || 'inherit'
                  }}
                >
                  {buttonText}
                </a>
              </div>
            );
          })}
        </div>
          {/* Merch Section */}
          {renderMerchSection()}

          {/* User Social Icons */}
          <div
            style={{
              marginTop: "50px",
              display: "flex",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            {instagram && (
              <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faInstagram} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {twitter && (
              <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faTwitter} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {facebook && (
              <a href={user.facebook} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faFacebook} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {linkedin && (
              <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faLinkedin} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {telegram && (
              <a href={`https://t.me/${user.telegram}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faTelegram} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {github && (
              <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faGithub} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {tiktok && (
              <a href={`https://tiktok.com/@${user.tiktok}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faTiktok} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {youtube && (   
              <a href={`https://youtube.com/${user.youtube}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faYoutube} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {youtubeMusic && (
              <a href={`https://music.youtube.com/${user.youtubeMusic}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faYoutubeSquare} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {amazonMusic && (
              <a href={`https://music.amazon.com/${user.amazonMusic}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faAmazon} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {soundcloud && (
              <a href={`https://soundcloud.com/${user.soundcloud}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faSoundcloud} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {pandora && (
              <a href={`https://pandora.com/${user.pandora}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faGlobe} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {tidal && (
              <a href={`https://tidal.com/${user.tidal}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faGlobe} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {deezer && (
              <a href={`https://deezer.com/${user.deezer}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faDeezer} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {bandcamp && (
              <a href={`https://bandcamp.com/${user.bandcamp}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faBandcamp} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}  
            {soundxyz && (  
              <a href={`https://sound.xyz/${user.soundxyz}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faWebAwesome} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {patreon && (
              <a href={`https://patreon.com/${user.patreon}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faPatreon} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {substack && (
              <a href={`https://substack.com/${user.substack}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faWebflow} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
            {etsy && (
              <a href={`https://etsy.com/${user.etsy}`} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faEtsy} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
             {website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faGlobe} style={{ fontSize: "24px", color: linksColor || "white" }} />
              </a>
            )}
           
          </div>

          {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
        </div>
        <style jsx global>{`
          .responsive-container {
            width: 35%;
          }

          .responsive-link {
            width: 100%;
          }

          @media (max-width: 768px) {
            .responsive-container {
              width: 80%;
            }

            .responsive-link {
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }
};

export default ReleasePageView;