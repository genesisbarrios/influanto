"use client";

import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";

// This component is used to collect the emails from the landing page
// You'd use this if your product isn't ready yet or you want to collect leads
// For instance: A popup to send a freebie, joining a waitlist, etc.
// It calls the /api/lead/route.js route and store a Lead document in the database
const ButtonEdit = ({ extraStyle }: { extraStyle?: string }) => {
  const inputRef = useRef(null);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
  };
  return (
    <button 
        className="btn btn-primary btn-block btn-sm btn-narrow"
        type="submit"
        disabled={isDisabled} style={{width:"15%", display:"inline"}}
      >
       Edit
       
      </button>
  );
};

export default ButtonEdit;
