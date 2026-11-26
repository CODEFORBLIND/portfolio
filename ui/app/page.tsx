"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import CanvasNCA from "./components/CanvasNCA";

// ---- Content ----------------------------------------------------------------
type Side = "left" | "right" | "center";

type NodeData = {
  id: string;
  side: Side;
  kicker: string;
  title: string;
  subtitle?: string;
  body: string;
  tags: string[];
  hint?: string;
  githubUrl?: string;
  liveUrl?: string;
};

const NODES: NodeData[] = [
  {
    id: "education-bsc",
    side: "left",
    kicker: "EDUCATION",
    title: "Bachelor of Computer Applications",
    subtitle: "S.S Jain Subodh PG College, Jaipur | 2022 – 2025",
    body: "Scored 86% while mastering core computer science fundamentals—algorithmic complexity, OOP, and low-level systems logic that underpin modern ML architectures.",
    tags: ["C++", "CS Fundamentals"],
  },
  {
    id: "education-mca",
    side: "right",
    kicker: "POSTGRADUATE",
    title: "Master of Computer Applications",
    subtitle: "Savitribai Phule Pune University (SPPU) | Expected 2027",
    body: "Advancing graduate expertise in artificial intelligence, machine learning, neural architectures, and intelligent software systems.",
    tags: ["AI / ML", "Neural Architectures", "Deep Learning"],
  },
  {
    id: "experience",
    side: "left",
    kicker: "EXPERIENCE",
    title: "Junior Penetration Tester",
    subtitle: "ASD Cyber Security | Mar 2024 – Apr 2024",
    body: "Executed end-to-end VAPT across networks and web applications using Nmap, Nessus, and Wireshark. Simulated adversarial attacks with Metasploit and BurpSuite on Kali Linux to uncover vulnerabilities and architect remediation strategies.",
    tags: ["VAPT", "BurpSuite", "Metasploit", "Wireshark", "Nmap", "Nessus"],
    hint: "Drag cursor across the background to simulate network damage.",
  },
  {
    id: "placemate",
    side: "right",
    kicker: "ONGOING • MULTI-AGENT WEB PLATFORM",
    title: "PlaceMate: Multi-Agent Web platform",
    body: "Architecting an AI-powered campus recruitment platform featuring automated resume ATS scoring, pgvector-backed RAG search, and an AI skill-upskilling tutor agent. Built with role-based student and placement cell dashboards powered by multi-agent workflows.",
    tags: ["Next.js", "TypeScript", "Supabase (pgvector)", "Google ADK", "CrewAI"],
    githubUrl: "https://github.com/CODEFORBLIND/placemate",
  },
  {
    id: "rag-scanner",
    side: "left",
    kicker: "AI / ML PROJECT • LLM EVALUATION",
    title: "RAG Hallucination Scanner",
    body: "Engineered an automated evaluation pipeline to detect and mitigate hallucinations in RAG systems. Built custom mathematical verification logic using NumPy, NLTK, and Sentence-Transformers to score output faithfulness against source contexts.",
    tags: ["Python", "NumPy", "Sentence-Transformers", "NLTK", "RAG"],
    githubUrl: "https://github.com/CODEFORBLIND/hallucination-scanner",
  },
  {
    id: "career-pipeline",
    side: "right",
    kicker: "AGENTIC AI PROJECT • MULTI-AGENT SYSTEMS",
    title: "Intelligent Career Automation System",
    body: "Architected an end-to-end multi-agent pipeline using Python and CrewAI to automate role-matching and dynamically generate ATS-optimized HTML/Markdown resumes and tailored cover letters. Engineered custom webhook triggers, automated email outreach, and centralized CSV status tracking.",
    tags: ["CrewAI", "Python", "Agentic AI", "Webhooks", "Automation"],
    githubUrl: "https://github.com/CODEFORBLIND/Job_AI_automation",
  },
  {
    id: "tokenizer",
    side: "left",
    kicker: "NLP INFRASTRUCTURE • FROM SCRATCH",
    title: "Custom LLM Tokenizer",
    body: "Engineered a Byte-Pair Encoding (BPE) tokenization algorithm from scratch in Python, building core text encoding and decoding pipelines for Large Language Models. Trained custom tokenizer vocabularies to optimize subword compression and NLP data preprocessing.",
    tags: ["Python", "BPE", "LLM Preprocessing", "NLP"],
    githubUrl: "https://github.com/CODEFORBLIND/Tokenizer",
  },
  {
    id: "micrograd",
    side: "right",
    kicker: "DEEP LEARNING ENGINE • FROM SCRATCH",
    title: "Micrograd: Autograd & Neural Net Engine",
    body: "Implemented a scalar-valued automatic differentiation engine and neural network library from scratch in Python. Built dynamic computation graphs (DAGs) with reverse-mode backpropagation and multi-layer perceptron (MLP) training loops without high-level ML frameworks.",
    tags: ["Python", "Backpropagation", "Neural Networks"],
    githubUrl: "https://github.com/CODEFORBLIND/Micrograd",
  },
  {
    id: "leadership",
    side: "left",
    kicker: "LEADERSHIP & COMMUNITY",
    title: "Vice Chairperson",
    subtitle: "SPPU ACM Student Chapter",
    body: "Directed the chapter's inaugural event and collaborated with industry experts to organize technical workshops and academic keynotes.",
    tags: ["ACM Leadership", "Technical Workshops"],
  },
];

// ---- Animation variants -----------------------------------------------------
const cardVariants: Record<Side, Variants> = {
  left: {
    hidden: { opacity: 0, x: -90 },
    show: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 90 },
    show: { opacity: 1, x: 0 },
  },
  center: {
    hidden: { opacity: 0, y: 60, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1 },
  },
};

const rowAlign: Record<Side, string> = {
  left: "md:justify-start",
  right: "md:justify-end",
  center: "md:justify-center",
};

const cardWidth: Record<Side, string> = {
  left: "md:w-[calc(50%-3rem)]",
  right: "md:w-[calc(50%-3rem)]",
  center: "md:w-[min(34rem,100%)]",
};

// ---- Icons ------------------------------------------------------------------
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 2.25 0 003 8.25v10.5A2.25 2.25 2.25 0 005.25 21h10.5A2.25 2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// ---- Pieces -----------------------------------------------------------------
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-500/30 bg-cyan-400/10 px-2.5 py-1 font-mono text-[11px] tracking-wide text-cyan-200">
      {children}
    </span>
  );
}

function NodeCard({ node }: { node: NodeData }) {
  const cardRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    // The card is "active" when it is crossing the center of the viewport
    offset: ["start center", "end center"],
  });

  // Transform scroll progress into an active state (1 in center, 0 at edges)
  const activeState = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  
  // Visual transformations based on active state
  const cardOpacity = useTransform(activeState, [0, 1], [0.5, 1]);
  const cardScale = useTransform(activeState, [0, 1], [0.95, 1]);
  const borderColor = useTransform(
    activeState,
    [0, 1],
    ["rgba(8, 145, 178, 0.3)", "rgba(34, 211, 238, 0.7)"] // cyan-600/30 to cyan-400/70
  );
  const glow = useTransform(
    activeState,
    [0, 1],
    ["0px 0px 0px rgba(34, 211, 238, 0)", "0px 0px 40px -10px rgba(34, 211, 238, 0.35)"]
  );

  // Spotlight mouse tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative flex w-full px-4 md:px-0">
      <div className={`flex w-full ${rowAlign[node.side]}`}>
        <motion.article
          ref={cardRef}
          variants={cardVariants[node.side]}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            opacity: cardOpacity,
            scale: cardScale,
            borderColor,
            boxShadow: glow,
          }}
          className={`relative w-full ${cardWidth[node.side]} overflow-hidden rounded-2xl border bg-black/40 p-6 backdrop-blur-md transition-colors`}
        >
          {/* Cursor Spotlight Overlay */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
            animate={{ opacity: isHovered ? 1 : 0 }}
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 211, 238, 0.1), transparent 40%)`,
            }}
          />

          <div className="relative z-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-400/80">
              {node.kicker}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">
              {node.title}
            </h2>
            {node.subtitle && (
              <p className="mt-1 text-sm font-medium text-cyan-300">
                {node.subtitle}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {node.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {node.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            
            {(node.githubUrl || node.liveUrl) && (
              <div className="mt-6 flex flex-wrap gap-4 border-t border-cyan-900/30 pt-4">
                {node.githubUrl && (
                  <a 
                    href={node.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 font-mono text-xs text-cyan-400 transition-colors hover:text-cyan-200"
                  >
                    <GitHubIcon /> Source Code
                  </a>
                )}
                {node.liveUrl && (
                  <a 
                    href={node.liveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 font-mono text-xs text-cyan-400 transition-colors hover:text-cyan-200"
                  >
                    <ExternalLinkIcon /> Live Demo
                  </a>
                )}
              </div>
            )}

            {node.hint && (
              <p className="mt-4 border-t border-cyan-900/30 pt-3 font-mono text-[11px] text-cyan-300/70">
                 {node.hint}
              </p>
            )}
          </div>
        </motion.article>
      </div>

      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="absolute left-1/2 top-8 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_3px_rgba(34,211,238,0.6)] md:block"
        aria-hidden
      />
      {node.side !== "center" && (
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{ originX: node.side === "right" ? 0 : 1 }}
          className={`absolute top-[2.4rem] hidden h-px w-12 bg-gradient-to-r from-cyan-400/70 to-cyan-400/10 md:block ${
            node.side === "right"
              ? "left-1/2"
              : "right-1/2 rotate-180"
          }`}
          aria-hidden
        />
      )}
    </div>
  );
}

// Step 1: Terminal Contact Node
function ContactNode() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("chelsimanishjain@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-24 flex w-full justify-center px-4 md:px-0">
      <motion.article
        variants={cardVariants.center}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-black/50 p-8 text-center shadow-[0_0_50px_-10px_rgba(34,211,238,0.25)] backdrop-blur-md"
      >
        <h2 className="mb-2 text-2xl font-bold text-white">Open a Connection</h2>
        <p className="mb-8 font-mono text-sm text-cyan-200/80">
          Ready to build intelligent systems? Let's talk.
        </p>

        <div className="flex flex-col items-center gap-4">
          <a
            href="chelsimanishjain@gmail.com"
            className="group flex w-full max-w-sm items-center justify-between rounded-lg border border-cyan-900/50 bg-cyan-950/30 p-3 transition-colors hover:border-cyan-500/50 hover:bg-cyan-900/40"
          >
            <span className="font-mono text-sm text-cyan-100">chelsimanishjain@gmail.com</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleCopyEmail();
              }}
              className="rounded bg-black/40 px-2 py-1 font-mono text-xs text-cyan-400 transition-colors hover:bg-cyan-400/20"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </a>

          <div className="flex w-full max-w-sm gap-4">
            <a
              href="https://github.com/CODEFORBLIND"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-900/50 bg-cyan-950/30 p-3 font-mono text-sm text-cyan-100 transition-colors hover:border-cyan-500/50 hover:bg-cyan-900/40"
            >
              <GitHubIcon /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/chelsi-jain-978211321"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cyan-900/50 bg-cyan-950/30 p-3 font-mono text-sm text-cyan-100 transition-colors hover:border-cyan-500/50 hover:bg-cyan-900/40"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>

          <a
            href="/Resume_new_final.pdf"
            download
            className="group mt-2 flex items-center gap-2 rounded-full border border-cyan-400 bg-cyan-400/10 px-6 py-2.5 font-mono text-sm text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-black"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Resume
          </a>
        </div>
      </motion.article>

      {/* Junction dot for the final node */}
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="absolute left-1/2 top-0 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_3px_rgba(34,211,238,0.6)] md:block"
        aria-hidden
      />
    </div>
  );
}

const TITLES = [
  "AI/ML ENGINEER",
  "AGENTIC WOKFLOWS"
];

function TypewriterSubtitle() {
  const [text, setText] = useState("");
  const [titleIndex, setTitleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTitle = TITLES[titleIndex];
    const typeSpeed = isDeleting ? 40 : 120;
    
    // Pause longer when the word is fully typed, and a short pause when fully deleted
    const delay = text === currentTitle && !isDeleting ? 2500 : 
                  text === "" && isDeleting ? 400 : typeSpeed;

    const timeout = setTimeout(() => {
      if (!isDeleting && text === currentTitle) {
        setIsDeleting(true);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setTitleIndex((prev) => (prev + 1) % TITLES.length);
      } else {
        setText(currentTitle.substring(0, text.length + (isDeleting ? -1 : 1)));
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, titleIndex]);

  return (
    <div className="mt-4 flex min-h-[1.5rem] items-center justify-center font-mono text-sm uppercase tracking-[0.3em] text-cyan-200/80 sm:text-base">
      <span>{text}</span>
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="ml-2 inline-block h-4 w-2 bg-cyan-400"
      />
    </div>
  );
}

function DataDust() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: string;
    top: string;
    delay: number;
    duration: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 40 }).map(() => ({
        id: Math.random(),
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        // 1. Reduced max delay from 5s to 0.5s so they spawn immediately
        delay: Math.random() * 0.5, 
        // 2. Reduced duration from 10-30s to 4-12s so the fade-in is much faster
        duration: 4 + Math.random() * 8, 
        opacity: 0.1 + Math.random() * 0.4,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          style={{ left: p.left, top: p.top }}
        />
      ))}
    </div>
  );
}

// ---- Page -------------------------------------------------------------------
export default function Page() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 320], [1, 0]);
  const heroY = useTransform(scrollY, [0, 320], [0, -140]);
  const heroScale = useTransform(scrollY, [0, 320], [1, 0.96]);
  const hintOpacity = useTransform(scrollY, [0, 120], [1, 0]);

  const timelineRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 60%"],
  });
  const spine = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.4,
  });

  return (
    <>
      <CanvasNCA />

      <main className="relative z-10 text-slate-200">
        {/* ---- Section 1: The Root ---- */}
        <DataDust />
        
        <section className="relative flex h-screen items-center justify-center px-6 overflow-hidden">
          
          {/* Step 3: HUD Framing */}
          <motion.div 
            style={{ opacity: heroOpacity }}
            className="pointer-events-none absolute inset-6 z-20 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-500/50 md:block"
          >
            <div className="absolute left-0 top-0 flex flex-col gap-1">
              <span>SYS.INIT // v2.0.26</span>
              <span>AUTH: C.J.</span>
            </div>
            <div className="absolute right-0 top-0 flex items-center gap-2 text-right">
              <span>STATUS: ONLINE</span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>
            <div className="absolute bottom-0 left-0">
              <span>LOC: 18.5204° N, 73.8567° E [PUNE]</span>
            </div>
            <div className="absolute bottom-0 right-0 text-right">
              <span className="animate-pulse">AWAITING_INPUT_</span>
            </div>
          </motion.div>

          {/* Radial Blueprint Grid & Data Dust */}
          <motion.div 
            style={{ opacity: heroOpacity }}
            className="pointer-events-none absolute inset-0 z-0"
          >
            
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(34, 211, 238, 0.07) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(34, 211, 238, 0.07) 1px, transparent 1px)
                `,
                backgroundSize: '32px 32px',
                maskImage: 'radial-gradient(circle at center, black 10%, transparent 60%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 60%)',
              }}
              aria-hidden
            />
          </motion.div>

          <motion.div
            style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
            className="relative z-10 text-center"
          >
            <h1 className="bg-gradient-to-r from-cyan-200 via-cyan-400 to-teal-500 bg-clip-text pb-2 text-5xl font-bold tracking-tight text-transparent sm:text-7xl md:text-8xl">
              Chelsi Jain
            </h1>
            <TypewriterSubtitle />
          </motion.div>

          {/* Enhanced "Neural Link" Scroll Indicator */}
          <motion.div
            style={{ opacity: hintOpacity }}
            className="absolute bottom-8 flex flex-col items-center gap-3"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/60">
              Scroll to connect
            </span>
            
            <div className="flex flex-col items-center">
              {/* Mouse Outline */}
              <div className="flex h-8 w-5 justify-center rounded-full border border-cyan-500/40 p-1">
                {/* Scrolling Wheel */}
                <motion.div
                  animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-1.5 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                />
              </div>
              {/* Downward Energy Line */}
              <motion.div
                animate={{ height: ["0rem", "3rem", "0rem"], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="mt-2 w-px bg-gradient-to-b from-cyan-400 to-transparent"
              />
            </div>
          </motion.div>
        </section>
        {/* ---- Section 2: The Neural Pathways ---- */}
        <section
          ref={timelineRef}
          className="relative mx-auto flex max-w-6xl flex-col gap-y-32 pb-[25vh] pt-[10vh] md:gap-y-40"
        >
          {/* Central spine tracing the screen center */}
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-cyan-900/20 md:block"
            aria-hidden
          >
            <motion.div
              style={{ scaleY: spine }}
              className="h-full w-full origin-top bg-gradient-to-b from-cyan-300 via-cyan-500 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.6)]"
            />
          </div>

          {NODES.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}

          {/* Step 1: Append the terminal contact node */}
          <ContactNode />
        </section>
      </main>
    </>
  );
}
