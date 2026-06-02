import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import config from "@/config";
import image from "@/app/homepage.png";
import ButtonGetInfluanto from "./ButtonGetInfluanto";

const Hero = () => {
  return (
    <section className="max-w-12xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">

        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
         The all in one marketing platform for artists and musicians.
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          The platform with all you need to market and promote your music.
        </p>
        <p className="text-lg opacity-80 leading-relaxed">
          Link In Bio, Release Pages, QR Code Generator, Split Sheet Generator, and Manage your Contacts / Outreach.
        </p>
        <p className="text-lg opacity-80 leading-relaxed">
          Free Musician Tools: Split Sheet Generator, Delay & Reverb Calculator, BPM Calculator + more.
        </p>
        <ButtonGetInfluanto />

        <TestimonialsAvatars priority={true} />
      </div>
      <div className="medium:w-full">
        <Image
          src={image}
          alt="artist image"
          className="w-full"
          priority={true}
          width={500}
          height={500}
        />
      </div>
    </section>
  );
};

export default Hero;
