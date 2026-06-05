"use client"
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession, signOut } from "next-auth/react";
import posthog from "posthog-js";
import ButtonSupport from "@/components/ButtonSupport";
import ButtonEdit from "@/components/ButtonEdit";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
import Head from 'next/head';
import { text } from "stream/consumers";
import { CldUploadWidget } from 'next-cloudinary';
import PrintifyProducts from '@/components/PrintifyProducts';
import * as HeroPatterns from 'hero-patterns';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// ─── Hero Patterns ───────────────────────────────────────────────────────────

type PatternFn = (color: string, opacity: number) => string;
const HP = HeroPatterns as Record<string, PatternFn>;
const PATTERN_IDS = Object.keys(HP);

function toTitleCase(str: string) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function buildPatternUrl(patternId: string, fgColor: string, opacity: number) {
  const fn = HP[patternId];
  if (!fn) return 'none';
  return fn(fgColor, opacity);
}

function HeroPatternPicker({ linkInBio, setLinkInBio }: { linkInBio: any; setLinkInBio: any }) {
  const patternFg = linkInBio?.patternFg || '#000000';
  const patternBg = linkInBio?.patternBg || '#ffffff';
  const patternOpacity = linkInBio?.patternOpacity ?? 0.5;
  const selectedPattern = linkInBio?.patternId || PATTERN_IDS[0];

  const update = (key: string, val: any) =>
    setLinkInBio((prev: any) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-4">
      {/* Scrollable 3-column pattern grid */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
        <div className="grid grid-cols-3 gap-2">
          {PATTERN_IDS.map((patternId) => {
            const previewUrl = buildPatternUrl(patternId, patternFg, patternOpacity);
            return (
              <button
                key={patternId}
                type="button"
                onClick={() => update('patternId', patternId)}
                className={`border-2 rounded-lg p-1 flex flex-col items-center gap-1 transition-colors ${
                  selectedPattern === patternId
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 6,
                    overflow: 'hidden',
                    backgroundColor: patternBg,
                    backgroundImage: previewUrl,
                  }}
                />
                <span style={{ fontSize: 9, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>
                  {toTitleCase(patternId)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">FG</label>
          <input
            type="color"
            value={patternFg}
            onChange={(e) => update('patternFg', e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">BG</label>
          <input
            type="color"
            value={patternBg}
            onChange={(e) => update('patternBg', e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <label className="text-sm text-gray-600 whitespace-nowrap">Opacity</label>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={patternOpacity}
            onChange={(e) => update('patternOpacity', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-8">{Math.round(patternOpacity * 100)}%</span>
        </div>
      </div>

      {/* Live Preview strip */}
      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 52 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: patternBg,
            backgroundImage: buildPatternUrl(selectedPattern, patternFg, patternOpacity),
          }}
        />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applyBodyBackground(linkInBio: any, bgImage: any, bgColor: any) {
  if (linkInBio?.bgMode === 'pattern') {
    const patternId = linkInBio?.patternId || PATTERN_IDS[0];
    document.body.style.backgroundImage = buildPatternUrl(
      patternId,
      linkInBio?.patternFg || '#000000',
      linkInBio?.patternOpacity ?? 0.5
    );
    document.body.style.backgroundColor = linkInBio?.patternBg || '#ffffff';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
  } else if (linkInBio?.bgMode === 'upload' && linkInBio?.bgImageCustom) {
    document.body.style.backgroundImage = `url('${linkInBio.bgImageCustom}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundColor = '';
  } else if (bgImage) {
    document.body.style.backgroundImage = `url('${bgImage}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundColor = '';
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = bgColor || '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const LinkInBio = () => {
  const { data, status } = useSession();
  const [user, setUser] = useState<any>();
  const [bgColor, setBgColor] = useState<any>();
  const [bgImage, setBgImage] = useState<any>();
  const [textColor, setTextColor] = useState<any>();
  const [linksColor, setLinksColor] = useState<any>();
  const [linkInBio, setLinkInBio] = useState<any>();
  const [links, setLinks] = useState<any[]>([{ url: "", name: "", image: "" }]);
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
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [newsletterFields, setNewsletterFields] = useState<string[]>(["name", "email"]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isEditing && user?.printifyShopId) {
      fetchAvailableProducts();
    }
  }, [isEditing, user?.printifyShopId]);

  useEffect(() => {
    if (isEditing && user?.printifyShopId && selectedProductIds.length > 0 && availableProducts.length === 0) {
      fetchAvailableProducts();
    }
  }, [isEditing, user?.printifyShopId, selectedProductIds.length, availableProducts.length]);

  useEffect(() => {
    if (linkInBio?.selectedProducts) {
      setSelectedProductIds(linkInBio.selectedProducts);
    }
  }, [linkInBio?.selectedProducts]);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    getLinks();
  }, []);

  useEffect(() => {
    if (!isEditing && user?.printifyShopId && linkInBio?.selectedProducts?.length > 0) {
      fetchAvailableProducts();
    }
  }, [user?.printifyShopId, linkInBio?.selectedProducts, isEditing]);

  useEffect(() => {
    if (linkInBio?.font) {
      document.documentElement.style.setProperty('--preview-font', linkInBio.font);
    }
    return () => {
      document.documentElement.style.removeProperty('--preview-font');
      document.body.style.backgroundColor = '';
    };
  }, [linkInBio?.font, bgColor]);

  // Unified background effect
  useEffect(() => {
    applyBodyBackground(linkInBio, bgImage, bgColor);
  }, [
    linkInBio?.bgMode,
    linkInBio?.patternId,
    linkInBio?.patternFg,
    linkInBio?.patternBg,
    linkInBio?.patternOpacity,
    linkInBio?.bgImageCustom,
    bgImage,
    bgColor,
  ]);

  useEffect(() => {
    document.title = "Link In Bio | Influanto";

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Link In Bio - Create a personalized landing page for your social media links powered by Influanto.');

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Link In Bio | Influanto');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'All your links on one page. Free Link In Bio Tool powered by Influanto.');

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', 'Link In Bio | Influanto');

    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', 'Share your links easily. Free Link In Bio Tool powered by Influanto.');
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAvailableProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch(`/api/products/${user.id}`);
      if (response.ok) {
        const products = await response.json();
        setAvailableProducts(products);
      } else {
        console.error('Error fetching products:', await response.text());
      }
    } catch (error) {
      console.error('Network error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const getUser = async () => {
    try {
      const { data } = await apiClient.get("/get-user");
      setUser(data);
    } catch (e) {
      setAlertt(e?.message);
    }
  };

  const getLinks = async () => {
    try {
      const { data } = await apiClient.get("/get-links");
      setLinkInBio(data);
      setBgColor(data.bgColor);
      setBgImage(data.bgImage);
      setTextColor(data.textColor);
      setLinksColor(data.linksColor);
      setLinks(data.links);
      if (data.selectedProducts && Array.isArray(data.selectedProducts)) {
        setSelectedProductIds(data.selectedProducts);
      }
      setBrandLogoUrl(data.brandLogoUrl || "");
      setNewsletterEnabled(!!data.newsletterEnabled);
      setNewsletterFields(Array.isArray(data.newsletterFields) ? data.newsletterFields : ["name", "email"]);
    } catch (e) {
      setAlertt(e?.message);
    }
  };

  // ── Newsletter signup helpers ───────────────────────────────────────────────

  const toggleNewsletterField = (field: string) => {
    setNewsletterFields(prev => prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]);
  };

  // ── Link helpers ───────────────────────────────────────────────────────────

  const addLink = () => {
    setLinks([...links, { url: "", name: "" }]);
  };

  const moveLink = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= links.length) return;
    const newLinks = [...links];
    const [item] = newLinks.splice(fromIndex, 1);
    newLinks.splice(toIndex, 0, item);
    setLinks(newLinks);
  };

  const moveLinkUp = (index: number) => moveLink(index, index - 1);
  const moveLinkDown = (index: number) => moveLink(index, index + 1);

  const updateLink = (index: number, field: any, value: any) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const removeLink = async (index: number) => {
    const imageToDelete = links[index]?.image;
    if (imageToDelete) {
      try {
        let publicId = imageToDelete.split('/').slice(-2).join('/').split('.')[0];
        publicId = publicId.substring(publicId.indexOf('/') + 1);
        if (publicId) {
          await apiClient.delete('/delete-image', {
            data: { publicId },
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error.response?.data || error.message);
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

  const handleImageUpload = (index: number, result: any) => {
    const imageUrl = result.info.secure_url ||
      `https://res.cloudinary.com/${cloudName}/image/upload/v${result.info.version}/${result.info.public_id}.${result.info.format}`;
    updateLink(index, 'image', imageUrl);
    try { document.body.style.overflow = ''; } catch (err) { /* ignore */ }
  };

  // ── YouTube helpers ────────────────────────────────────────────────────────

  function isYouTubeLinkCheck(url: string): boolean {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  }

  function isYouTubeLink(index: number, url: string): boolean {
    const youtubeRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  }

  function updateYouTubeLinkOptions(index: number, value: boolean) {
    const updatedLinks = [...links];
    updatedLinks[index].displayVideo = value;
    setLinks(updatedLinks);
  }

  function getYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // ── Product helpers ────────────────────────────────────────────────────────

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 10) {
        return [...prev, productId];
      } else {
        setAlertt('Maximum 10 products can be selected');
        setTimeout(() => setAlertt(''), 3000);
        return prev;
      }
    });
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleEditLinkInBio = async (e: any) => {
    e.preventDefault();
    try {
      const { data } = await apiClient.post("/linkinbio", {
        bgColor: bgColor,
        bgImage: bgImage,
        textColor: textColor,
        linksColor: linksColor,
        links: links,
        font: linkInBio?.font,
        cardBgColor: linkInBio?.cardBgColor,
        selectedProducts: selectedProductIds,
        // Background mode fields
        bgMode: linkInBio?.bgMode,
        bgImageCustom: linkInBio?.bgImageCustom,
        patternId: linkInBio?.patternId,
        patternFg: linkInBio?.patternFg,
        patternBg: linkInBio?.patternBg,
        patternOpacity: linkInBio?.patternOpacity,
        brandLogoUrl: brandLogoUrl || null,
        newsletterEnabled: newsletterEnabled,
        newsletterFields: newsletterFields.includes("email") ? newsletterFields : [...newsletterFields, "email"],
      });
      posthog.capture("link_in_bio_saved", { links_count: links.length });
      setAlertt("Link In Bio updated successfully");
    } catch (e) {
      posthog.captureException(e);
      setAlertt(e?.message);
    } finally {
      setIsLoading(false);
      setEditing(false);
    }
  };

  // ── Render: loading ────────────────────────────────────────────────────────

  if (!data) {
    return <div>Thanks for signing up...</div>;
  }

  // ── Render: view mode ──────────────────────────────────────────────────────

  if (!isEditing) {
    return (
      <>
        <div
          className="mx-auto bg-white shadow rounded-md text-black"
          style={{
            width: "calc(100% - 16px)",
            padding: "0.5rem 1rem",
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
              style={{ margin: "0 2%", fontFamily: linkInBio?.font || 'inherit' }}
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          </div>
          <br />
          <div style={{ margin: "0 auto", textAlign: "center", color: textColor, fontFamily: linkInBio?.font || 'inherit' }}>
            <img
              src={data.user.image ?? fallbackImageUrl}
              onError={(e) => e.currentTarget.src = fallbackImageUrl}
              style={{ borderRadius: '50%', width: "100px", height: "100px", display: "inline" }}
              alt="Avatar"
            />
            <p style={{ fontFamily: linkInBio?.font || 'inherit' }}>{data.user.name}</p>
            <br />
            {links && user && (
              <div>
                {links.map((link: any, index: number) => (
                  link.url && link.name && (
                    <div key={index} className="p-2 border rounded-lg mb-2" style={{
                      display: "flex",
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: linkInBio?.cardBgColor || 'transparent',
                      fontFamily: linkInBio?.font || 'inherit'
                    }}>
                      {isYouTubeLinkCheck(link.url) ? (
                        <iframe
                          width="100%"
                          height="200"
                          style={{ maxWidth: "100%" }}
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(link.url)}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          {link.image && (
                            <img src={link.image} alt="Link Image" style={{ borderRadius: '50%', width: '30px', height: '30px', marginRight: '10px' }} />
                          )}
                          <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: linksColor, fontFamily: linkInBio?.font || 'inherit' }}>
                            {link.name}
                          </a>
                        </>
                      )}
                    </div>
                  )
                ))}

                {/* MERCH SECTION */}
                {user?.printifyShopId && linkInBio?.selectedProducts?.length > 0 && (
                  <div style={{ marginTop: "24px", marginBottom: "16px", width: "100%" }}>
                    <h3 style={{
                      fontSize: "18px", fontWeight: "600", marginBottom: "12px",
                      textAlign: "center", color: textColor, fontFamily: linkInBio?.font || 'inherit'
                    }}>
                      Merch
                    </h3>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                      gap: "8px", width: "100%", maxWidth: "100%", padding: "0 4px"
                    }}>
                      {linkInBio.selectedProducts.map((productId: string) => {
                        const product = availableProducts.find(p => p.id === productId);
                        if (!product) return null;
                        const productUrl = product.url || '#';
                        return (
                          <div key={productId} style={{ width: "100%", minWidth: "80px", maxWidth: "120px", margin: "0 auto" }}>
                            <a
                              href={productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block', padding: '6px', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                backgroundColor: linkInBio?.cardBgColor || 'rgba(255,255,255,0.1)',
                                textDecoration: 'none', width: '100%', boxSizing: 'border-box',
                                transition: 'transform 0.2s ease'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                            >
                              <div style={{ width: "100%", height: "60px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f0f0f0", marginBottom: "6px" }}>
                                {product.images && product.images.length > 0 && product.images[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                      e.currentTarget.src = `https://via.placeholder.com/80x60/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`;
                                    }}
                                  />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(45deg, #e3f2fd, #f3e5f5)" }}>
                                    <span style={{ color: "#999", fontSize: "12px" }}>📦</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div style={{
                                  fontSize: "10px", fontWeight: "500", marginBottom: "3px",
                                  color: textColor, fontFamily: linkInBio?.font || 'inherit',
                                  lineHeight: '1.2', height: '2.4em', overflow: 'hidden',
                                  wordWrap: 'break-word', textAlign: 'center'
                                }}>
                                  {product.title && product.title.length > 12
                                    ? `${product.title.substring(0, 12)}...`
                                    : product.title || 'Product'}
                                </div>
                                <div style={{
                                  fontSize: "10px", fontWeight: "bold", textAlign: "center",
                                  color: linksColor, fontFamily: linkInBio?.font || 'inherit'
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
                  style={{ width: "auto", display: "inline", fontFamily: linkInBio?.font || 'inherit' }}
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
    );
  }

  // ── Render: edit mode ──────────────────────────────────────────────────────

  return (
    <div
      className="shadow rounded-md mx-auto"
      style={{
        width: "calc(100% - 16px)",
        padding: "1rem",
        fontFamily: linkInBio?.font || 'inherit',
        backgroundColor: linkInBio?.cardBgColor || 'white',
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      <div className="w-full flex flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 inline" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
          Link In Bio
        </h2>
        <br />
        <form>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-4">

            {/* ── LEFT column: Links ── */}
            <div className="p-3 border border-gray-100 rounded-xl">
              <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Links</h3>

              {/* ── Links List ── */}
              {links.map((link: any, index: number) => (
                <div key={index} className="mb-4" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                  <label style={{ display: "block", fontFamily: linkInBio?.font || 'inherit' }}>
                    Link {index + 1}
                    {isYouTubeLink(index, link.url) && (
                      <div>
                        <label style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                          Display Video:
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={link.displayVideo || true}
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
                  <br />
                  {!isYouTubeLink(index, link.url) && !link.image && (
                    <CldUploadWidget
                      uploadPreset="LinkInBioThumbnail"
                      options={{ folder: `user_${user.id}_links`, publicId: `link_${index}_thumbnail` }}
                      onSuccess={(result: any) => handleImageUpload(index, result)}
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
                  )}
                  <button
                    type="button"
                    className="btn btn-alert btn-sm btn-narrow ml-2"
                    onClick={() => removeLink(index)}
                    style={{ fontFamily: linkInBio?.font || 'inherit' }}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-narrow ml-2"
                    onClick={() => moveLinkUp(index)}
                    disabled={index === 0}
                    title="Move up"
                    style={{ fontFamily: linkInBio?.font || 'inherit' }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-narrow ml-1"
                    onClick={() => moveLinkDown(index)}
                    disabled={index === links.length - 1}
                    title="Move down"
                    style={{ fontFamily: linkInBio?.font || 'inherit' }}
                  >
                    ↓
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
            </div>

            {/* ── RIGHT column: Styles ── */}
            <div className="p-3 border border-gray-100 rounded-xl">
              <h3 className="font-semibold mb-3 text-sm text-gray-600 uppercase tracking-wide" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Styles</h3>

              <div className="w-full">
                {/* Color Pickers Row */}
                <div className="flex justify-center items-center gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Text</span>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Links</span>
                    <input type="color" value={linksColor} onChange={(e) => setLinksColor(e.target.value)}
                      className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>BG</span>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Card BG</span>
                    <input type="color" value={linkInBio?.cardBgColor || "#ffffff"}
                      onChange={e => setLinkInBio({ ...linkInBio, cardBgColor: e.target.value })}
                      className="w-8 h-8 sm:w-12 sm:h-12 border border-gray-300 rounded-lg cursor-pointer" />
                  </div>
                </div>

                {/* Font Row */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Font:</label>
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

                {/* ── Background Section ── */}
                <div className="mb-4">
                  <label className="block mb-2 font-medium" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                    Background:
                  </label>

                  {/* Tab switcher */}
                  <div className="flex justify-center mb-3">
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {[
                      { id: 'image', label: '🖼 Stock' },
                      { id: 'upload', label: '⬆️ Upload' },
                      { id: 'pattern', label: '🔷 Pattern' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          (linkInBio?.bgMode || 'image') === tab.id
                            ? 'bg-white shadow text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setLinkInBio({ ...linkInBio, bgMode: tab.id })}
                        style={{ fontFamily: linkInBio?.font || 'inherit' }}
                      >
                        {tab.label}
                      </button>
                    ))}
                    </div>
                  </div>

                  {/* Tab: Stock Images */}
                  {(linkInBio?.bgMode || 'image') === 'image' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 justify-items-center max-w-lg mx-auto">
                      <button
                        type="button"
                        className={`border rounded-lg p-2 ${!linkInBio?.bgImage ? "border-blue-500" : "border-gray-300"}`}
                        onClick={() => {
                          setLinkInBio({ ...linkInBio, bgImage: null });
                          setBgImage(null);
                          document.body.style.backgroundImage = 'none';
                        }}
                        style={{ fontFamily: linkInBio?.font || 'inherit' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 60, height: 60, backgroundColor: '#f0f0f0', borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', marginBottom: 4
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
                          onClick={() => { setLinkInBio({ ...linkInBio, bgImage: img }); setBgImage(img); }}
                        >
                          <img src={img} alt={`bg-${idx}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab: Custom Upload */}
                  {linkInBio?.bgMode === 'upload' && (
                    <div className="flex flex-col items-center gap-3">
                      {linkInBio?.bgImageCustom && (
                        <div className="relative">
                          <img
                            src={linkInBio.bgImageCustom}
                            alt="Custom background preview"
                            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #3b82f6' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLinkInBio({ ...linkInBio, bgImageCustom: null });
                              setBgImage(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <CldUploadWidget
                        uploadPreset="LinkInBioThumbnail"
                        options={{ folder: `user_${user.id}_bg`, publicId: `bg_custom` }}
                        onSuccess={(result: any) => {
                          const url = result.info.secure_url ||
                            `https://res.cloudinary.com/${cloudName}/image/upload/v${result.info.version}/${result.info.public_id}.${result.info.format}`;
                          setLinkInBio({ ...linkInBio, bgImageCustom: url });
                          setBgImage(url);
                          try { document.body.style.overflow = ''; } catch {}
                        }}
                      >
                        {({ open }: { open: () => void }) => (
                          <button
                            type="button"
                            onClick={() => open()}
                            className="btn btn-primary btn-sm btn-narrow"
                            style={{ fontFamily: linkInBio?.font || 'inherit' }}
                          >
                            {linkInBio?.bgImageCustom ? 'Replace Background Image' : 'Upload Background Image'}
                          </button>
                        )}
                      </CldUploadWidget>
                      <p className="text-xs text-gray-500" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                        Recommended: at least 1080×1920px
                      </p>
                    </div>
                  )}

                  {/* Tab: Hero Patterns */}
                  {linkInBio?.bgMode === 'pattern' && (
                    <HeroPatternPicker linkInBio={linkInBio} setLinkInBio={setLinkInBio} />
                  )}
                </div>

              </div>

              {/* ── Brand Logo (Premium) ── */}
              {user?.hasAccess && (
                <div className="mt-4 p-4 bg-purple-50 rounded-md border border-purple-200">
                  <h4 className="font-bold mb-1 text-purple-800" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                    ✨ Brand Logo
                  </h4>
                  <p className="text-xs text-purple-600 mb-3" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                    Shown at the bottom of your link-in-bio page. Replaces the Influanto badge.
                  </p>

                  {brandLogoUrl ? (
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={brandLogoUrl}
                        alt="Brand logo"
                        className="h-12 object-contain rounded border border-purple-200 bg-white p-1"
                      />
                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        onClick={() => setBrandLogoUrl("")}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2">
                    <CldUploadWidget
                      uploadPreset="LinkInBioThumbnail"
                      options={{ folder: `user_${user?.id}_brand`, publicId: `brand_logo` }}
                      onSuccess={(result: any) => {
                        const url = result.info.secure_url ||
                          `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v${result.info.version}/${result.info.public_id}.${result.info.format}`;
                        setBrandLogoUrl(url);
                        try { document.body.style.overflow = ''; } catch {}
                      }}
                    >
                      {({ open }: { open: () => void }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="btn btn-sm btn-outline w-fit"
                          style={{ fontFamily: linkInBio?.font || 'inherit' }}
                        >
                          {brandLogoUrl ? 'Replace Logo' : 'Upload Brand Logo'}
                        </button>
                      )}
                    </CldUploadWidget>
                    <p className="text-xs text-gray-400">Or paste a logo URL:</p>
                    <input
                      type="url"
                      className="input input-sm w-full"
                      placeholder="https://example.com/logo.png"
                      value={brandLogoUrl}
                      onChange={e => setBrandLogoUrl(e.target.value)}
                      style={{ fontFamily: linkInBio?.font || 'inherit' }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── Merch Integration Banner ── */}
          <div className="mb-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-bold mb-2 text-blue-800">Merch Integration</h4>
            <p className="text-blue-600 text-sm">
              {!user?.printifyShopId
                ? "Connect your Printify store to your Profile to add merch to your release pages"
                : "Your Printify store is connected. Select products to feature below."
              }
            </p>
          </div>

          {/* ── Newsletter Signup ── */}
          <div className="mb-4 p-4 bg-indigo-50 rounded-md border border-indigo-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" checked={newsletterEnabled} onChange={e => setNewsletterEnabled(e.target.checked)} />
              <span className="font-bold text-indigo-800">📣 Collect newsletter signups</span>
            </label>
            <p className="text-indigo-600 text-sm mt-1">Show a signup form on your public page so fans can join your Outreach contacts.</p>
            {newsletterEnabled && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-indigo-700 mb-2">Fields to collect (email is always required):</p>
                <div className="flex flex-wrap gap-3">
                  {[["name", "Name"], ["phone", "Phone"], ["instagram", "Instagram"], ["tiktok", "TikTok"]].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" className="checkbox checkbox-xs" checked={newsletterFields.includes(key)} onChange={() => toggleNewsletterField(key)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Product Selection ── */}
          {user?.printifyShopId && (
            <div className="mt-8 w-full border-t pt-6">
              <div className="mb-4 text-center">
                <h2 className="text-md font-semibold" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                  🛍️ Select Products from Printify (Max 10)
                </h2>
              </div>

              {isLoadingProducts ? (
                <div className="text-center py-8" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                  <div className="animate-pulse mx-auto max-w-sm">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                  <p className="mt-4 text-gray-600">Loading your products...</p>
                </div>
              ) : availableProducts.length > 0 ? (
                <>
                  {/* Selection Summary */}
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-4 mb-4 mx-auto w-full">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-700" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                          {selectedProductIds.length}/10 selected
                        </span>
                        {selectedProductIds.length === 10 && (
                          <span className="text-xs text-orange-600" style={{ fontFamily: linkInBio?.font || 'inherit' }}>Max reached</span>
                        )}
                      </div>
                      {selectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds([])}
                          className="btn btn-sm btn-alert text-xs px-2 py-1"
                          style={{ fontSize: '11px', fontFamily: linkInBio?.font || 'inherit' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="mx-auto w-full">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">

                        {/* Mobile Card Layout */}
                        <div className="md:hidden">
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
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                                    selectedProductIds.includes(product.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                  }`}>
                                    {selectedProductIds.includes(product.id) && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.images && product.images.length > 0 && product.images[0] ? (
                                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/48x48/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`; }} />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                                        <span className="text-gray-400 text-xs">📦</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 leading-tight" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                                      {product.title && product.title.length > 40 ? `${product.title.substring(0, 40)}...` : product.title || 'Untitled Product'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                                      {product.variants?.length || 1} variant{(product.variants?.length || 1) > 1 ? 's' : ''}
                                    </div>
                                    <div className="text-sm font-semibold text-green-600 mt-1" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
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
                                    selectedProductIds.includes(product.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                  }`}
                                  onClick={() => toggleProductSelection(product.id)}
                                >
                                  <td className="px-2 py-2">
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                      selectedProductIds.includes(product.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                    }`}>
                                      {selectedProductIds.includes(product.id) && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                      {product.images && product.images.length > 0 && product.images[0] ? (
                                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover"
                                          onError={(e) => { e.currentTarget.src = `https://via.placeholder.com/40x40/4ecdc4/ffffff?text=${encodeURIComponent(product.title?.substring(0, 1) || 'P')}`; }} />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                                          <span className="text-gray-400 text-xs">📦</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-3">
                                    <div className="text-sm font-medium text-gray-900" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                                      {product.title && product.title.length > 60 ? `${product.title.substring(0, 60)}...` : product.title || 'Untitled Product'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                                      {product.variants?.length || 1} variant{(product.variants?.length || 1) > 1 ? 's' : ''}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="text-sm font-semibold text-green-600" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
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
                    <div className="text-xs text-gray-500 mt-2 text-center" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                      Showing {availableProducts.length} products • Scroll to see more
                    </div>
                  </div>
                </>
              ) : (
                <div className="mx-auto w-full">
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg" style={{ fontFamily: linkInBio?.font || 'inherit' }}>
                    <div className="text-4xl text-gray-400 mb-2">🏪</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No Products Found</h3>
                    <p className="text-sm text-gray-500">Make sure your Printify store has published products.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Alert ── */}
          {alert && (
            <div className="alert mt-5 w-100" style={{ backgroundColor: "darkgrey", border: "1px darkgrey solid" }}>
              {alert}
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div style={{ textAlign: "center" }}>
            <button
              className="btn btn-alert btn-block btn-sm btn-narrow"
              style={{ width: "35%", display: "inline", margin: "2% 5%", fontFamily: linkInBio?.font || 'inherit' }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-block btn-sm btn-narrow"
              style={{ width: "35%", display: "inline", margin: "8% 0 0", fontFamily: linkInBio?.font || 'inherit' }}
              onClick={(e) => handleEditLinkInBio(e)}
              type="submit"
            >
              Submit
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LinkInBio;