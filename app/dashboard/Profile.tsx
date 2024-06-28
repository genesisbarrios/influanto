// Import necessary libraries
import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";


const Profile = () => {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-2">Profile</h2>
      <p>Thanks for signing up!</p>
    </div>
  );
};

export default Profile;