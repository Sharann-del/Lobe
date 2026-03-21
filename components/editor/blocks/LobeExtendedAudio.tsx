"use client";

import { createAudioBlockConfig, audioParse, type AudioOptions } from "@blocknote/core";
import {
  createReactBlockSpec,
  FigureWithCaption,
  LinkWithCaption,
  ResizableFileBlockWrapper,
  useResolveUrl,
  type ReactCustomBlockRenderProps,
} from "@blocknote/react";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { RiVolumeUpFill } from "react-icons/ri";

type ResizableFileProps = ComponentProps<typeof ResizableFileBlockWrapper>;

function createLobeAudioBlockConfig(options: AudioOptions = {}) {
  return createAudioBlockConfig(options);
}

type LobeAudioProps = ReactCustomBlockRenderProps<
  typeof createLobeAudioBlockConfig
>;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LobeAudioPlayer(
  props: Omit<LobeAudioProps, "contentRef">
): React.ReactElement {
  const resolved = useResolveUrl(props.block.props.url!);
  const src =
    resolved.loadingState === "loading"
      ? props.block.props.url
      : resolved.downloadUrl;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const onTimeUpdate = useCallback((): void => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    setCurrent(el.currentTime);
    setDuration(el.duration || 0);
  }, []);

  const onPlayPause = useCallback((): void => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    const v = Number(e.target.value);
    el.currentTime = v;
    setCurrent(v);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) {
      return;
    }
    const onPlay = (): void => setPlaying(true);
    const onPause = (): void => setPlaying(false);
    const onLoaded = (): void => {
      setDuration(el.duration || 0);
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("loadedmetadata", onLoaded);
    return (): void => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [src]);

  return (
    <div className="lobe-audio-player" contentEditable={false}>
      <audio ref={audioRef} src={src} preload="metadata" onTimeUpdate={onTimeUpdate} />
      <button
        type="button"
        className="lobe-audio-player__play"
        onClick={onPlayPause}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <input
        type="range"
        className="lobe-audio-player__progress"
        min={0}
        max={duration || 0}
        step={0.01}
        value={Math.min(current, duration || 0)}
        onChange={onSeek}
        aria-label="Seek"
      />
      <span className="lobe-audio-player__time">
        {formatTime(current)} / {formatTime(duration)}
      </span>
    </div>
  );
}

function LobeAudioToExternalHTML(
  props: Omit<LobeAudioProps, "contentRef">
): React.ReactElement {
  if (!props.block.props.url) {
    return <p>Add audio</p>;
  }

  const audio = <audio src={props.block.props.url} controls />;

  if (props.block.props.caption) {
    return props.block.props.showPreview ? (
      <FigureWithCaption caption={props.block.props.caption}>
        {audio}
      </FigureWithCaption>
    ) : (
      <LinkWithCaption caption={props.block.props.caption}>
        {audio}
      </LinkWithCaption>
    );
  }

  return audio;
}

function LobeAudioBlock(props: LobeAudioProps): React.ReactElement {
  const rf = props as unknown as ResizableFileProps;
  return (
    <ResizableFileBlockWrapper
      {...rf}
      buttonIcon={<RiVolumeUpFill size={24} />}
    >
      <LobeAudioPlayer
        {...(props as unknown as Omit<LobeAudioProps, "contentRef">)}
      />
    </ResizableFileBlockWrapper>
  );
}

export const lobeExtendedAudioBlock = createReactBlockSpec(
  createLobeAudioBlockConfig,
  (config) => ({
    render: LobeAudioBlock,
    parse: audioParse(config),
    toExternalHTML: LobeAudioToExternalHTML,
    meta: {
      fileBlockAccept: ["audio/*"],
    },
  })
);
