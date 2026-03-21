"use client";

import { createVideoBlockConfig, videoParse, type VideoOptions } from "@blocknote/core";
import {
  createReactBlockSpec,
  FigureWithCaption,
  LinkWithCaption,
  ResizableFileBlockWrapper,
  useResolveUrl,
  type ReactCustomBlockRenderProps,
} from "@blocknote/react";
import type { ComponentProps } from "react";
import { RiVideoFill } from "react-icons/ri";

type ResizableFileProps = ComponentProps<typeof ResizableFileBlockWrapper>;

import { resolveVideoIframeFromPageUrl } from "@/lib/editor/embed-platforms";

function createLobeVideoBlockConfig(options: VideoOptions = {}) {
  return createVideoBlockConfig(options);
}

type LobeVideoProps = ReactCustomBlockRenderProps<
  typeof createLobeVideoBlockConfig
>;

function LobeVideoFilePreview(
  props: Omit<LobeVideoProps, "contentRef">
): React.ReactElement {
  const url = props.block.props.url ?? "";
  const resolved = useResolveUrl(url);
  const src =
    resolved.loadingState === "loading" ? url : resolved.downloadUrl;

  return (
    <video
      className="bn-visual-media"
      src={src}
      controls
      contentEditable={false}
      draggable={false}
    />
  );
}

function LobeVideoPreview(props: Omit<LobeVideoProps, "contentRef">): React.ReactElement {
  const url = props.block.props.url ?? "";
  const iframeSrc = resolveVideoIframeFromPageUrl(url);

  if (iframeSrc) {
    return (
      <iframe
        className="bn-visual-media lobe-video-embed"
        src={iframeSrc}
        title="Embedded video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        contentEditable={false}
      />
    );
  }

  return <LobeVideoFilePreview {...props} />;
}

function LobeVideoToExternalHTML(
  props: Omit<LobeVideoProps, "contentRef">
): React.ReactElement {
  if (!props.block.props.url) {
    return <p>Add video</p>;
  }

  const iframeSrc = resolveVideoIframeFromPageUrl(props.block.props.url);
  const video = iframeSrc ? (
    <iframe
      src={iframeSrc}
      title="Embedded video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  ) : props.block.props.showPreview ? (
    <video src={props.block.props.url} controls />
  ) : (
    <a href={props.block.props.url}>
      {props.block.props.name || props.block.props.url}
    </a>
  );

  if (props.block.props.caption) {
    return props.block.props.showPreview || iframeSrc ? (
      <FigureWithCaption caption={props.block.props.caption}>
        {video}
      </FigureWithCaption>
    ) : (
      <LinkWithCaption caption={props.block.props.caption}>
        {video}
      </LinkWithCaption>
    );
  }

  return video;
}

function LobeVideoBlock(props: LobeVideoProps): React.ReactElement {
  const rf = props as unknown as ResizableFileProps;
  return (
    <ResizableFileBlockWrapper
      {...rf}
      buttonIcon={<RiVideoFill size={24} />}
    >
      <LobeVideoPreview
        {...(props as unknown as Omit<LobeVideoProps, "contentRef">)}
      />
    </ResizableFileBlockWrapper>
  );
}

export const lobeExtendedVideoBlock = createReactBlockSpec(
  createLobeVideoBlockConfig,
  (config) => ({
    render: LobeVideoBlock,
    parse: videoParse(config),
    toExternalHTML: LobeVideoToExternalHTML,
    meta: {
      fileBlockAccept: ["video/*"],
    },
  })
);
