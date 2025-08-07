"use client"
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession } from "next-auth/react";
import Head from 'next/head';
import { CldUploadWidget } from 'next-cloudinary';
import { debounce } from "lodash";

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
  const [font, setFont] = useState("");

  // Add merch-related states
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showMerchSection, setShowMerchSection] = useState(false);

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
    return userData?.hasAccess ? 10 : 3;
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
      setReleasePages(data);
    } catch (e: any) {
      console.error(e?.message);
      setAlert(e?.message);
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
    setFont(page.font || "");
    
    // Load selected products for this page
    if (page.selectedProducts && Array.isArray(page.selectedProducts)) {
      setSelectedProductIds(page.selectedProducts);
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSave = async () => {
    try {
      const maxPages = getMaxPages();
      
      // Check if we're creating a new page and already have the maximum allowed
      if (!editingPage?._id && releasePages.length >= maxPages) {
        const userType = userData?.hasAccess ? "premium" : "free";
        setAlert(`You can only create up to ${maxPages} release pages on the ${userType} plan.`);
        return;
      }

      // Debug: Log what we're sending
      const dataToSend = {
        ...editingPage,
        bgColor,
        textColor,
        linksColor,
        font,
        selectedProducts: selectedProductIds,
      };

      await apiClient.post(`/release/`, dataToSend);

      setEditingPage(null);
      setCreatePage(false);
      setSelectedProductIds([]);
      getReleasePages(data?.user?.id);
      setAlert("Release page saved successfully!");
    } catch (e: any) {
      console.error('❌ Save error:', e?.message); 
      setAlert(e?.message);
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

  const removeCustomLink = (index: number) => {
    const updatedLinks = (editingPage?.links || []).filter((_: any, i: number) => i !== index);
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let name = e.target.value;
    
    name = name.replace(/\s+/g, '-');
    
    const validation = validateReleasePageName(name);
    
    setEditingPage({ 
      ...editingPage, 
      name,
      nameError: validation.isValid ? "" : validation.message
    });
  };

  const handleNameBlur = () => {
    if (editingPage?.name) {
      console.log('checking uniqueness', editingPage.name);
      checkNameUniqueness(editingPage.name);
    }
  };

  // Render merch section component
  const renderMerchSection = () => {
    if (!userData?.hasAccess || !userData?.printifyShopId) {
      return (
        <div className="mb-4 p-4 bg-blue-50 rounded-md">
          <h4 className="font-bold mb-2 text-blue-800">Merch Integration</h4>
          <p className="text-blue-600 text-sm">
            {!userData?.hasAccess 
              ? "Upgrade to Premium to add merch to your release pages" 
              : "Connect your Printify store to add merch products"
            }
          </p>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold">Merch Products</h4>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMerchSection(!showMerchSection)}
          >
            {showMerchSection ? 'Hide Products' : 'Select Products'}
          </button>
        </div>
        
        {selectedProductIds.length > 0 && (
          <div className="mb-2 text-sm text-gray-600">
            {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
          </div>
        )}

        {showMerchSection && (
          <div className="border rounded-md p-4 bg-gray-50">
            {isLoadingProducts ? (
              <div className="text-center py-4">
                <div className="animate-pulse">Loading products...</div>
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="text-center py-4 text-gray-600">
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
                          <div className="font-medium text-sm truncate">
                            {product.title || 'Untitled Product'}
                          </div>
                          <div className="text-xs text-gray-500">
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
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Influanto | Release Pages</title>
        <meta name="description" content="Manage your Release Pages" />
      </Head>
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Release Pages</h2>
          {Array.isArray(releasePages) && releasePages.length < getMaxPages() && !createPage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
            >
              Create
            </button>
          )}
        </div> 
        
        <div className="mb-4 text-sm text-gray-600">
          {releasePages.length} of {getMaxPages()} pages used
          {!userData?.hasAccess && (
            <span className="ml-2 text-blue-600">
              (Upgrade to Premium for up to 10 pages)
            </span>
          )}
        </div>
        
        {createPage ? (
          <div className="p-4 bg-gray-100 rounded-md">
            <h3 className="text-xl font-bold mb-4">Create Release Page</h3>
            <div className="mb-4">
              <label className="block font-bold mb-2">Name</label>
              <input
                type="text"
                className={`input w-full ${!isNameUnique || editingPage?.nameError ? "border-red-500" : ""}`}
                placeholder="Enter release page name"
                value={editingPage?.name || ""}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
              />
              {editingPage?.nameError && (
                <p className="text-red-500 text-sm mt-1">
                  {editingPage.nameError}
                </p>
              )}
              {!isNameUnique && (
                <p className="text-red-500 text-sm mt-1">
                  This name is already taken. Please choose another.
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Description</label>
              <textarea
                className="input w-full"
                placeholder="Enter release page description"
                value={editingPage?.description || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, description: e.target.value })
                }
              />
            </div>
            {editingPage?.name && (
              <div className="mb-4">
                <label className="block font-bold mb-2">Image</label>
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
              <label className="block font-bold mb-2">YouTube Video Link</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter YouTube video link"
                value={editingPage?.video || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, video: e.target.value })
                }
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
              <h4 className="font-bold mb-2">Streaming Links</h4>
              {predefinedLinks.map((link, index) => (
                <div key={index} className="mb-2">
                  <label className="block font-bold">{link.name}</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder={`Enter ${link.name} URL`}
                    value={
                      (editingPage?.links || []).find((l: any) => l.name === link.name)?.url || ""
                    }
                    onChange={(e) => {
                      const existingLinkIndex = (editingPage?.links || []).findIndex(
                        (l: any) => l.name === link.name
                      );
                      if (existingLinkIndex !== -1) {
                        handleLinkChange(existingLinkIndex, "url", e.target.value);
                      } else {
                        setEditingPage({
                          ...editingPage,
                          links: [
                            ...(editingPage?.links || []),
                            { name: link.name, url: e.target.value },
                          ],
                        });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2">Custom Links</h4>
              {(editingPage?.links || [])
                .filter((link: any) => !predefinedLinks.some((p) => p.name === link.name))
                .map((link: any, index: number) => (
                  <div key={index} className="mb-2">
                    <label className="block font-bold">Name</label>
                    <input
                      type="text"
                      className="input w-full mb-2"
                      placeholder="Enter link name"
                      value={link.name || ""}
                      onChange={(e) => handleLinkChange(index, "name", e.target.value)}
                    />
                    <label className="block font-bold">URL</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Enter link URL"
                      value={link.url || ""}
                      onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                    />
                    <button
                      className="btn btn-alert btn-sm mt-2"
                      onClick={() => removeCustomLink(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={addCustomLink}
              >
                Add Custom Link
              </button>
            </div>

            {/* Add merch section for create */}
            {renderMerchSection()}

            <div className="mb-4">
              <h4 className="font-bold mb-2">Colors</h4>
              <div className="flex flex-wrap w-full">
                <h2 style={{ display: "block" }} className="mr-2">BG</h2>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block" }} className="ml-2 mr-2">Text</h2>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block" }} className="ml-2 mr-2">Links</h2>
                <input
                  type="color"
                  value={linksColor}
                  onChange={(e) => setLinksColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              {/* Premium Styling Options */}
              <div className="mt-4 w-full">
                <h2 className="text-md font-semibold mb-2" style={{
                  fontFamily: font || 'inherit'
                }}>Premium Styles</h2>

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
            </div>
            
            <div className="flex justify-end">
              <button
                className="btn btn-primary btn-sm mr-2"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="btn btn-alert btn-sm"
                onClick={() => setCreatePage(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !editingPage ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.isArray(releasePages) && releasePages.map((page: any) => (
              <div
                key={page.id || page._id}
                className="relative rounded-lg overflow-hidden shadow-lg"
                style={{
                  backgroundImage: `url(${page.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: "200px",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white">
                  <h3 className="text-lg font-bold">{page.name}</h3>
                  <div className="flex space-x-2 mt-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEdit(page)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => window.location.href = `/release/${page.name}`}
                    >
                      Visit
                    </button>
                    <button
                      className="btn btn-alert btn-sm"
                      onClick={() => handleDelete(page.id || page._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-100 rounded-md">
            <h3 className="text-xl font-bold mb-4">Edit Release Page</h3>
            <div className="mb-4">
              <label className="block font-bold mb-2">Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter release page name"
                value={editingPage?.name || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, name: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Description</label>
              <textarea
                className="input w-full"
                placeholder="Enter release page description"
                value={editingPage?.description || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, description: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Image</label>
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
              <label className="block font-bold mb-2">YouTube Video Link</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter YouTube video link"
                value={editingPage?.video || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, video: e.target.value })
                }
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
              <h4 className="font-bold mb-2">Predefined Links</h4>
              {predefinedLinks.map((link, index) => (
                <div key={index} className="mb-2">
                  <label className="block font-bold">{link.name}</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder={`Enter ${link.name} URL`}
                    value={
                      (editingPage?.links || []).find((l: any) => l.name === link.name)?.url || ""
                    }
                    onChange={(e) => {
                      const existingLinkIndex = (editingPage?.links || []).findIndex(
                        (l: any) => l.name === link.name
                      );
                      if (existingLinkIndex !== -1) {
                        handleLinkChange(existingLinkIndex, "url", e.target.value);
                      } else {
                        setEditingPage({
                          ...editingPage,
                          links: [
                            ...(editingPage?.links || []),
                            { name: link.name, url: e.target.value },
                          ],
                        });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-bold mb-2">Custom Links</h4>
              {(editingPage?.links || [])
                .filter((link: any) => !predefinedLinks.some((p) => p.name === link.name))
                .map((link: any, index: number) => (
                  <div key={index} className="mb-2">
                    <label className="block font-bold">Name</label>
                    <input
                      type="text"
                      className="input w-full mb-2"
                      placeholder="Enter link name"
                      value={link.name || ""}
                      onChange={(e) => handleLinkChange(index, "name", e.target.value)}
                    />
                    <label className="block font-bold">URL</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Enter link URL"
                      value={link.url || ""}
                      onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                    />
                    <button
                      className="btn btn-alert btn-sm mt-2"
                      onClick={() => removeCustomLink(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              <button
                className="btn btn-primary btn-sm mt-2"
                onClick={addCustomLink}
              >
                Add Custom Link
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-bold mb-2">Colors</h4>
              <div className="flex flex-wrap w-full">
                <h2 style={{ display: "block" }} className="mr-2">BG</h2>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block" }} className="ml-2 mr-2">Text</h2>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
                <h2 style={{ display: "block" }} className="ml-2 mr-2">Links</h2>
                <input
                  type="color"
                  value={linksColor}
                  onChange={(e) => setLinksColor(e.target.value)}
                  className="w-12 h-12 border-1 border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {renderMerchSection()}

            <div className="flex justify-end">
              <button
                className="btn btn-primary btn-sm mr-2"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="btn btn-alert btn-sm"
                onClick={() => setEditingPage(null)}
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
            >
              Close
            </button>
            {alert}
          </div>
        )}
      </div>
    </>
  );
};

export default ReleasePages;