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
import { faGlobe, faLocation } from "@fortawesome/free-solid-svg-icons";
import { set } from "mongoose";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
import { useRouter } from 'next/navigation'; 
import { usePathname, useSearchParams } from 'next/navigation'

const LinkInBioPage =  () => {
  const router = useRouter();
  const [user, setUser] = useState<any>();
  const [userName, setUserName] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
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
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");
  
  const pathname = usePathname()
  const searchParams = useSearchParams()
 
  useEffect(() => {
    const url = `${pathname}`
    console.log(url);
    setUserName(url.split("/")[1]);
    console.log(userName);
  }, [pathname, searchParams, userName])

  const getUser = async () => {
    if(userName){
        try {
        const response = await apiClient.get(`/linkinbio/${userName}`);
        const data = response.data;

        console.log(data);
        setAvatarImage(data.user.image);
        setFormName(data.user.name);
        setFormEmail(data.user.email);
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
        setBgColor(data.linkInBio?.backgroundColor);
        setTextColor(data.linkInBio?.textColor);
        setLinksColor(data.linkInBio?.linksColor);
        setLinks(data.linkInBio?.links);
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
  
  useEffect(() => {
    if (bgColor) {
      document.documentElement.style.setProperty("--bg-color", bgColor);
    }
    
    return () => {
      document.body.style.backgroundColor = ""; // Reset when the component unmounts
    };
  }, [bgColor]);
  
   // Check if user data is not yet loaded
  if (!user) {
    return <div className="m-5 text-center">Loading...</div>;
  }else if (user){
    return (
     
      <div className="p-6 bg-white shadow w-3/4 md:w-1/2 rounded-lg" style={{margin:"0 auto", textAlign:"center", marginTop:"5%", color:"#333333"}}> 
          <div style={{margin:"0 auto", textAlign:"center", color:textColor}}>
            <img src={user.image || fallbackImageUrl} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline", marginBottom:"2%"}} alt="Avatar" />
                    
            <p>{user.name}</p>
            <p>
              {user.location && <span className='mr-2'><FontAwesomeIcon icon={faLocation} color="darkred" />{user.location}</span>}
              {user.website && <a href={ user.website } target="_blank"><FontAwesomeIcon icon={faGlobe} color="lightblue" /> Website</a>}
            </p>
          
            <p style={{marginBottom:"2%"}}>{user.bio}</p>

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
            
            {user.spotify && <h3 className="mt-5">Listen</h3>}
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
            
            <hr style={{margin: "5% 0"}}></hr>

            {links.map((link, index) => 
              link.url && (
                <div key={index} className="p-2 border rounded-lg mb-2" style={{borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {isYouTubeLinkCheck(link.url) ? (
                    <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(link.url)}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                ) : (
                  <>
                    {link.image && <img src={link.image} alt="Link Image" style={{borderRadius: '50%', width: '30px', height: '30px', marginRight: '10px'}} />}
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{color: linksColor}}>{link.name}</a>
                  </>
                )}
                </div>
              )
            )}
            {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
            <br></br>
          </div>
        </div>
    );
  }
};

export default LinkInBioPage;