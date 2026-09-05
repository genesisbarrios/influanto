"use client"

import React, { useEffect, useMemo, useState } from 'react';
import apiClient from "@/libs/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faTwitter, faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { MUSIC_CATEGORIES } from "@/libs/categories";
const fallbackImageUrl = "https://images.pexels.com/photos/399772/pexels-photo-399772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

const PAGE_SIZE = 9;

const Community = () => {
  const [users, setUsers] = useState<any>();
  const [alert, setAlertt] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const getUsers = async () => {
    try {
      const { data } = await apiClient.get("/get-users");
      const filteredUsers = data.filter((user: any) =>
        user.name && (user.image || user.instagram || user.twitter || user.facebook || user.spotify || user.youtube) &&
        user.username &&
        user.username !== null &&
        user.username !== "" &&
        user.name !== null &&
        user.name !== "" &&
        user.bio !== null &&
        user.bio !== undefined &&
        user.bio !== ""
      );
      setUsers(filteredUsers);
    } catch (e) {
      setAlertt(e?.message);
    }
  }

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    if (!users) {
      getUsers();
    }
  }, [users]);

  // Reset back to page 1 whenever the search or category filter changes so
  // a narrower result set never leaves the user stranded on an empty page.
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

    useEffect(() => {
      document.title = "Community | Influanto";

      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', 'Community | Influanto.');

      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', 'Community | Influanto');

      // Update og:description
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', 'The all in one music marketing tool.');

      // Update twitter:title
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', 'Community | Influanto');

      // Update twitter:description
      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', 'The all in one music marketing tool.');
    }, []);

  // Only offer categories that at least one visible user actually has,
  // so the filter never shows an option that would return zero results.
  const availableCategories = useMemo(() => {
    if (!users) return [];
    const present = new Set<string>();
    users.forEach((u: any) => (Array.isArray(u.category) ? u.category : []).forEach((c: string) => present.add(c)));
    return MUSIC_CATEGORIES.filter((c) => present.has(c));
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    return users.filter((user: any) => {
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.username?.toLowerCase().includes(q) ||
        user.bio?.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || (Array.isArray(user.category) && user.category.includes(categoryFilter));
      return matchesSearch && matchesCategory;
    });
  }, [users, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!users) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="p-4 bg-white shadow rounded-md text-black">
        <div className="w-full flex justify-between items-center">
          <h2 className="text-2xl font-bold mb-2">Community</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              className="input input-sm input-bordered w-full pl-9"
              placeholder="Search by name, username, or bio"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select select-sm select-bordered w-full sm:w-56"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No members match your search.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {pagedUsers.map((user: any) => (
              <a key={user.id ?? user.username} href={`https://influanto.com/${user.username}`} target="_blank" rel="noopener noreferrer" className="block min-w-0">
                <div className="bg-gray-100 p-2 sm:p-4 rounded-lg shadow-md min-w-0">
                  <div className="flex flex-col items-center text-center gap-1 mb-2 sm:flex-row sm:items-center sm:gap-0 sm:space-x-4 sm:text-left min-w-0">
                    <img
                      src={user.image || fallbackImageUrl}
                      alt={user.name}
                      width={50}
                      height={50}
                      className="rounded-full w-8 h-8 sm:w-[50px] sm:h-[50px] sm:mr-2 flex-shrink-0"
                    />
                    <h3 className="text-xs sm:text-sm text-blue-500 font-semibold truncate w-full min-w-0">{user.name}</h3>
                  </div>
                  {Array.isArray(user.category) && user.category.length > 0 && (
                    <p className="text-[9px] sm:text-[10px] text-indigo-500 font-medium mb-1 text-center sm:text-left break-words">
                      {user.category.join(" · ")}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2 break-words">{user.bio && user.bio.length > 60 ? user.bio.slice(0, 60) + "..." : user.bio}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.instagram && (
                      <a href={`https://instagram.com/${user.instagram}`} target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faInstagram} className="text-pink-500" />
                      </a>
                    )}
                    {user.twitter && (
                      <a href={`https://twitter.com/${user.twitter}`} target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faTwitter} className="text-blue-400" />
                      </a>
                    )}
                    {user.facebook && (
                      <a href={user.facebook} target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faFacebook} className="text-blue-600" />
                      </a>
                    )}
                    {user.spotify && (
                      <a href={`https://open.spotify.com/artist/${user.spotify}`} target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faSpotify} className="text-green-500" />
                      </a>
                    )}
                    {user.youtube && (
                      <a href={`https://youtube.com/@${user.youtube}`} target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon={faYoutube} className="text-red-500" />
                      </a>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default Community;
