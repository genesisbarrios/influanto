"use client";

import config from "@/config";
import { signIn } from "next-auth/react";
import React from "react";
import Link from "next/link";

const Blocked = () => {
	return (
		<main className="relative bg-neutral text-neutral-content h-screen w-full flex flex-col justify-center gap-8 items-center p-10">
			<h1 className="text-xl md:text-2xl font-medium">
				Too Many Requests, Access Blocked...
			</h1>
			<p>Try again in 1 minute</p>

			<div>
				<button
					onClick={() =>
						signIn(undefined, {
							callbackUrl: config.auth.callbackUrl,
						})
					}
					className="link"
				>
					Login
				</button>{" "}
				or{" "}
				<Link className="link" href="/">
					Home
				</Link>
			</div>
		</main>
	);
};

export default Blocked;