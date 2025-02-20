"use client"

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

  const [link1, setLink1] = useState<any>();
  const [link2, setLink2] = useState<any>();
  const [link3, setLink3] = useState<any>();
  const [link4, setLink4] = useState<any>();
  const [link5, setLink5] = useState<any>();
  const [link6, setLink6] = useState<any>();
  const [link7, setLink7] = useState<any>();
  const [link8, setLink8] = useState<any>();
  const [link9, setLink9] = useState<any>();
  const [link10, setLink10] = useState<any>();
  
  const [name1, setName1] = useState<any>();
  const [name2, setName2] = useState<any>();
  const [name3, setName3] = useState<any>();
  const [name4, setName4] = useState<any>();
  const [name5, setName5] = useState<any>();
  const [name6, setName6] = useState<any>();
  const [name7, setName7] = useState<any>();
  const [name8, setName8] = useState<any>();
  const [name9, setName9] = useState<any>();
  const [name10, setName10] = useState<any>();


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
        setLink1(data.linkInBio?.link1?.url);
        setLink2(data.linkInBio?.link2?.url);
        setLink3(data.linkInBio?.link3?.url);
        setLink4(data.linkInBio?.link4?.url);
        setLink5(data.linkInBio?.link5?.url);
        setLink6(data.linkInBio?.link6?.url);
        setLink7(data.linkInBio?.link7?.url);
        setLink8(data.linkInBio?.link8?.url);
        setLink9(data.linkInBio?.link9?.url);
        setLink10(data.linkInBio?.link10?.url);
        
        setName1(data.linkInBio?.link1?.name);
        setName2(data.linkInBio?.link2?.name);
        setName3(data.linkInBio?.link3?.name);
        setName4(data.linkInBio?.link4?.name);
        setName5(data.linkInBio?.link5?.name);
        setName6(data.linkInBio?.link6?.name);
        setName7(data.linkInBio?.link7?.name);
        setName8(data.linkInBio?.link8?.name);
        setName9(data.linkInBio?.link9?.name);
        setName10(data.linkInBio?.link10?.name);
        
        } catch (e) {
        //console.error(e?.message);
        setAlertt(e?.message);
        } 
    }
  }

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
   if(!user){
    getUser();
   }else{
    //console.log("user:");
    //console.log(user);
   }
  }, [user, userName, bgColor, link1, name1, link2, name2, link3, name3, link5, name5, link6, name6, link4, name4]);
  
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
     
      <div className="p-6 bg-white shadow w-1/2 rounded-lg" style={{margin:"0 auto", textAlign:"center", marginTop:"5%", color:"#333333"}}> 
          <div style={{margin:"0 auto", textAlign:"center" }}>
            <img src={user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline", marginBottom:"2%"}} alt="Avatar" />
            <p>{user.name}</p>
            <p>{user.email}</p>
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

            {link1 &&  <div className="p-2 border rounded-lg mb-2"><a href={link1} >{name1}</a></div>}
            {link2 &&  <div className="p-2 border rounded-lg mb-2"><a href={link2}>{name2}</a></div>}
            {link3 && <div className="p-2 border rounded-lg mb-2"> <a href={link3}>{name3}</a></div>}
            {link4 &&  <div className="p-2 border rounded-lg mb-2"><a href={link4}>{name4}</a></div>}
            {link5 &&  <div className="p-2 border rounded-lg mb-2"><a href={link5}>{name5}</a></div>}
            {link6 &&  <div className="p-2 border rounded-lg mb-2"><a href={link6}>{name6}</a></div>}
            {alert && <div className="alert mt-10 w-1/2 m-auto">{alert}</div>}
            <br></br>
          </div>
        </div>
    );
  }
};

export default LinkInBioPage;