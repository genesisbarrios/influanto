"use client"

import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import linkInBioSchema from "@/models/LinkInBio";
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";

const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const LinkInBio =  () => {
  const {data, status} = useSession();
  const [user, setUser] = useState<any>();
  const [linkInBio, setLinkInBio] = useState<any>();
  const [links, setLinks] = useState<any>();
  const [link1, setLink1] = useState<any>();
  const [link2, setLink2] = useState<any>();
  const [link3, setLink3] = useState<any>();
  const [link4, setLink4] = useState<any>();
  const [link5, setLink5] = useState<any>();
  const [link6, setLink6] = useState<any>();
  const [name1, setName1] = useState<any>();
  const [name2, setName2] = useState<any>();
  const [name3, setName3] = useState<any>();
  const [name4, setName4] = useState<any>();
  const [name5, setName5] = useState<any>();
  const [name6, setName6] = useState<any>();

  const [isEditing, setEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [location, setLocation] = useState("");
  const [logoImage, setLogoImage] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlertt] = useState("");

  useEffect(() => {
    getLinks();
  }, []);

  useEffect(() => {
   if(!linkInBio && !isEditing){
    getLinks();
   }
  }, [linkInBio, link1, name1, link2, name2, link3, name3, link5, name5, link6, name6, link4, name4]);

  const getLinks = async () => {
    try {
      const { data } = await apiClient.get("/get-links");
      setLinkInBio(data);
      setLink1(data.link1?.url);
      setName1(data.link1?.name);
      setLink2(data.link2?.url);
      setName2(data.link2?.name);
      setLink3(data.link3?.url);
      setName3(data.link3?.name);
      setLink4(data.link4?.url);
      setName4(data.link4?.name);
      setLink5(data.link5?.url);
      setName5(data.link5?.name);
      setLink6(data.link6?.url);
      setName6(data.link6?.name);
    } catch (e) {
      //console.error(e?.message);
      setAlertt(e?.message);
    } 
  }

  // Assuming avatarImage is a File object
  const convertToBase64 = (avatarImage:any) => {
    if (avatarImage && avatarImage instanceof File) {
      const reader = new FileReader();

      reader.onload = function(event) {
        // Set the Base64 string to the state
        setLogoImage(event.target.result);
      };

      reader.onerror = function(error) {
        console.log('Error: ', error);
      };

      reader.readAsDataURL(avatarImage);
    } else {
      console.log('avatarImage is not a file');
    }
  };

  const handleEditLinkInBio = async (e:any) => {
    e.preventDefault();
    console.log('Edit Link In Bio');
    console.log(logoImage);
    console.log(formName);

    try {
      const { data } = await apiClient.post("/linkinbio", {
        link1: {url: link1, name: name1},
        link2: {url: link2, name: name2},
        link3: {url: link3, name: name3},
        link4: {url: link4, name: name4},
        link5: {url: link5, name: name5},
        link6: {url: link6, name: name6}
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

  const handleFileSelection = (e:any) => {
    if (e.target.files && e.target.files.length > 0) {
      // Update the state with the first selected file
      const img = convertToBase64(e.target.files[0]);
      setLogoImage(img);
    }
  };

  const handleLink1Change = (e:any) => {
    setLink1(e.target.value.toString());
  }
  const handleLink2Change = (e:any) => {
    setLink2(e.target.value.toString());
  }
  const handleLink3Change = (e:any) => {
    setLink3(e.target.value.toString());
  }
  const handleLink4Change = (e:any) => {
    setLink4(e.target.value.toString());
  }
  const handleLink5Change = (e:any) => {
    setLink5(e.target.value.toString());
  }
  const handleLink6Change = (e:any) => {
    setLink6(e.target.value.toString());
  }

  const handleName1Change = (e:any) => {
    setName1(e.target.value.toString());
  }
  const handleName2Change = (e:any) => {
    setName2(e.target.value.toString());
  }
  const handleName3Change = (e:any) => {
    setName3(e.target.value.toString());
  }
  const handleName4Change = (e:any) => {
    setName4(e.target.value.toString());
  }
  const handleName5Change = (e:any) => {
    setName5(e.target.value.toString());
  }
  const handleName6Change = (e:any) => {
    setName6(e.target.value.toString());
  }

   // Check if user data is not yet loaded
  if (!data) {
    return <div>Thanks for signing up...</div>;
  }else{
    if (!isEditing){
    return (
     
      <div className="p-4 bg-white shadow rounded-md">
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
        <div style={{margin:"0 auto", textAlign:"center" }}>
          <img src={data.user.image} onError={(e) => e.currentTarget.src = 'fallbackImageUrl'} style={{ borderRadius: '50%', width:"100px", height:"100px", display:"inline" }} alt="Avatar" />
          <p>{data.user.name}</p>
          <br></br>
          {linkInBio && 
            <div>
             {link1 && 
             <div className="p-2 border rounded-lg">
               <a href={link1} target="_blank">{name1}</a>
             </div>}

              {link2 &&
              <div className="p-2 border">
                <a href={link2} target="_blank">{name2}</a>
              </div>}

              {link3 && 
              <div className="p-2 border">
                <a href={link3} target="_blank">{name3}</a>
              </div>}

              {link4 &&
              <div className="p-2 border">
                <a href={link4} target="_blank">{name4}</a>
              </div>}

              {link5 &&
              <div className="p-2 border">
                <a href={link5} target="_blank">{name5}</a>
              </div>}

              {link6 &&
              <div className="p-2 border">
                <a href={link6} target="_blank">{name6}</a>
              </div>}
            
            <br></br>
              <a 
              className="btn btn-primary btn-block btn-lg btn-narrow"
              style={{width:"auto", display:"inline"}}
              href={"https://influanto.com/" + data.user.name} >
              Visit 
            </a>
              
            </div>
            }
        </div>
        {alert && <div className="alert mt-5 w-full">{alert}</div>}
      </div>
    );
  }else{
    return (
      <div className="p-4 bg-white shadow rounded-md">
        <h2 className="text-2xl font-bold mb-2 inline">Link In Bio</h2>
        <form>
        <h1>Edit Links</h1>
          <div className="flex flex-wrap w-full">
            <div className="w-full lg:w-full p-2">
              <label style={{display:"block"}}>Link 1</label> 
              <input type="text" className="input mb-2 mr-4" placeholder={linkInBio?.link1 || "URL"} onChange={(e) => handleLink1Change(e)} />
              <input type="text" className="input mb-2" placeholder={linkInBio?.name1 || "NAME"} onChange={(e) => handleName1Change(e)} />
            
              <label style={{display:"block"}}>Link 2</label> 
              <input type="text" className="input mb-2 mr-4" placeholder={linkInBio?.link2 || "URL"} onChange={(e) => handleLink2Change(e)} />
              <input type="text" className="input mb-2" placeholder={linkInBio?.name2 || "NAME"} onChange={(e) => handleName2Change(e)} />
            
              <label style={{display:"block"}}>Link 3</label> 
              <input type="text" className="input mb-2 mr-4" placeholder={linkInBio?.link3 || "URL"} onChange={(e) => handleLink3Change(e)} />
              <input type="text" className="input mb-2" placeholder={linkInBio?.name3 || "NAME"} onChange={(e) => handleName3Change(e)} />
              
              <label style={{display:"block"}}>Link 4</label> 
              <input type="text" className="input mb-2 mr-4" placeholder={linkInBio?.link4 || "URL"} onChange={(e) => handleLink4Change(e)} />
              <input type="text" className="input mb-2" placeholder={linkInBio?.name4 || "NAME"} onChange={(e) => handleName4Change(e)} />

              <label style={{display:"block"}}>Link 5</label>  
              <input type="text" className="input mb-2 mr-4" placeholder={linkInBio?.link5 || "URL"} onChange={(e) => handleLink5Change(e)} />
              <input type="text" className="input mb-2" placeholder={linkInBio?.name5 || "NAME"} onChange={(e) => handleName5Change(e)} />
              
              <label style={{display:"block"}}>Link 6</label> 
              <input type="text" className="input mb-2 mr-4" placeholder={linkInBio?.link6 || "URL"} onChange={(e) => handleLink6Change(e)} />
              <input type="text" className="input mb-2" placeholder={linkInBio?.name6 || "NAME"} onChange={(e) => handleName6Change(e)} />
            </div>
          </div>

          <br />
          <button 
            className="btn btn-primary btn-block btn-sm btn-narrow"
            style={{width:"35%", display:"inline", margin:"2% 0"}}
            onClick={(e) => handleEditLinkInBio(e)} 
            type="submit">
            Submit
        </button> 
        <button
          className="btn btn-alert btn-block btn-sm btn-narrow"
          style={{ width: "35%", display: "inline", margin: "2% 5%" }}
          onClick={() => setEditing(false)}> {/* Changed to setEditing(false) to handle cancel */}
          Cancel
        </button>
        </form>
      </div>
   
      );
    }   
  }
};

export default LinkInBio;