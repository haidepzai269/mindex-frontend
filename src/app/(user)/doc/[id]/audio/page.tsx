"use client";

import React, { useState, useEffect, useRef, use } from "react";
import {
  ArrowLeft,
  Loader2,
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Wand2,
  Settings2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import useSWR from "swr";
import { fetchApi, API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScriptLine {
  speaker: "A" | "B";
  text: string;
}

export default function AudioOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [isGenerating, setIsGenerating] = useState(false);
  const [audioData, setAudioData] = useState<{
    audio_url: string;
    script: ScriptLine[];
    status: string;
  } | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch doc metadata
  const { data: docData } = useSWR(
    id ? `/documents/${id}` : null,
    fetchApi
  ) as { data: any };
  const doc = docData?.data;

  // Fetch audio info
  const { data: fetchAudioResult, mutate: mutateAudio } = useSWR<any>(
    id ? `/study/docs/${id}/audio` : null,
    fetchApi
  );

  useEffect(() => {
    console.log("[AudioPage] fetchAudioResult changed:", fetchAudioResult);
    if (fetchAudioResult?.success && fetchAudioResult?.data) {
      console.log("[AudioPage] Setting audioData:", fetchAudioResult.data);
      setAudioData(fetchAudioResult.data);
    }
  }, [fetchAudioResult]);

  // Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    console.log("[AudioPage] Audio ref on effect:", audio);
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      calculateCurrentLine(audio.currentTime);
    };

    const updateDuration = () => {
      console.log("[AudioPage] Audio metadata loaded, duration:", audio.duration);
      setDuration(audio.duration);
    };

    const onEnded = () => {
      console.log("[AudioPage] Audio ended");
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentLineIndex(-1);
      audio.currentTime = 0;
    };

    const onPlay = () => console.log("[AudioPage] Audio playing event fired");
    const onPause = () => console.log("[AudioPage] Audio paused event fired");
    const onError = (e: any) => console.error("[AudioPage] Audio error event:", audio.error);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [audioData]);

  // Estimate line index based on length ratio
  const calculateCurrentLine = (time: number) => {
    if (
      !audioData?.script ||
      audioData.script.length === 0 ||
      !audioRef.current?.duration
    )
      return;

    const totalChars = audioData.script.reduce(
      (acc, curr) => acc + curr.text.length,
      0
    );
    const timePerChar = audioRef.current.duration / totalChars;

    let accumulatedTime = 0;
    for (let i = 0; i < audioData.script.length; i++) {
      const lineDuration = audioData.script[i].text.length * timePerChar;
      if (time >= accumulatedTime && time < accumulatedTime + lineDuration) {
        if (currentLineIndex !== i) {
          setCurrentLineIndex(i);
          const activeEl = document.getElementById(`transcript-line-${i}`);
          if (activeEl && scrollRef.current) {
            activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        break;
      }
      accumulatedTime += lineDuration;
    }
  };

  const togglePlay = () => {
    console.log("[AudioPage] togglePlay clicked. Current isPlaying:", isPlaying);
    if (!audioRef.current) {
      console.warn("[AudioPage] togglePlay: audioRef.current is null!");
      return;
    }

    if (isPlaying) {
      console.log("[AudioPage] Pausing audio...");
      audioRef.current.pause();
    } else {
      console.log("[AudioPage] Playing audio, src:", audioRef.current.src);
      audioRef.current.play().catch(err => {
        console.error("[AudioPage] Play failed:", err);
        toast.error("Không thể phát âm thanh. Vui lòng thử lại.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number | readonly number[]) => {
    if (!audioRef.current) return;
    const time = Array.isArray(value) ? value[0] : value;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number | readonly number[]) => {
    if (!audioRef.current) return;
    const vol = Array.isArray(value) ? value[0] : value;
    audioRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const changeSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = (await fetchApi(`/study/docs/${id}/audio/generate`, {
        method: "POST",
      })) as any;
      if (res.success) {
        if (res.data) {
          toast.success("Tạo Audio Overview thành công!");
          setAudioData(res.data);
        } else {
          toast.success("Đang tạo Audio Overview...");
          mutateAudio();
        }
      } else {
        toast.error(res.message || "Không thể tạo Audio Overview.");
      }
    } catch (err) {
      console.error("[AudioPage] handleGenerate error:", err);
      toast.error("Lỗi kết nối máy chủ AI hoặc TTS.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!doc)
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
      </div>
    );

  return (
    <div className="h-full bg-background text-foreground flex flex-col md:flex-row overflow-hidden font-sans border-t border-border/50">
      {/* Sidebar */}
      <div className="w-full md:w-80 h-auto md:h-full border-b md:border-b-0 md:border-r border-border/50 bg-card/80 flex flex-col shrink-0 animate-in slide-in-from-left duration-500 z-[60]">
        <div className="p-4 md:p-6 border-b border-border/50 flex items-center justify-between md:block md:space-y-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest font-bold"
          >
            <ArrowLeft size={14} /> <span className="md:inline">Thư viện</span>
          </button>
          <div className="text-right md:text-left flex-1 md:flex-none ml-4 md:ml-0">
            <div className="text-[8px] md:text-[10px] font-black text-primary mb-0.5 md:mb-1 tracking-tighter">
              AUDIO OVERVIEW
            </div>
            <h1 className="text-[11px] md:text-sm font-bold text-foreground truncate max-w-[150px] md:max-w-full ml-auto md:ml-0">
              {doc.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-col p-4 gap-4 flex-1">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <Headphones size={24} />
              <h3 className="font-black italic uppercase tracking-tighter">
                Audio Podcast
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nghe tóm tắt nội dung tài liệu này dưới dạng một buổi trò chuyện
              (podcast) chân thực, giúp bạn tiếp thu kiến thức nhanh chóng.
            </p>
          </div>

          {!audioData && (
            <div className="mt-auto">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tạo Audio Overview
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {audioData && audioData.audio_url ? (
          <>
            {/* Audio Player */}
            <div className="p-6 border-b border-border/50 bg-card/30">
              <audio
                ref={audioRef}
                src={audioData.audio_url}
                crossOrigin="anonymous"
                onTimeUpdate={() => {}}
                onLoadedMetadata={() => {}}
                onEnded={() => {}}
              />
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                  className="h-12 w-12 rounded-full"
                >
                  {isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} className="ml-1" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <SkipBack size={16} className="text-muted-foreground" />
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="flex-1"
                    />
                    <SkipForward size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </Button>
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={changeSpeed}>
                  {playbackRate}x
                </Button>
              </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
              <div className="max-w-3xl mx-auto space-y-4">
                {audioData.script &&
                  audioData.script.map((line, idx) => (
                    <div
                      key={idx}
                      id={`transcript-line-${idx}`}
                      className={cn(
                        "p-4 rounded-lg transition-all",
                        currentLineIndex === idx
                          ? "bg-primary/10 border border-primary/30 scale-[1.02]"
                          : "bg-card border border-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            line.speaker === "A"
                              ? "bg-pink-500 text-white"
                              : "bg-blue-500 text-white"
                          )}
                        >
                          {line.speaker === "A" ? "A" : "B"}
                        </div>
                        <p className="text-sm leading-relaxed pt-1">
                          {line.text}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        ) : audioData && audioData.status === "pending" ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Đang tạo Audio Overview... Vui lòng đợi.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Headphones
                size={64}
                className="mx-auto text-muted-foreground/30"
              />
              <p className="text-muted-foreground">
                Chưa có Audio Overview. Hãy tạo mới!
              </p>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tạo Audio Overview
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
