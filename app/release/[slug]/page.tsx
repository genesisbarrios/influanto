"use client"
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import MetaPixel, { trackStreamingClick, trackMerchClick, trackLinkClick } from "@/components/MetaPixel";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faTelegram, faTiktok, faSoundcloud, faLinkedin, faApple, faAmazon, faEtsy, faYoutube, faPatreon, faGithub, faWebAwesome, faWebflow, faTwitter, faSpotify, faBandcamp, faDeezer, faYoutubeSquare } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { usePathname } from 'next/navigation'
import NewsletterSignup from "@/components/NewsletterSignup";

const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const ReleasePageView = () => {
  // Core state
  const [slug, setSlug] = useState("");
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [releasePage, setReleasePage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState("");

  // Color states
  const [bgColor, setBgColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [linksColor, setLinksColor] = useState("");

  // Social media states
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

  // Merch states
  const [merchProducts, setMerchProducts] = useState<any[]>([]);
  const [isLoadingMerch, setIsLoadingMerch] = useState(false);

  const pathname = usePathname();

  // Extract slug from pathname
  useEffect(() => {
    if (pathname) {
      const extractedSlug = pathname.split("/")[2];
      if (extractedSlug && extractedSlug !== slug) {
        console.log('🔗 Setting slug:', extractedSlug);
        setSlug(extractedSlug);
      }
    }
  }, [pathname]);

  // Function to fetch merch products
  const fetchMerchProducts = async (userId: string, selectedProductIds: string[]) => {
    if (!selectedProductIds || selectedProductIds.length === 0) {
      setMerchProducts([]);
      return;
    }

    console.log('🛍️ Fetching merch products for release page...');
    setIsLoadingMerch(true);
    try {
      const response = await fetch(`/api/products/${userId}`);
      if (response.ok) {
        const allProducts = await response.json();
        const filteredProducts = allProducts.filter((product: any) => 
          selectedProductIds.includes(product.id)
        );
        console.log('✅ Filtered merch products:', filteredProducts);
        setMerchProducts(filteredProducts);
      } else {
        console.error('❌ Error fetching products');
        setMerchProducts([]);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setMerchProducts([]);
    } finally {
      setIsLoadingMerch(false);
    }
  };

  // Main data fetching function
  const getReleasePage = async () => {
    if (!slug) {
      console.log('⏳ No slug available yet');
      return;
    }

    console.log('🚀 Fetching release page data for slug:', slug);
    setIsLoading(true);
    
    try {
      const response = await apiClient.get(`/release/${slug}`);
      const data = response.data;

      console.log('✅ Release page data received:', data);

      // Set user data
      if (data.user) {
        setUser(data.user);
        setUserName(data.user.username || data.user.name || "");
        
        // Set all social media states
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
        setWebsite(data.user.website || "");
      }
      
      // Set release page data
      if (data.releasePage) {
        setReleasePage(data.releasePage);
        setBgColor(data.releasePage.bgColor || "");
        setTextColor(data.releasePage.textColor || "");
        setLinksColor(data.releasePage.linksColor || "");

        // Fetch merch if available
        if (data.releasePage.selectedProducts && data.releasePage.selectedProducts.length > 0 && data.user?.id) {
          await fetchMerchProducts(data.user.id, data.releasePage.selectedProducts);
        }
      }

    } catch (e: any) {
      console.error('❌ Error in getReleasePage:', e);
      setAlert(e?.message || 'Failed to load release page');
    } finally {
      setIsLoading(false);
    }
  };

  // Call getReleasePage when slug changes
  useEffect(() => {
    if (slug) {
      getReleasePage();
    }
  }, [slug]);

  // Track page visit once release page data is loaded
  useEffect(() => {
    if (releasePage?.id) {
      fetch('/api/analytics/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releasePageId: releasePage.id }),
      }).catch(() => {});
    }
  }, [releasePage?.id]);

  // Set metadata after all data is loaded
  // Replace the metadata useEffect with this complete version:

useEffect(() => {
  if (user && releasePage && slug && userName) {
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
    
    // Update twitter:card
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');
    
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
    
    // Update twitter:site
    let twitterSite = document.querySelector('meta[name="twitter:site"]');
    if (!twitterSite) {
      twitterSite = document.createElement('meta');
      twitterSite.setAttribute('name', 'twitter:site');
      document.head.appendChild(twitterSite);
    }
    twitterSite.setAttribute('content', '@influanto');
    
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
      `${userDisplayName}, ${releasePage.name || 'music'}, release, music, streaming, ${userName}, influanto, new music, artist, song`
    );
    
    // Add music release date if available
    if (releasePage.releaseDate) {
      let musicReleaseDate = document.querySelector('meta[property="music:release_date"]');
      if (!musicReleaseDate) {
        musicReleaseDate = document.createElement('meta');
        musicReleaseDate.setAttribute('property', 'music:release_date');
        document.head.appendChild(musicReleaseDate);
      }
      musicReleaseDate.setAttribute('content', releasePage.releaseDate);
    }
    
    // Add structured data for music
    let structuredData = document.querySelector('#music-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('type', 'application/ld+json');
      structuredData.setAttribute('id', 'music-structured-data');
      document.head.appendChild(structuredData);
    }
    
    const structuredDataContent = {
      "@context": "https://schema.org",
      "@type": "MusicRelease",
      "name": releasePage.name,
      "description": releasePage.description || `${userDisplayName}'s latest release`,
      "image": imageUrl,
      "url": `https://influanto.com/release/${slug}`,
      "datePublished": releasePage.releaseDate || new Date().toISOString(),
      "byArtist": {
        "@type": "MusicGroup",
        "name": userDisplayName,
        "url": `https://influanto.com/${userName}`
      },
      "recordLabel": {
        "@type": "Organization",
        "name": "Independent"
      }
    };
    
    structuredData.textContent = JSON.stringify(structuredDataContent);
    
    console.log('✅ Metadata updated successfully');
    
    // Verification after a delay
    setTimeout(() => {
      console.log('🔍 Final verification:');
      console.log('Page title:', document.title);
      console.log('OG title:', document.querySelector('meta[property="og:title"]')?.getAttribute('content'));
      console.log('OG image:', document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
      console.log('OG url:', document.querySelector('meta[property="og:url"]')?.getAttribute('content'));
      console.log('Twitter card:', document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'));
      console.log('Structured data:', document.querySelector('#music-structured-data')?.textContent);
    }, 1000);
  } else {
    console.log('⏳ Waiting for data to load...', { 
      hasUser: !!user, 
      hasUserName: !!userName, 
      hasReleasePage: !!releasePage, 
      hasSlug: !!slug 
    });
  }
}, [user, userName, releasePage, slug]);

  // Set background color
  useEffect(() => {
    if (bgColor) {
      document.documentElement.style.setProperty("--bg-color", bgColor);
      document.body.style.backgroundColor = bgColor;
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [bgColor]);

  // Utility functions
  function isYouTubeLinkCheck(url: string): boolean {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  }

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
    if (url.includes("amazon.com")) return "Amazon Music";
    
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
        return faAmazon;
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
      maxWidth: typeof window !== 'undefined' && window.innerWidth <= 768 ? "95%" : "60%",
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
        <div
          className="grid grid-cols-2 md:grid-cols-3"
          style={{
            gap: "20px",
            padding: "0 20px"
          }}
        >
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
                  trackMerchClick(product.title, product.url);
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

  // Loading state
  if (isLoading || !slug) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        backgroundColor: bgColor || "black",
        color: textColor || "white"
      }}>
        Loading release page...
      </div>
    );
  }

  // Error state
  if (!user || !releasePage) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        backgroundColor: bgColor || "black",
        color: textColor || "white"
      }}>
        {alert || "Release page not found"}
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: "center",
        minHeight: "100vh",
        padding: "5% 0",
        color: textColor || "white",
        backgroundColor: bgColor || "black",
        fontFamily: releasePage?.font || 'inherit',
      }}
    >
      {user?.metaPixelId && (
        <MetaPixel
          pixelId={user.metaPixelId}
          contentName={releasePage.name || "Release"}
          contentType="release_page"
        />
      )}
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
          alt="Release Cover"
        />

        {/* Name and Description */}
        <p>{releasePage.name}</p>
        <p style={{ marginBottom: "2%" }}>{releasePage.description}</p>
            
        {/* Links */}
        <div
          className="responsive-container"
          style={{
            margin: "0 auto",
            textAlign: "center",
            marginTop: "2%",
            fontFamily: releasePage?.font || 'inherit',
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
              <div key={index} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                padding: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "8px"
              }}>
                <div style={{ 
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
                  onClick={() => trackStreamingClick(platformName, link.url)}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    backgroundColor: releasePage.linksColor || linksColor,
                    color: "white",
                    borderRadius: "5px",
                    textDecoration: "none",
                    fontWeight: "bold"
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
          className="text-lg md:text-2xl"
          style={{ marginTop: "50px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}
          onClick={(e) => {
            const a = (e.target as Element).closest('a');
            if (a?.href) trackLinkClick(new URL(a.href).hostname.replace(/^www\./, ''), a.href, 'social');
          }}
        >
          {instagram && (
            <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faInstagram} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {twitter && (
            <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTwitter} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {facebook && (
            <a href={user.facebook} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faFacebook} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {linkedin && (
            <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faLinkedin} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {telegram && (
            <a href={`https://t.me/${user.telegram}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTelegram} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {github && (
            <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faGithub} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {tiktok && (
            <a href={`https://tiktok.com/@${user.tiktok}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faTiktok} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {youtube && (   
            <a href={`https://youtube.com/${user.youtube}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faYoutube} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {youtubeMusic && (
            <a href={`https://music.youtube.com/${user.youtubeMusic}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faYoutubeSquare} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {amazonMusic && (
            <a href={`https://music.amazon.com/${user.amazonMusic}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faAmazon} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {soundcloud && (
            <a href={`https://soundcloud.com/${user.soundcloud}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faSoundcloud} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {pandora && (
            <a href={`https://pandora.com/${user.pandora}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faGlobe} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {tidal && (
            <a href={`https://tidal.com/${user.tidal}`} target="_blank" rel="noopener noreferrer">
              <img
                src="/tidal.png"
                alt="Tidal"
                className="w-[18px] h-[18px] md:w-[24px] md:h-[24px]"
                style={{
                  objectFit: "contain",
                  borderRadius: "15%",
                  backgroundColor: linksColor || "white"
                }}
              />
            </a>
          )}
          {deezer && (
            <a href={`https://deezer.com/${user.deezer}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faDeezer} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {bandcamp && (
            <a href={`https://bandcamp.com/${user.bandcamp}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faBandcamp} style={{ color: linksColor || "white" }} />
            </a>
          )}  
          {soundxyz && (  
            <a href={`https://sound.xyz/${user.soundxyz}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faWebAwesome} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {patreon && (
            <a href={`https://patreon.com/${user.patreon}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faPatreon} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {substack && (
            <a href={`https://substack.com/${user.substack}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faWebflow} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {etsy && (
            <a href={`https://etsy.com/${user.etsy}`} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faEtsy} style={{ color: linksColor || "white" }} />
            </a>
          )}
          {website && (
            <a href={user.website} target="_blank" rel="noopener noreferrer">
              <FontAwesomeIcon icon={faGlobe} style={{ color: linksColor || "white" }} />
            </a>
          )}
        </div>

        {/* ── Newsletter signup ── */}
        {releasePage?.newsletterEnabled && (
          <div className="mt-8 px-4">
            <NewsletterSignup
              username={userName}
              source="release_page"
              fields={releasePage.newsletterFields}
              textColor={textColor}
              linksColor={linksColor}
              style={user?.newsletterStyle}
            />
          </div>
        )}

        {/* ── Brand logo (premium users) ── */}
        {user?.hasAccess && releasePage?.brandLogoUrl && (
          <div className="mt-12 flex justify-center">
            {user?.website ? (
              <a
                href={/^https?:\/\//i.test(user.website) ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={releasePage.brandLogoUrl}
                  alt="Brand logo"
                  style={{ maxHeight: "30px", maxWidth: "30px", objectFit: "contain", cursor: "pointer" }}
                />
              </a>
            ) : (
              <img
                src={releasePage.brandLogoUrl}
                alt="Brand logo"
                style={{ maxHeight: "30px", maxWidth: "30px", objectFit: "contain" }}
              />
            )}
          </div>
        )}

        {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
      </div>

      {/* RESPONSIVE STYLES AT THE BOTTOM */}
  <style jsx global>{`
    .responsive-container {
      width: 35%;
    }

    .responsive-link {
      width: 100%;
    }

    .merch-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    @media (max-width: 768px) {
      .responsive-container {
        width: 80% !important;
      }

      .responsive-link {
        width: 100%;
      }

      .merch-grid {
        grid-template-columns: 1fr 1fr !important;
      }
    }
  `}</style>
    </div>
  );
};

export default ReleasePageView;