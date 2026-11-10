import { isVimeoPlayer } from "../services/videoSource";
import React from "react";
export function RecordingPlayer({ src, title = "Grabación", ...props }) {
  if (isVimeoPlayer(src)) return <iframe key={src} src={src} title={title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen className="block aspect-video w-full rounded-xl border-0 bg-slate-950" />;
  return <video src={src} {...props} />;
}
