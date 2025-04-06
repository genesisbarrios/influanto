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
  
  const pathname = usePathname()
  const searchParams = useSearchParams()
 
  useEffect(() => {
    const url = `${pathname}`
    console.log(url);
    setSlug(url.split("/")[2]);
    console.log(slug);
  }, [pathname, searchParams, userName])

  const getReleasePage = async () => {
    if (slug) {
      try {
        const response = await apiClient.get(`/release/${slug}`);
        const data = response.data;
  
        console.log(data);
        setAvatarImage(data.user.image);
        setFormName(data.user.name);
        setFormEmail(data.user.email);
        setDisplayEmail(data.user.displayEmail);
        setLocation(data.user.location);
        setWebsite(data.user.website);
        setBio(data.user.bio);
        setInstagram(data.user.instagram);
        setTwitter(data.user.twitter);
        setFacebook(data.user.facebook);
        setLinkedIn(data.user.linkedin);
        setYouTube(data.user.youtube);
        setTikTok(data.user.tiktok);
        setGithub(data.user.github);
        setPatreon(data.user.patreon);
        setSubstack(data.user.substack);
        setTelegram(data.user.telegram);
        setEtsy(data.user.etsy);
        setSpotify(data.user.spotify);
        setAppleMusic(data.user.appleMusic);
        setTidal(data.user.tidal);
        setAmazonMusic(data.user.amazonMusic);
        setSoundCloud(data.user.soundcloud);
        setDeezer(data.user.deezer);
        setPandora(data.user.pandora);
        setYouTubeMusic(data.user.youtubeMusic);
        setBandcamp(data.user.bandcamp);
        setSoundxyz(data.user.soundxyz);
        setUser(data.user);
        setBgColor(data.releasePage?.backgroundColor);
        setTextColor(data.releasePage?.textColor);
        setLinksColor(data.releasePage?.linksColor);
        setReleasePage(data.releasePage);
      } catch (e) {
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
      default:
        return faGlobe; // Default icon
    }
  }

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
          textAlign: "center", height:"100vh",
          paddingTop: "5%",
          color: textColor || "white",
          backgroundColor: bgColor || "black",
        }}
      >
        <div>
          {/* Image */}
          <img
            src={releasePage.image || fallbackImageUrl}
            onError={(e) => (e.currentTarget.src = fallbackImageUrl)}
            style={{
              borderRadius: "15px",
              width: "100px",
              height: "100px",
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
              width: "30%",
              textAlign: "center",
              marginTop: "2%",
            }}
          >
            {releasePage.links.map((link: { url: string; displayVideo: boolean }, index: number) => {
              const platformName = getPlatformName(link.url);
              const platformIcon = getPlatformIcon(platformName); // Function to get the platform icon
              return (
                <div
                  key={index}
                  style={{
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {isYouTubeLinkCheck(link.url) && link.displayVideo ? (
                    <iframe
                      width="100%"
                      height="315"
                      style={{ maxWidth: "100%", borderRadius: "12px" }}
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(link.url)}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
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
                        <p style={{ margin: 0, fontWeight: "bold", color: linksColor || "white" }}>
                          {platformName}
                        </p>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "10px 20px",
                          backgroundColor: releasePage.linksColor,
                          color: "white",
                          borderRadius: "5px",
                          textDecoration: "none",
                        }}
                      >
                        Stream
                      </a>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
        </div>
      </div>
    );
  }
};

export default ReleasePageView;