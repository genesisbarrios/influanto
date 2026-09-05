import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import ButtonSignin from "@/components/ButtonSignin";
import ButtonAccount from "@/components/ButtonAccount";
import ButtonGetInfluanto from "@/components/ButtonGetInfluanto";

export const metadata = getSEOTags({
  title: `How To Setup Your Printify Store with Influanto | ${config.appName}`,
  canonicalUrlRelative: "/how-to-setup-your-store",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          How To Setup Your Printify Store to link with Influanto!
        </h1>

        <div className="leading-relaxed" style={{ fontFamily: "sans-serif" }}>

          <p>Welcome to influanto!</p>

          <ol className="list-decimal pl-5">
            <li>
              Sign Up for an Account by signing in with your email or Gmail account.
              <img
                src="/1.signin.gif"
                alt="Sign Up Example"
                className="my-4"
              />
            </li>
            <li>
              Now you can access the dashboard with all of our features on the left menu.
              <img
                src="/2.dashboardmenu.gif"
                alt="Dashboard Example"
                className="my-4"
              />
            </li>
            <li>
              Customize your profile first with your avatar image and bio. 
              <img
                src="/3.profile.gif"
                alt="Profile Customization Example"
                className="my-4"
              />
            </li>
            <li>
              To create your store, login to Printify and on the Dashboard Click on the menu (usually top-left) and select &quot;Add a new store&quot;. 
              <img
                src="/printify-add-store.png"
                alt="Create Store Printify"
                className="my-4"
              />
            </li>
            <li>
              Connect your printify account with your store URL on the Profile Page.
              <img
                src="/printify-connect-url.png"
                alt="Sales Channel Printify"
                className="my-4"
              />
            </li>
            <li>
              Then Add Links To Your Link in Bio and select featured products.
              <img
                src="/4.linkinbio.gif"
                alt="Link In Bio Customization Example"
                className="my-4"
              />
            </li>
          </ol>
          <p style={{marginTop:"10%"}}>Thank you for using influanto!</p>
          <div style={{textAlign:"center", margin:"10% 0" }}><ButtonGetInfluanto /></div>
          <p>
            For any questions or concerns, please contact us at 
            <a href="mailto:info@influanto.com" className="text-blue-500">
               info@influanto.com
            </a>.
          </p>

         
        </div>
      </div>
    </main>
  );
};

export default TOS;
