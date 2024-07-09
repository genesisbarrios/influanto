import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import User from "@/models/User";
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from "next-auth/react";

// Define a TypeScript interface for the user prop to ensure type safety
interface User {
  email: string;
  name: string;
  avatarUrl: string; // Assuming there's an avatar URL you want to display
}

async function getUser() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/user/getUser`);
  const user = await res.json();

  console.log('get user')
  console.log(user);
  return user; // Return data instead of res to return the JSON response body
}

const Profile = async () => {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = async () => {
    const userData = await getUser();
    setUser(userData);
    console.log(userData);
  };

  useEffect(() => {
    console.log('gfetch user');
    fetchUser();
  }, []);

  useEffect(() => {
    // Call the async function
    if(!user) {
      fetchUser();
    }else{
      console.log(user);
    }

  }, [user]);

   // Check if user data is not yet loaded
  if (!user) {
    return <div>Thanks for signing up...</div>;
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-2">Profile</h2>
      <img src="" style={{ borderRadius: '50%' }} alt="Profile" />
      <p>{user.email}</p>
      <p>{user.name}</p>
    </div>
  );
};

export default Profile;