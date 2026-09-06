"use client";

import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShareNodes, faHourglassHalf, faHeartCrack } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const Arrow = ({ extraStyle, delay }: { extraStyle: string; delay: number }) => {
  return (
    <svg
      className={`shrink-0 w-12 fill-neutral-content opacity-70 problem-arrow ${extraStyle}`}
      style={{ animationDelay: `${delay}ms` }}
      viewBox="0 0 138 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M72.9644 5.31431C98.8774 43.8211 83.3812 88.048 54.9567 120.735C54.4696 121.298 54.5274 122.151 55.0896 122.639C55.6518 123.126 56.5051 123.068 56.9922 122.506C86.2147 88.9044 101.84 43.3918 75.2003 3.80657C74.7866 3.18904 73.9486 3.02602 73.3287 3.44222C72.7113 3.85613 72.5484 4.69426 72.9644 5.31431Z"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M56.5084 121.007C56.9835 118.685 57.6119 115.777 57.6736 115.445C59.3456 106.446 59.5323 97.67 58.4433 88.5628C58.3558 87.8236 57.6824 87.2948 56.9433 87.3824C56.2042 87.4699 55.6756 88.1435 55.7631 88.8828C56.8219 97.7138 56.6432 106.225 55.0203 114.954C54.926 115.463 53.5093 121.999 53.3221 123.342C53.2427 123.893 53.3688 124.229 53.4061 124.305C53.5887 124.719 53.8782 124.911 54.1287 125.015C54.4123 125.13 54.9267 125.205 55.5376 124.926C56.1758 124.631 57.3434 123.699 57.6571 123.487C62.3995 120.309 67.4155 116.348 72.791 113.634C77.9171 111.045 83.3769 109.588 89.255 111.269C89.9704 111.475 90.7181 111.057 90.9235 110.342C91.1288 109.626 90.7117 108.878 89.9963 108.673C83.424 106.794 77.3049 108.33 71.5763 111.223C66.2328 113.922 61.2322 117.814 56.5084 121.007Z"
        />
      </g>
    </svg>
  );
};

// A circular icon badge with a mouse-tracked 3D tilt (like a physical card
// pivoting toward the cursor) plus a continuous idle float, so the three
// pain points feel alive instead of three flat glyphs sitting in a row.
const TiltBadge = ({ icon, delay }: { icon: IconDefinition; delay: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [tilt, setTilt] = useState<CSSProperties>({});

  const handleMove = (e: MouseEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 20;
    const rotateX = -(y / (rect.height / 2)) * 20;
    setTilt({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.1,1.1,1.1)`,
    });
  };

  const handleLeave = () => {
    setTilt({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)" });
  };

  return (
    <div className="problem-badge-float" style={{ animationDelay: `${delay}ms` }}>
      <span
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ ...tilt, transformStyle: "preserve-3d" }}
        className="problem-badge-tilt relative flex items-center justify-center w-20 h-20 rounded-full text-3xl text-accent
          bg-gradient-to-br from-neutral-content/25 to-neutral-content/5 ring-1 ring-neutral-content/25
          shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)",
            transform: "translateZ(1px)",
          }}
        />
        <span style={{ transform: "translateZ(24px)" }} className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">
          <FontAwesomeIcon icon={icon} />
        </span>
      </span>
    </div>
  );
};

const Step = ({ icon, text, delay }: { icon: IconDefinition; text: string; delay: number }) => {
  return (
    <div className="w-full md:w-48 flex flex-col gap-4 items-center justify-center">
      <TiltBadge icon={icon} delay={delay} />
      <h3 className="font-bold">{text}</h3>
    </div>
  );
};

// Problem Agitation: A crucial, yet overlooked, component for a landing page that sells.
// It goes under your Hero section, and above your Features section.
// Your Hero section makes a promise to the customer: "Our product will help you achieve XYZ".
// Your Problem section explains what happens to the customer if its problem isn't solved.
// The copy should NEVER mention your product. Instead, it should dig the emotional outcome of not fixing a problem.
// For instance:
// - Hero: "influanto helps developers launch startups fast"
// - Problem Agitation: "Developers spend too much time adding features, get overwhelmed, and quit." (not about influanto at all)
// - Features: "influanto has user auth, Stripe, emails all set up for you"
const Problem = () => {
  return (
    <section className="bg-neutral text-neutral-content">
      <style>{`
        @keyframes problem-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .problem-badge-float {
          animation: problem-float 3.2s ease-in-out infinite;
        }
        .problem-badge-tilt {
          transition: transform 0.15s ease-out;
          will-change: transform;
        }
        @keyframes problem-arrow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        .problem-arrow {
          animation: problem-arrow-pulse 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .problem-badge-float, .problem-arrow { animation: none; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-8 py-16 md:py-32 text-center">
        <h2 className="max-w-3xl mx-auto font-extrabold text-4xl md:text-5xl tracking-tight mb-6 md:mb-8">
          Tiring of having to go to multiple platforms for support?
        </h2>
        <p className="max-w-xl mx-auto text-lg opacity-90 leading-relaxed mb-12 md:mb-20">
          with influanto you can create your Link in Bio, fully customizable Release Pages with Analytics, generate QR Codes, find Playlist Curators, Send Newsletters and manage contacts all in one place.
        </p>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-6">
          <Step icon={faShareNodes} text="managing promotion across multiple platforms" delay={0} />

          <Arrow extraStyle="max-md:-scale-x-100 md:-rotate-90" delay={200} />

          <Step icon={faHourglassHalf} text="Struggling to find time" delay={150} />

          <Arrow extraStyle="md:-scale-x-100 md:-rotate-90" delay={400} />

          <Step icon={faHeartCrack} text="Stops Following up and Promoting, losing fans in the process" delay={300} />
        </div>
      </div>
    </section>
  );
};

export default Problem;
