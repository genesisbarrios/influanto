import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faUserPlus,
  faCompactDisc,
  faEnvelopeOpenText,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// A monochrome, animated stand-in for a screenshot: five stages of the
// influanto workflow connected by flowing lines, with dots traveling the
// path and each node pulsing in turn — reads as "marketing pipeline" without
// leaning on any brand color, so it sits cleanly on the hero's own background.

const NODES: { icon: IconDefinition; label: string; left: number; top: number }[] = [
  { icon: faLightbulb, label: "Create", left: 10, top: 72.22 },
  { icon: faUserPlus, label: "Register", left: 32.5, top: 25 },
  { icon: faCompactDisc, label: "Release", left: 55, top: 72.22 },
  { icon: faEnvelopeOpenText, label: "Notify", left: 77.5, top: 25 },
  { icon: faChartLine, label: "Grow", left: 93.33, top: 55.56 },
];

const PATHS = [
  "M60,260 C127.5,260 127.5,90 195,90",
  "M195,90 C262.5,90 262.5,260 330,260",
  "M330,260 C397.5,260 397.5,90 465,90",
  "M465,90 C512.5,90 512.5,200 560,200",
];

const MarketingWorkflowAnimation = () => {
  return (
    <div className="relative w-full aspect-[5/3] rounded-3xl border border-white/15 bg-white/5 backdrop-blur-sm">
      <style>{`
        @keyframes workflow-flow {
          to { stroke-dashoffset: -160; }
        }
        .workflow-flow-line {
          stroke-dasharray: 6 10;
          animation: workflow-flow 3.5s linear infinite;
        }
        @keyframes workflow-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(255,255,255,0); }
        }
        .workflow-node {
          animation: workflow-pulse 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .workflow-flow-line, .workflow-node, .workflow-particle { animation: none !important; }
        }
      `}</style>

      <svg viewBox="0 0 600 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={2}
            className="workflow-flow-line"
          />
        ))}
        {PATHS.map((d, i) => (
          <circle key={i} r={4} fill="rgba(255,255,255,0.9)" className="workflow-particle">
            <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${i * 0.7}s`} path={d} />
          </circle>
        ))}
      </svg>

      {NODES.map((node, i) => (
        <div
          key={node.label}
          className="absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.left}%`, top: `${node.top}%` }}
        >
          <div
            className="workflow-node w-14 h-14 md:w-16 md:h-16 rounded-full border border-white/40 bg-white/10 flex items-center justify-center text-white text-lg md:text-xl"
            style={{ animationDelay: `${i * 500}ms` }}
          >
            <FontAwesomeIcon icon={node.icon} />
          </div>
          <span className="text-[11px] md:text-xs text-white/70 font-semibold whitespace-nowrap">
            {node.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MarketingWorkflowAnimation;
