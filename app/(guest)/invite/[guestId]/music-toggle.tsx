"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const TRACK_SRC =
  "/Kiss - I Was Made For Lovin' You_(play.muzfan.net).mp3";

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Failed to toggle audio playback", error);
    }
  };

  return (
    <div className="animate__bounceIn fixed right-4 top-4 z-20">
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        className={`rounded-full border border-zinc-200/60 bg-zinc-950/40 p-3 shadow-lg transition hover:border-zinc-100/80 hover:bg-zinc-900/70 ${
          isPlaying ? "" : "pulse-play"
        }`}
      >
        <Image
          src="/music-player-button.svg"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11"
        />
      </button>
      <audio ref={audioRef} src={encodeURI(TRACK_SRC)} loop />
    </div>
  );
}
