"use client"
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession } from "next-auth/react";
import ReleasePageAnalytics from "@/components/ReleasePageAnalytics";
import { CldUploadWidget } from 'next-cloudinary';
import { debounce } from "lodash";
import posthog from "posthog-js";

const ReleasePages = () => {
  const { data, status } = useSession();
  const [releasePages, setReleasePages] = useState<any[]>([]);
  const [alert, setAlert] = useState("");
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [createPage, setCreatePage] = useState(false);
  const [isNameUnique, setIsNameUnique] = useState(true);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [linksColor, setLinksColor] = useState("#0000ff");
  const [font, setFont] = useState("sans-serif");

  // Add merch-related states
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showMerchSection, setShowMerchSection] = useState(false);
  const [expandedAnalytics, setExpandedAnalytics] = useState<string | null>(null);


  useEffect(() => {
      document.title = "Release Pages | Influanto";
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', 'Release Pages - Create a personalized landing page for your music release.');
  
      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', 'Release Pages | Influanto');

      // Update og:description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', 'All your links on one page. Free Release Pages Tool powered by Influanto.');

      // Update twitter:title
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', 'Link In Bio | Influanto');
  
      // Update twitter:description
      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', 'Share your music easily. Free Release Pages Tool powered by Influanto.');
    }, []);

  // Function to get user data from API
  const getUserData = async (userId: string) => {
    try {
      const { data } = await apiClient.get("/get-user");
      setUserData(data);
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  // Add function to fetch products
  const fetchAvailableProducts = async () => {
    if (!userData?.id) return;
    
    console.log('🔍 Fetching products for release page...');
    setIsLoadingProducts(true);
    try {
      const url = `/api/products/${userData.id}`;
      console.log('📞 Fetching:', url);
      
      const response = await fetch(url);
      
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

  // Function to toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Get the maximum allowed pages based on user status
  const getMaxPages = () => {
    return userData?.hasAccess ? 50 : 10;
  };
  
  const predefinedLinks = [
    { name: "Spotify", url: "" },
    { name: "Apple Music", url: "" },
    { name: "Tidal", url: "" },
    { name: "YouTube Music", url: "" },
    { name: "SoundCloud", url: "" },
    { name: "Pandora", url: "" },
    { name: "Amazon Music", url: "" },
    { name: "Bandcamp", url: "" },
  ];

  const getReleasePages = async (userId: any) => {
    try {
      const { data } = await apiClient.get("/get-release-pages", {
        params: { userId: userId },
      });
      if(data != null ){
        setReleasePages(data);
      }
    } catch (e: any) {
      console.log(e?.message);
      //setAlert(e?.message);
    }
  };

  useEffect(() => {
    if (data?.user?.id) {
      getReleasePages(data?.user?.id);
      getUserData(data?.user?.id);
    }
  }, [data]);

  // Add useEffect to fetch products when user data is available
  useEffect(() => {
    if (userData?.id && userData?.printifyShopId) {
      fetchAvailableProducts();
    }
  }, [userData?.id, userData?.printifyShopId]);

  // Add useEffect to load selected products when editing a page
  useEffect(() => {
    if (editingPage?.selectedProducts && Array.isArray(editingPage.selectedProducts)) {
      setSelectedProductIds(editingPage.selectedProducts);
    } else {
      setSelectedProductIds([]);
    }
  }, [editingPage?.selectedProducts]);

  const handleCreate = async () => {
    setEditingPage({ 
      name: "", 
      description: "", 
      links: [], 
      image: "", 
      video: "", 
      bgColor, 
      linksColor, 
      textColor,
      font,
      selectedProducts: []
    }); 
    setCreatePage(true);
    setSelectedProductIds([]);
  };

  const handleEdit = (page: any) => {
    setEditingPage(page);
    // Populate color states with values from the selected page
    setBgColor(page.bgColor || "#ffffff");
    setTextColor(page.textColor || "#000000");
    setLinksColor(page.linksColor || "#0000ff");
    setFont(page.font || "sans-serif");
    
    // Load selected products for this page
    if (page.selectedProducts && Array.isArray(page.selectedProducts)) {
      setSelectedProductIds(page.selectedProducts);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleImageUpload = (result: any) => {
    const imageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1742637738/${result.info.publicId}.png`;
    setEditingPage({ ...editingPage, image: imageUrl });
  };

  const getYouTubeVideoId = (url: string): { videoId: string | null; playlistId: string | null } => {
    const videoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return {
      videoId: videoMatch ? videoMatch[1] : null,
      playlistId: playlistMatch ? playlistMatch[1] : null,
    };
  };

  const handleLinkChange = (index: number, field: string, value: string) => {
    const updatedLinks = [...(editingPage?.links || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setEditingPage({ ...editingPage, links: updatedLinks });
  };

  const addCustomLink = () => {
    const updatedLinks = [...(editingPage?.links || []), { url: "", name: "" }];
    setEditingPage({ ...editingPage, links: updatedLinks });
  };

  const handleDelete = async (pageId: any) => {
    try {
      console.log('Deleting page with ID:', pageId);
      await apiClient.delete(`/delete-release-page`, {
        data: { id: pageId }
      });
      
      setReleasePages(releasePages.filter((page) => 
        page.id !== pageId && page._id !== pageId
      ));
      
      setAlert("Release page deleted successfully.");
    } catch (e: any) {
      console.error('Delete error:', e);
      setAlert(e?.response?.data?.message || e?.message || "Failed to delete release page.");
    }
  };

  const checkNameUniqueness = debounce(async (name: string) => {
    try {
      const { data } = await apiClient.get("/get-release-page-uniqueness", {
        params: { name: name },
      });
      if(data !== undefined){
        setIsNameUnique(data);
        console.log('uniqueness check', data);
        if(data === false){
          setEditingPage({ ...editingPage, name: "" });
        }
      }
    } catch (e: any) {
      console.error(e?.message);
    }
  }, 300);

  const validateName = (value: string) => {
    if (!value.trim()) {
      setAlert("Release page name is required.");
      return false;
    }
    if (value.length < 3) {
      setAlert("Release page name must be at least 3 characters long.");
      return false;
    }
    if (value.length > 50) {
      setAlert("Release page name cannot be longer than 50 characters.");
      return false;
    }
    if (value.includes(' ')) {
      setAlert("Release page name cannot contain spaces. Use hyphens (-) or underscores (_) instead.");
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setAlert("Release page name can only contain letters, numbers, hyphens (-), and underscores (_).");
      return false;
    }
    if (!/^[a-zA-Z0-9]/.test(value)) {
      setAlert("Release page name must start with a letter or number.");
      return false;
    }
    setAlert("");
    return true;
  };

  const validateDescription = (value: string) => {
    if (value.length > 500) {
      setAlert("Description cannot be longer than 500 characters.");
      return false;
    }
    if (value.includes("@")) {
      setAlert("Description cannot contain @ symbols.");
      return false;
    }
    setAlert("");
    return true;
  };

  const validateURL = (value: string, fieldName: string) => {
    if (!value) return true; // Empty is allowed
    
    if (!value.startsWith("https://") && !value.startsWith("http://")) {
      setAlert(`${fieldName} must start with 'https://' or 'http://'.`);
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(value);
    } catch {
      setAlert(`${fieldName} must be a valid URL.`);
      return false;
    }
    
    if (value.length > 500) {
      setAlert(`${fieldName} URL is too long.`);
      return false;
    }
    
    setAlert("");
    return true;
  };

  const validateYouTubeURL = (value: string) => {
    if (!value) return true; // Empty is allowed
    
    if (!validateURL(value, "YouTube video")) return false;
    
    if (!value.includes("youtube.com") && !value.includes("youtu.be")) {
      setAlert("Please enter a valid YouTube URL.");
      return false;
    }
    
    setAlert("");
    return true;
  };

  const validateSpotifyURL = (value: string) => {
    if (!value) return true; // Empty is allowed
    
    if (!validateURL(value, "Spotify")) return false;
    
    if (!value.includes("spotify.com")) {
      setAlert("Please enter a valid Spotify URL.");
      return false;
    }
    
    setAlert("");
    return true;
  };

  const validateAppleMusicURL = (value: string) => {
    if (!value) return true; // Empty is allowed
    
    if (!validateURL(value, "Apple Music")) return false;
    
    if (!value.includes("music.apple.com")) {
      setAlert("Please enter a valid Apple Music URL.");
      return false;
    }
    
    setAlert("");
    return true;
  };

  const validateCustomLinkName = (value: string) => {
    if (!value.trim()) {
      setAlert("Custom link name is required.");
      return false;
    }
    if (value.length > 50) {
      setAlert("Custom link name cannot be longer than 50 characters.");
      return false;
    }
    if (value.includes("@") || value.includes("http")) {
      setAlert("Custom link name cannot contain @ symbols or URLs.");
      return false;
    }
    setAlert("");
    return true;
  };

  const validateImageURL = (value: string) => {
    if (!value) return true; // Empty is allowed
    
    if (!validateURL(value, "Image")) return false;
    
    // Check if it's likely an image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      value.toLowerCase().includes(ext)
    );
    
    if (!hasImageExtension && !value.includes('cloudinary')) {
      setAlert("Image URL should point to a valid image file.");
      return false;
    }
    
    setAlert("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let name = e.target.value;
    
    // Remove spaces and convert to lowercase as user types
    name = name.replace(/\s+/g, '-').toLowerCase();
    
    // Always update the state so user can type
    setEditingPage({ 
      ...editingPage, 
      name
    });
    
    // Validate and set error message, but don't prevent typing
    if (name && !validateName(name)) {
      // Error already set in validateName function
    } else {
      setAlert("");
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Always update the state
    setEditingPage({ ...editingPage, description: value });
    
    // Validate but don't prevent typing
    if (value && !validateDescription(value)) {
      // Error already set in validateDescription function
    } else {
      setAlert("");
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Always update the state
    setEditingPage({ ...editingPage, video: value });
    
    // Validate but don't prevent typing
    if (value && !validateYouTubeURL(value)) {
      // Error already set in validateYouTubeURL function
    } else {
      setAlert("");
    }
  };

  const handlePredefinedLinkChange = (linkName: string, value: string) => {
    // Always update the state first
    const existingLinkIndex = (editingPage?.links || []).findIndex(
      (l: any) => l.name === linkName
    );
    
    if (existingLinkIndex !== -1) {
      handleLinkChange(existingLinkIndex, "url", value);
    } else {
      setEditingPage({
        ...editingPage,
        links: [
          ...(editingPage?.links || []),
          { name: linkName, url: value },
        ],
      });
    }
    
    // Validate after updating (but don't prevent the update)
    if (value) {
      switch (linkName.toLowerCase()) {
        case 'spotify':
          validateSpotifyURL(value);
          break;
        case 'apple music':
          validateAppleMusicURL(value);
          break;
        case 'youtube music':
        case 'youtube':
          validateYouTubeURL(value);
          break;
        default:
          validateURL(value, linkName);
      }
    } else {
      setAlert("");
    }
  };
  
// Replace the handleCustomLinkNameChange function with this corrected version:
const handleCustomLinkNameChange = (index: number, value: string) => {
  // Get the actual index in the full links array
  const customLinks = (editingPage?.links || []).filter((link: any) => !predefinedLinks.some((p) => p.name === link.name));
  const customLink = customLinks[index];
  
  // Find the actual index in the full links array
  const actualIndex = (editingPage?.links || []).findIndex((link: any) => link === customLink);
  
  if (actualIndex !== -1) {
    // Always update the state
    handleLinkChange(actualIndex, "name", value);
    
    // Validate but don't prevent typing
    if (value && !validateCustomLinkName(value)) {
      // Error already set in validateCustomLinkName function
    } else {
      setAlert("");
    }
  }
};

// Also fix the handleCustomLinkURLChange function:
const handleCustomLinkURLChange = (index: number, value: string) => {
  // Get the actual index in the full links array
  const customLinks = (editingPage?.links || []).filter((link: any) => !predefinedLinks.some((p) => p.name === link.name));
  const customLink = customLinks[index];
  
  // Find the actual index in the full links array
  const actualIndex = (editingPage?.links || []).findIndex((link: any) => link === customLink);
  
  if (actualIndex !== -1) {
    // Always update the state
    handleLinkChange(actualIndex, "url", value);
    
    // Validate but don't prevent typing
    if (value && !validateURL(value, "Custom link")) {
      // Error already set in validateURL function
    } else {
      setAlert("");
    }
  }
};

// And fix the removeCustomLink function too:
const removeCustomLink = (index: number) => {
  // Get the actual index in the full links array
  const customLinks = (editingPage?.links || []).filter((link: any) => !predefinedLinks.some((p) => p.name === link.name));
  const customLink = customLinks[index];
  
  // Find the actual index in the full links array
  const actualIndex = (editingPage?.links || []).findIndex((link: any) => link === customLink);
  
  if (actualIndex !== -1) {
    const updatedLinks = (editingPage?.links || []).filter((_: any, i: number) => i !== actualIndex);
    setEditingPage({ ...editingPage, links: updatedLinks });
  }
};

  // Update your handleSave function to include comprehensive validation:
  const handleSave = async () => {
    try {
      // Validate required fields
      if (!editingPage?.name || !validateName(editingPage.name)) {
        setAlert("Please provide a valid release page name.");
        return;
      }
      
      if (editingPage?.description && !validateDescription(editingPage.description)) {
        return; // Error already set in validation function
      }
      
      if (editingPage?.video && !validateYouTubeURL(editingPage.video)) {
        return; // Error already set in validation function
      }
      
      if (editingPage?.image && !validateImageURL(editingPage.image)) {
        return; // Error already set in validation function
      }
      
      // Validate all links
      if (editingPage?.links) {
        for (let i = 0; i < editingPage.links.length; i++) {
          const link = editingPage.links[i];
          
          if (link.url) {
            // Check predefined links
            const isPredefined = predefinedLinks.some(p => p.name === link.name);
            
            if (isPredefined) {
              let isValid = false;
              switch (link.name.toLowerCase()) {
                case 'spotify':
                  isValid = validateSpotifyURL(link.url);
                  break;
                case 'apple music':
                  isValid = validateAppleMusicURL(link.url);
                  break;
                case 'youtube music':
                case 'youtube':
                  isValid = validateYouTubeURL(link.url);
                  break;
                default:
                  isValid = validateURL(link.url, link.name);
              }
              if (!isValid) return;
            } else {
              // Custom link validation
              if (!validateCustomLinkName(link.name)) return;
              if (!validateURL(link.url, "Custom link")) return;
            }
          }
        }
      }
      
      const maxPages = getMaxPages();
      
      // Check if we're creating a new page and already have the maximum allowed
      if (!editingPage?._id && releasePages.length >= maxPages) {
        const userType = userData?.hasAccess ? "premium" : "free";
        setAlert(`You can only create up to ${maxPages} release pages on the ${userType} plan.`);
        return;
      }

      // Check name uniqueness for new pages
      if (!editingPage?._id && !isNameUnique) {
        setAlert("This name is already taken. Please choose another.");
        return;
      }

      const dataToSend = {
        ...editingPage,
        bgColor,
        textColor,
        linksColor,
        font,
        selectedProducts: selectedProductIds,
      };

      const isNew = !editingPage?._id;
      await apiClient.post(`/release/`, dataToSend);

      if (isNew) {
        posthog.capture("release_page_created", { page_name: editingPage?.name });
      } else {
        posthog.capture("release_page_saved", { page_name: editingPage?.name, page_id: editingPage?._id });
      }

      setEditingPage(null);
      setCreatePage(false);
      setSelectedProductIds([]);
      getReleasePages(data?.user?.id);
      setAlert("Release page saved successfully!");
    } catch (e: any) {
      console.error('❌ Save error:', e?.message);
      posthog.captureException(e);
      setAlert(e?.response?.data?.message || e?.message || "Failed to save release page.");
    }
  };

  const validateReleasePageName = (name: string): { isValid: boolean; message: string } => {
    if (!name) return { isValid: true, message: "" };
    
    if (name.includes(' ')) {
      return { isValid: false, message: "Release page name cannot contain spaces. Use hyphens (-) or underscores (_) instead." };
    }
    
    if (name.length < 3) {
      return { isValid: false, message: "Release page name must be at least 3 characters long." };
    }
    
    if (name.length > 50) {
      return { isValid: false, message: "Release page name must be 50 characters or less." };
    }
    
    const allowedPattern = /^[a-zA-Z0-9_-]+$/;
    if (!allowedPattern.test(name)) {
      return { isValid: false, message: "Release page name can only contain letters, numbers, hyphens (-), and underscores (_)." };
    }
    
    const startsWithLetterOrNumber = /^[a-zA-Z0-9]/.test(name);
    if (!startsWithLetterOrNumber) {
      return { isValid: false, message: "Release page name must start with a letter or number." };
    }
    
    return { isValid: true, message: "" };
  };

  const handleNameBlur = () => {
    if (editingPage?.name) {
      console.log('checking uniqueness', editingPage.name);
      checkNameUniqueness(editingPage.name);
    }
  };

  // Render merch section component
  const renderMerchSection = () => {
    return (
      <>
        <div className="mb-4 p-4 bg-blue-50 rounded-md">
          <h4 className="font-bold mb-2 text-blue-800" style={{
            fontFamily: font || 'inherit'
          }}>Merch Integration</h4>
          <p className="text-blue-600 text-sm" style={{
            fontFamily: font || 'inherit'
          }}>
            {!userData?.printifyShopId 
              ? "Connect your Printify store to your Profile to add merch to your release pages" 
              : "Your Printify store is connected. Select products to feature below."
            }
          </p>
        </div>

        {userData?.printifyShopId && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold" style={{ fontFamily: font || 'inherit' }}>Merch Products</h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowMerchSection(!showMerchSection)}
                style={{ fontFamily: font || 'inherit' }}
              >
                {showMerchSection ? 'Hide Products' : 'Select Products'}
              </button>
            </div>
            
            {selectedProductIds.length > 0 && (
              <div className="mb-2 text-sm text-gray-600" style={{ fontFamily: font || 'inherit' }}>
                {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
              </div>
            )}

            {showMerchSection && (
              <div className="border rounded-md p-4 bg-gray-50" style={{ fontFamily: font || 'inherit' }}>
                {isLoadingProducts ? (
                  <div className="text-center py-4">
                    <div className="animate-pulse" style={{ fontFamily: font || 'inherit' }}>Loading products...</div>
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="text-center py-4 text-gray-600" style={{ fontFamily: font || 'inherit' }}>
                    No products found. Make sure your Printify store has products.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {availableProducts.map((product: any) => (
                        <div
                          key={product.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedProductIds.includes(product.id) 
                              ? 'bg-blue-50 border-blue-500' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                          style={{ fontFamily: font || 'inherit' }}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              className="form-checkbox h-4 w-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            {product.images && product.images[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/48x48/4ecdc4/ffffff?text=P';
                                }}
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate" style={{ fontFamily: font || 'inherit' }}>
                                {product.title || 'Untitled Product'}
                              </div>
                              <div className="text-xs text-gray-500" style={{ fontFamily: font || 'inherit' }}>
                                ${product.variants?.[0]?.price || product.price || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <>
      <div className="p-4 bg-white shadow rounded-md text-black" style={{ fontFamily: font || 'inherit' }}>
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold" style={{ fontFamily: font || 'inherit' }}>Release Pages</h2>
          {Array.isArray(releasePages) && releasePages.length < getMaxPages() && !createPage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
              style={{ fontFamily: font || 'inherit' }}
            >
              Create
            </button>
          )}
        </div> 
        
        <div className="mb-4 text-sm text-gray-600" style={{ fontFamily: font || 'inherit' }}>
          {releasePages.length} of {getMaxPages()} pages used
          {!userData?.hasAccess && (
            <span className="ml-2 text-blue-600">
              (Upgrade to Premium for up to 50 pages)
            </span>
          )}
        </div>
        
        {createPage ? (
          <div className="p-4 bg-gray-100 rounded-md" style={{
              fontFamily: font || 'inherit'  // Apply font to entire create form
            }}> 
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: font || 'inherit' }}>Create Release Page</h3>
            <div className="mb-4">
              <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Name</label>
              <input
                type="text"
                className={`input w-full ${!isNameUnique || editingPage?.nameError ? "border-red-500" : ""}`}
                placeholder="Enter release page name"
                value={editingPage?.name || ""}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                style={{ fontFamily: font || 'inherit' }}
              />
              {editingPage?.nameError && (
                <p className="text-red-500 text-sm mt-1" style={{ fontFamily: font || 'inherit' }}>
                  {editingPage.nameError}
                </p>
              )}
              {!isNameUnique && (
                <p className="text-red-500 text-sm mt-1" style={{ fontFamily: font || 'inherit' }}>
                  This name is already taken. Please choose another.
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Description</label>
             <textarea
            className="input w-full"
            placeholder="Enter release page description"
            value={editingPage?.description || ""}
            onChange={handleDescriptionChange}
            style={{ fontFamily: font || 'inherit' }}
          />
            </div>
            {editingPage?.name && (
              <div className="mb-4">
                <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Image</label>
                <CldUploadWidget
                  uploadPreset="ReleasePageImages"
                  options={{ publicId: `user_${data?.user?.id}_releasePage_thumbnail_${releasePages.length + 1}` }}
                  onUploadAdded={(result: any) => {
                    handleImageUpload(result);
                  }}
                >
                  {({ open }: { open: () => void }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="btn btn-primary btn-sm"
                      style={{ fontFamily: font || 'inherit' }}
                    >
                      Upload Image
                    </button>
                  )}
                </CldUploadWidget>
                {editingPage?.image && (
                  <img
                    src={editingPage.image}
                    alt="Release Page"
                    className="mt-2 rounded-md"
                    style={{ width: "100%", maxHeight: "200px", objectFit: "cover" }}
                  />
                )}
              </div>
            )}
            <div className="mb-4">
              <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>YouTube Video Link</label>
             <input
                type="text"
                className="input w-full"
                placeholder="Enter YouTube video link"
                value={editingPage?.video || ""}
                onChange={handleVideoChange}
                style={{ fontFamily: font || 'inherit' }}
              />
              {editingPage?.video && getYouTubeVideoId(editingPage.video).videoId && (
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(editingPage.video).videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="mt-4"
                ></iframe>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Streaming Links</h4>
              {predefinedLinks.map((link, index) => (
                <div key={index} className="mb-2">
                  <label className="block font-bold" style={{ fontFamily: font || 'inherit' }}>{link.name}</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder={`Enter ${link.name} URL`}
                    value={
                      (editingPage?.links || []).find((l: any) => l.name === link.name)?.url || ""
                    }
                    onChange={(e) => handlePredefinedLinkChange(link.name, e.target.value)}
                    style={{ fontFamily: font || 'inherit' }}
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Custom Links</h4>
              {(editingPage?.links || [])
                .filter((link: any) => !predefinedLinks.some((p) => p.name === link.name))
                .map((link: any, index: number) => (
                  <div key={index} className="mb-2">
                    <label className="block font-bold" style={{ fontFamily: font || 'inherit' }}>Name</label>
                    <input
                      type="text"
                      className="input w-full mb-2"
                      placeholder="Enter link name"
                      value={link.name || ""}
                      onChange={(e) => handleLinkChange(index, "name", e.target.value)}
                      style={{ fontFamily: font || 'inherit' }}
                    />
                    <label className="block font-bold" style={{ fontFamily: font || 'inherit' }}>URL</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Enter link URL"
                      value={link.url || ""}
                      onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                      style={{ fontFamily: font || 'inherit' }}
                    />
                    <button
                      className="btn btn-alert btn-sm mt-2"
                      onClick={() => removeCustomLink(index)}
                      style={{ fontFamily: font || 'inherit' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={addCustomLink}
                style={{ fontFamily: font || 'inherit' }}
              >
                Add Custom Link
              </button>
            </div>
            

            {/* Add merch section for create */}
            {renderMerchSection()}

            <div className="mb-4">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Colors</h4>
              <div className="flex flex-wrap w-full">
                <h2 style={{ display: "block", fontFamily: font || 'inherit' }} className="mr-2">BG</h2>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block", fontFamily: font || 'inherit' }} className="ml-2 mr-2">Text</h2>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block", fontFamily: font || 'inherit' }} className="ml-2 mr-2">Links</h2>
                <input
                  type="color"
                  value={linksColor}
                  onChange={(e) => setLinksColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

             {/* Premium Styling Options */}
              <div className="mt-4 w-full">
               <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Premium Styles</h4>

                {/* Font Picker */}
                <div className="mb-3">
                  <label className="mr-2" style={{
                    fontFamily: font || 'inherit'
                  }}>Font:</label>
                  <select
                    value={font || "sans-serif"}
                    onChange={e => setFont(e.target.value)}
                    className="input w-40"
                    style={{ fontFamily: font || 'inherit' }}
                  >
                    <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans Serif</option>
                    <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
                    <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
                    <option value="cursive" style={{ fontFamily: 'cursive' }}>Cursive</option>
                    <option value="fantasy" style={{ fontFamily: 'fantasy' }}>Fantasy</option>
                  </select>
                </div>
              </div>
            
            <div className="flex justify-end">
              <button
                className="btn btn-primary btn-sm mr-2"
                onClick={handleSave}
                style={{ fontFamily: font || 'inherit' }}
              >
                Save
              </button>
              <button
                className="btn btn-alert btn-sm"
                 onClick={() => {
                  setCreatePage(false);
                  setFont("");
                }}
                style={{ fontFamily: font || 'inherit' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !editingPage ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.isArray(releasePages) && releasePages.map((page: any) => {
              const pageId = page.id || page._id;
              const analyticsOpen = expandedAnalytics === pageId;
              return (
                <div key={pageId}>
                  {/* Page card */}
                  <div
                    className="relative rounded-lg overflow-hidden shadow-lg"
                    style={{
                      backgroundImage: `url(${page.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      height: "200px",
                      fontFamily: page.font || 'inherit',
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white">
                      <h3 className="text-lg font-bold" style={{ fontFamily: page.font || 'inherit' }}>{page.name}</h3>
                      <p className="text-sm" style={{ fontFamily: page.font || 'inherit' }}>{page.description}</p>
                      <div className="flex space-x-2 mt-2 flex-wrap justify-center gap-y-1">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEdit(page)}
                          style={{ fontFamily: page.font || 'inherit' }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => window.location.href = `/release/${page.name}`}
                          style={{ fontFamily: page.font || 'inherit' }}
                        >
                          Visit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: analyticsOpen ? "#4f46e5" : "rgba(255,255,255,0.2)", color: "white", fontFamily: page.font || 'inherit' }}
                          onClick={() => setExpandedAnalytics(analyticsOpen ? null : pageId)}
                        >
                          {analyticsOpen ? "Hide Analytics" : "Analytics"}
                        </button>
                        <button
                          className="btn btn-alert btn-sm"
                          onClick={() => handleDelete(pageId)}
                          style={{ fontFamily: page.font || 'inherit' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible analytics panel */}
                  {analyticsOpen && (
                    <div className="border border-gray-200 rounded-b-lg bg-gray-50 px-4 pb-4 -mt-1">
                      <ReleasePageAnalytics releasePageId={pageId} releasePageName={page.name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-gray-100 rounded-md" style={{ fontFamily: font || 'inherit' }}>
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: font || 'inherit' }}>Edit Release Page</h3>
            <div className="mb-4">
             <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter release page name"
                value={editingPage?.name || ""}
                onChange={(e) => {
                  // Simple handler for edit mode - just update the value
                  setEditingPage({ ...editingPage, name: e.target.value });
                }}
                onBlur={handleNameBlur}
                style={{ fontFamily: font || 'inherit' }}
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Description</label>
                <textarea
                  className="input w-full"
                  placeholder="Enter release page description"
                  value={editingPage?.description || ""}
                  onChange={handleDescriptionChange}
                  style={{ fontFamily: font || 'inherit' }}
                />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Image</label>
              <CldUploadWidget
                uploadPreset="ReleasePageImages"
                options={{ publicId: `user_${data?.user?.id}_releasePage_thumbnail_${releasePages.length + 1}` }}
                onUploadAdded={(result: any) => {
                  handleImageUpload(result);
                }}
              >
                {({ open }: { open: () => void }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="btn btn-primary btn-sm"
                    style={{ fontFamily: font || 'inherit' }}
                  >
                    Upload Image
                  </button>
                )}
              </CldUploadWidget>
              {editingPage?.image && (
                <img
                  src={editingPage.image}
                  alt="Release Page"
                  className="mt-2 rounded-md"
                  style={{ width: "100%", maxHeight: "200px", objectFit: "cover" }}
                />
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>YouTube Video Link</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Enter YouTube video link"
              value={editingPage?.video || ""}
              onChange={handleVideoChange}
              style={{ fontFamily: font || 'inherit' }}
            />
              {editingPage?.video && getYouTubeVideoId(editingPage.video).videoId && (
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(editingPage.video).videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="mt-4"
                ></iframe>
              )}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Predefined Links</h4>
             {predefinedLinks.map((link, index) => (
                <div key={index} className="mb-2">
                  <label className="block font-bold" style={{ fontFamily: font || 'inherit' }}>{link.name}</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder={`Enter ${link.name} URL`}
                    value={
                      (editingPage?.links || []).find((l: any) => l.name === link.name)?.url || ""
                    }
                    onChange={(e) => handlePredefinedLinkChange(link.name, e.target.value)}
                    style={{ fontFamily: font || 'inherit' }}
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Custom Links</h4>
           {(editingPage?.links || [])
              .filter((link: any) => !predefinedLinks.some((p) => p.name === link.name))
              .map((link: any, index: number) => (
                <div key={index} className="mb-2">
                  <label className="block font-bold" style={{ fontFamily: font || 'inherit' }}>Name</label>
                  <input
                    type="text"
                    className="input w-full mb-2"
                    placeholder="Enter link name"
                    value={link.name || ""}
                    onChange={(e) => handleCustomLinkNameChange(index, e.target.value)}
                    style={{ fontFamily: font || 'inherit' }}
                  />
                  <label className="block font-bold" style={{ fontFamily: font || 'inherit' }}>URL</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Enter link URL"
                    value={link.url || ""}
                    onChange={(e) => handleCustomLinkURLChange(index, e.target.value)}
                    style={{ fontFamily: font || 'inherit' }}
                  />
                  <button
                    className="btn btn-alert btn-sm mt-2"
                    onClick={() => removeCustomLink(index)}
                    style={{ fontFamily: font || 'inherit' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={addCustomLink}
                style={{ fontFamily: font || 'inherit' }}
              >
                Add Custom Link
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Colors</h4>
              <div className="flex flex-wrap w-full">
                <h2 style={{ display: "block", fontFamily: font || 'inherit' }} className="mr-2">BG</h2>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block", fontFamily: font || 'inherit' }} className="ml-2 mr-2">Text</h2>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block", fontFamily: font || 'inherit' }} className="ml-2 mr-2">Links</h2>
                <input
                  type="color"
                  value={linksColor}
                  onChange={(e) => setLinksColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Premium Styles Section for Edit Form */}
            <div className="mt-4 w-full">
              <h4 className="font-bold mb-2" style={{ fontFamily: font || 'inherit' }}>Premium Styles</h4>

              {/* Font Picker */}
              <div className="mb-3">
                <label className="mr-2" style={{
                  fontFamily: font || 'inherit'
                }}>Font:</label>
                <select
                  value={font || "sans-serif"}
                  onChange={e => setFont(e.target.value)}
                  className="input w-40"
                  style={{ fontFamily: font || 'inherit' }}
                >
                  <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>Sans Serif</option>
                  <option value="serif" style={{ fontFamily: 'serif' }}>Serif</option>
                  <option value="monospace" style={{ fontFamily: 'monospace' }}>Monospace</option>
                  <option value="cursive" style={{ fontFamily: 'cursive' }}>Cursive</option>
                  <option value="fantasy" style={{ fontFamily: 'fantasy' }}>Fantasy</option>
                </select>
              </div>
            </div>

            {renderMerchSection()}

            <div className="flex justify-end">
              <button
                className="btn btn-primary btn-sm mr-2"
                onClick={handleSave}
                style={{ fontFamily: font || 'inherit' }}
              >
                Save
              </button>
              <button
                className="btn btn-alert btn-sm"
                onClick={() => {
                  setEditingPage(null);
                  setFont("");
                }}
                style={{ fontFamily: font || 'inherit' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {alert && (
          <div className="alert mt-5 w-full">
            <button
              className="btn btn-alert btn-sm float-right"
              onClick={() => setAlert("")}
              style={{ fontFamily: font || 'inherit' }}
            >
              Close
            </button>
            <span style={{ fontFamily: font || 'inherit' }}>{alert}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ReleasePages;