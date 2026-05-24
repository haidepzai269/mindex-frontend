"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  RefreshCw,
  Gauge,
  Video,
  Monitor,
  Printer,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideData {
	title: string;
	bullets: string[];
	narration: string;
	layout: "bullets" | "split" | "quote" | "highlight" | string;
	theme: "gradient-purple" | "gradient-ocean" | "gradient-sunset" | "dark" | string;
	audio_url: string;
	duration_seconds: number;
}

interface PresentationViewerProps {
  slides: SlideData[];
  docTitle: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function PresentationViewer({
  slides,
  docTitle,
  onRegenerate,
  isRegenerating = false,
}: PresentationViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<"slide" | "video">("slide"); // slide = manual, video = auto-play with audio

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentIdx];

  // 1. Initialize and handle audio play/pause
  useEffect(() => {
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentTime(0);
    setDuration(0);

    if (currentSlide?.audio_url) {
      const audio = new Audio(currentSlide.audio_url);
      audio.playbackRate = playbackSpeed;
      audio.muted = isMuted;
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration || currentSlide.duration_seconds || 5.0);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        // If in video mode, automatically advance to next slide
        if (mode === "video") {
          if (currentIdx < slides.length - 1) {
            setTimeout(() => {
              setCurrentIdx((prev) => prev + 1);
              setIsPlaying(true);
            }, 800); // Small pause between slides for natural feel
          } else {
            // End of presentation
            setIsPlaying(false);
            setMode("slide");
          }
        }
      });

      // Restart playing if was already playing or in video mode
      if (isPlaying || mode === "video") {
        audio.play().catch((err) => {
          console.log("Audio play error (auto-play blocked?):", err);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } else {
      // Slide has no audio (fallback)
      setDuration(currentSlide?.duration_seconds || 5.0);
      if (isPlaying && mode === "video") {
        // Auto advance timer for slides without audio
        const timer = setTimeout(() => {
          if (currentIdx < slides.length - 1) {
            setCurrentIdx((prev) => prev + 1);
          } else {
            setIsPlaying(false);
            setMode("slide");
          }
        }, (currentSlide?.duration_seconds || 5.0) * 1000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentIdx, currentSlide?.audio_url, mode]);

  // 2. Playback progress sync
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        } else {
          // Fallback progress tick for slides without audio
          setCurrentTime((prev) => {
            const next = prev + 0.1;
            if (next >= duration) {
              return duration;
            }
            return next;
          });
        }
      }, 100);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, duration]);

  // 3. Audio volume, mute and speed configurations
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 4. Listeners for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 5. Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, isPlaying, mode, duration]);

  // Controls
  const togglePlay = () => {
    if (!audioRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log("Audio play error:", err);
      });
    }
  };

  const handleNext = () => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleModeChange = (newMode: "slide" | "video") => {
    setMode(newMode);
    if (newMode === "video") {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to get Theme Styles
  const getThemeClass = (theme: string) => {
    switch (theme) {
      case "gradient-purple":
        return "bg-gradient-to-br from-[#160b29] via-[#0a0414] to-[#040108] text-rose-100 border-[#ff007f]/10 shadow-[0_0_50px_rgba(255,0,127,0.05)]";
      case "gradient-ocean":
        return "bg-gradient-to-br from-[#051b22] via-[#020c10] to-[#010406] text-cyan-100 border-cyan-500/10 shadow-[0_0_50px_rgba(6,182,212,0.05)]";
      case "gradient-sunset":
        return "bg-gradient-to-br from-[#240e13] via-[#100407] to-[#050102] text-amber-100 border-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.05)]";
      case "dark":
      default:
        return "bg-gradient-to-br from-[#121212] via-[#090909] to-[#020202] text-zinc-100 border-zinc-700/20 shadow-[0_0_50px_rgba(255,255,255,0.02)]";
    }
  };

  const getThemeAccentClass = (theme: string) => {
    switch (theme) {
      case "gradient-purple":
        return "text-[#ff007f] drop-shadow-[0_0_10px_rgba(255,0,127,0.3)]";
      case "gradient-ocean":
        return "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]";
      case "gradient-sunset":
        return "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]";
      case "dark":
      default:
        return "text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]";
    }
  };

  const getThemeProgressBar = (theme: string) => {
    switch (theme) {
      case "gradient-purple":
        return "bg-gradient-to-r from-purple-500 to-[#ff007f]";
      case "gradient-ocean":
        return "bg-gradient-to-r from-cyan-500 to-emerald-500";
      case "gradient-sunset":
        return "bg-gradient-to-r from-amber-500 to-rose-500";
      case "dark":
      default:
        return "bg-gradient-to-r from-purple-500 to-indigo-500";
    }
  };

  // Rendering Slide layouts
  const renderSlideContent = () => {
    const titleAccent = getThemeAccentClass(currentSlide.theme);

    // Stagger variables for bullet animations
    const containerVariants: any = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 },
      },
    };

    const itemVariants: any = {
      hidden: { opacity: 0, y: 15 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
    };

    switch (currentSlide.layout) {
      case "split":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
            <div className="space-y-4">
              <span className="text-[10px] tracking-[0.25em] font-black uppercase text-muted-foreground opacity-60">
                MINDEX NEURAL CORE • SLIDE {currentIdx + 1}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {currentSlide.title}
              </h2>
              <div className="w-16 h-1 rounded-full bg-gradient-to-r from-primary to-transparent" />
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-2xl space-y-4"
            >
              {currentSlide.bullets.map((bullet, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex items-start gap-3.5"
                >
                  <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary")} />
                  <p className="text-[14px] md:text-[16px] font-medium leading-relaxed text-foreground/90">
                    {bullet}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        );

      case "quote":
        return (
          <div className="flex flex-col items-center justify-center text-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-[10px] tracking-[0.25em] font-black uppercase text-muted-foreground opacity-60">
              MINDEX NEURAL CORE • SLIDE {currentIdx + 1}
            </span>
            <div className={cn("text-6xl md:text-7xl font-serif leading-none italic select-none", titleAccent)}>
              “
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-relaxed italic text-foreground px-4 md:px-12">
              {currentSlide.title}
            </h2>
            <div className="w-12 h-[2px] bg-white/10" />
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {currentSlide.bullets.map((bullet, idx) => (
                <motion.p
                  key={idx}
                  variants={itemVariants}
                  className="text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase"
                >
                  {bullet}
                </motion.p>
              ))}
            </motion.div>
          </div>
        );

      case "highlight":
        return (
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto space-y-6">
            <span className="text-[10px] tracking-[0.25em] font-black uppercase text-muted-foreground opacity-60">
              MINDEX NEURAL CORE • FEATURED HIGHLIGHT
            </span>
            <div className="space-y-3">
              <h2 className={cn("text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight", titleAccent)}>
                {currentSlide.title}
              </h2>
            </div>
            <div className="h-[1px] w-full bg-white/5" />
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {currentSlide.bullets.map((bullet, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="flex items-center gap-4 py-2 px-4 rounded-xl bg-white/[0.01] border border-white/[0.03]"
                >
                  <Sparkles size={16} className={cn("flex-shrink-0", titleAccent)} />
                  <p className="text-[15px] md:text-[18px] font-bold text-foreground">
                    {bullet}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        );

      case "bullets":
      default:
        return (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.25em] font-black uppercase text-muted-foreground opacity-60">
                MINDEX NEURAL CORE • SLIDE {currentIdx + 1}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {currentSlide.title}
              </h2>
              <div className="w-20 h-1 rounded-full bg-gradient-to-r from-primary to-transparent" />
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"
            >
              {currentSlide.bullets.map((bullet, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-5 rounded-2xl bg-white/[0.015] border border-white/5 hover:bg-white/[0.03] transition-colors flex items-start gap-4 shadow-sm"
                >
                  <div className="mt-1 w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary flex-shrink-0">
                    <BookOpen size={10} />
                  </div>
                  <p className="text-[14px] md:text-[15px] font-medium leading-relaxed text-foreground/90">
                    {bullet}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full grow min-h-0 space-y-4">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-2 print:hidden">
        <div>
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.25em]">
            Neural Presentation
          </span>
          <h1 className="text-md font-black tracking-tight text-foreground line-clamp-1">
            {docTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-card/40 border border-border p-0.5 rounded-xl flex items-center gap-1">
            <button
              onClick={() => handleModeChange("slide")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                mode === "slide"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor size={12} />
              Tự Đọc
            </button>
            <button
              onClick={() => handleModeChange("video")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                mode === "video"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Video size={12} />
              Video Thuyết Minh
            </button>
          </div>

          <button
            onClick={handlePrint}
            title="In / Xuất PDF"
            className="p-2 border border-border hover:border-zinc-500 rounded-xl bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <Printer size={15} />
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Tạo lại Slide"
              className={cn(
                "p-2 border border-border hover:border-zinc-500 rounded-xl bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground transition-all duration-300",
                isRegenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              <RotateCcw size={15} className={cn(isRegenerating && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Slide Main Container (16:9 Screen) */}
      <div
        ref={containerRef}
        className={cn(
          "relative grow w-full bg-black border border-border rounded-[2rem] overflow-hidden flex items-center justify-center aspect-[16/9] shadow-2xl group",
          isFullscreen && "rounded-none border-none h-screen w-screen"
        )}
      >
        {/* Dynamic mesh gradient background effect */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none mix-blend-screen overflow-hidden">
          <div className="absolute top-[-30%] left-[-30%] w-[80%] h-[80%] rounded-full bg-primary/40 blur-[120px] animate-[pulse_8s_infinite]" />
          <div className="absolute bottom-[-30%] right-[-30%] w-[80%] h-[80%] rounded-full bg-rose-500/30 blur-[120px] animate-[pulse_10s_infinite_1s]" />
        </div>

        {/* Content Viewer */}
        <div className="w-full h-full p-8 md:p-14 lg:p-20 relative flex flex-col justify-between select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={cn(
                "grow w-full h-full flex flex-col justify-center border border-white/5 p-8 rounded-[1.75rem] backdrop-blur-sm relative z-10 overflow-y-auto scrollbar-none",
                getThemeClass(currentSlide.theme)
              )}
            >
              {renderSlideContent()}
            </motion.div>
          </AnimatePresence>

          {/* Background Decorative border line inside */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] font-bold text-muted-foreground/40 pointer-events-none uppercase tracking-widest px-4">
            <span>Mindex AI</span>
            <span>{currentIdx + 1} / {slides.length}</span>
          </div>
        </div>

        {/* 3. Floating Interactive Controller Bar */}
        <div className={cn(
          "absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-[90%] max-w-2xl print:hidden",
          isFullscreen && "bottom-8 opacity-100"
        )}>
          {/* Play/Pause (only visible/functional if slide has narration/audio, or in video mode) */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 hover:bg-zinc-200 transition-all flex-shrink-0 shadow-lg"
          >
            {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} className="ml-0.5" fill="black" />}
          </button>

          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="p-2 border border-white/10 rounded-xl text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Progress Timeline */}
          <div className="grow flex flex-col gap-1.5 min-w-0">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative group/progress cursor-pointer">
              <div
                className={cn("h-full transition-all duration-100 rounded-full", getThemeProgressBar(currentSlide.theme))}
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400">
              <span className="tabular-nums">
                {Math.floor(currentTime / 60)}:
                {String(Math.floor(currentTime % 60)).padStart(2, "0")}
              </span>
              <span className="uppercase tracking-widest text-[8px] text-zinc-500 font-extrabold">
                {mode === "video" ? "Chế độ Video (Tự động)" : "Chế độ Slide"}
              </span>
              <span className="tabular-nums">
                {Math.floor(duration / 60)}:
                {String(Math.floor(duration % 60)).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            disabled={currentIdx === slides.length - 1}
            className="p-2 border border-white/10 rounded-xl text-white hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex-shrink-0"
          >
            <ChevronRight size={16} />
          </button>

          <div className="w-[1px] h-6 bg-white/10 flex-shrink-0" />

          {/* Advanced Audio Controls */}
          {currentSlide?.audio_url && (
            <div className="flex items-center gap-3.5 flex-shrink-0">
              {/* Playback speed selector */}
              <div className="relative group/speed">
                <button className="flex items-center gap-1 p-2 border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-xs font-black">
                  <Gauge size={13} />
                  <span>{playbackSpeed}x</span>
                </button>
                <div className="absolute bottom-full right-0 mb-2 bg-zinc-950 border border-white/10 p-1.5 rounded-xl hidden group-hover/speed:flex flex-col gap-1 shadow-2xl z-30">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-black rounded-lg text-left hover:bg-white/10 transition-colors w-16",
                        playbackSpeed === speed ? "text-primary bg-primary/10" : "text-zinc-400"
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Mute button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 4. Print / PDF Export Stylesheets (Hidden on Screen) */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-slide {
            page-break-after: always;
            width: 100vw;
            height: 56.25vw; /* 16:9 aspect ratio */
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            padding: 4rem !important;
            box-sizing: border-box !important;
            border: 1px solid #333 !important;
            border-radius: 1.5rem !important;
            background: #000 !important;
            color: #fff !important;
            margin-bottom: 2rem;
          }
        }
      `}</style>

      {/* Area used specifically for printing all slides */}
      <div id="print-area" className="hidden">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={cn(
              "print-slide relative flex flex-col justify-center",
              getThemeClass(slide.theme)
            )}
          >
            <div className="space-y-6">
              <span className="text-[10px] tracking-[0.25em] font-black text-muted-foreground/60 uppercase">
                Slide {idx + 1} • {docTitle}
              </span>
              <h2 className="text-4xl font-black tracking-tight">{slide.title}</h2>
              <div className="w-16 h-1 rounded-full bg-primary" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                {slide.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm font-medium leading-relaxed">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute bottom-6 right-6 text-xs text-muted-foreground/40 font-bold">
              Mindex AI Presentation
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
