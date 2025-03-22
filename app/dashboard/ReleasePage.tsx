"use client"
/* eslint-disable */
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import React, { useEffect, useState } from 'react';
import apiClient from "@/libs/api";
import { useSession } from "next-auth/react";
import Head from 'next/head';
import { CldUploadWidget } from 'next-cloudinary';

const ReleasePages = () => {
  const { data, status } = useSession();
  const [releasePages, setReleasePages] = useState<any[]>([]);
  const [alert, setAlert] = useState("");
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [createPage, setCreatePage] = useState(false);

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
    } catch (e) {
      console.error(e?.message); // Log the error instead of triggering an alert
      setAlert(e?.message);
    }
  };

  useEffect(() => {
    if (data?.user?.id) {
      getReleasePages(data?.user?.id);
    }
  }, [data]);

  const handleCreate = async () => {
   setCreatePage(true);
  };

  const handleEdit = (page: any) => {
    setEditingPage(page);
  };

  const handleSave = async () => {
    try {
      console.log('editing page');
      console.log(editingPage);
      //await apiClient.put(`/update-release-page/${editingPage.id}`, editingPage);
      //setEditingPage(null);
      //setCreatePage(false);
      //getReleasePages(data?.user?.id);
    } catch (e) {
      console.error(e?.message); // Log the error instead of triggering an alert
      setAlert(e?.message);
    }
  };

  const handleImageUpload = (result: any) => {
    console.log(result);
      const imageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1742637738/${result.info.publicId}.png`;
      setEditingPage({ ...editingPage, image: imageUrl });
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
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

  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [linksColor, setLinksColor] = useState("#0000ff");

  return (
    <>
      <Head>
        <title>Influanto | Release Pages</title>
        <meta name="description" content="Manage your Release Pages" />
      </Head>
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Release Pages</h2>
          {Array.isArray(releasePages) && releasePages.length < 3 && !createPage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
            >
              Create
            </button>
          )}
        </div>
        {createPage ? (
          <div className="p-4 bg-gray-100 rounded-md">
            <h3 className="text-xl font-bold mb-4">Create Release Page</h3>
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
                uploadPreset="ReleasePageImages" // Replace with your actual upload preset
                options={{ publicId: `user_${data?.user?.id}_releasePage_thumbnail_${editingPage.name}` }}
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
                key={page.id}
                className="relative rounded-lg overflow-hidden shadow-lg"
                style={{
                  backgroundImage: `url(${page.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: "200px",
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white">
                  <h3 className="text-lg font-bold">{page.title}</h3>
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => handleEdit(page)}
                  >
                    Edit
                  </button>
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
                value={editingPage.name || ""}
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
                value={editingPage.description || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, description: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Image</label>
              <CldUploadWidget
                uploadPreset="ReleasePageImages" // Replace with your actual upload preset
                options={{ publicId: `user_${data?.user?.id}_releasePage_thumbnail_${editingPage.name}` }}
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
              {editingPage.image && (
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
                value={editingPage.video || ""}
                onChange={(e) =>
                  setEditingPage({ ...editingPage, video: e.target.value })
                }
              />
              {editingPage.video && getYouTubeVideoId(editingPage.video) && (
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(editingPage.video)}`}
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
                      onChange={(e) => handleLinkChange(index, "name", e.target.value)}
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