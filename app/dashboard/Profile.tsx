import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const Profile = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session) {
        // Assuming '/api/user' is your API route that returns user data
        const res = await fetch(`/api/user/${session.user.id}`);
        const userData = await res.json();
        setUser(userData);
      }
    };

    fetchUserData();
  }, [session]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-xl mx-auto space-y-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">User Dashboard</h1>
          <p>Welcome {user.email} 👋</p>
        </section>
      </main>
    </>
  );
};

export default Profile;