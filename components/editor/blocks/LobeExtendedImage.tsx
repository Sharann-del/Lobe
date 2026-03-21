"use client";

import {
  createImageBlockConfig,
  imageParse,
  type ImageOptions,
} from "@blocknote/core";
import {
  createReactBlockSpec,
  FigureWithCaption,
  LinkWithCaption,
  ResizableFileBlockWrapper,
  useResolveUrl,
  type ReactCustomBlockRenderProps,
} from "@blocknote/react";
import type { ComponentProps } from "react";
import { RiImage2Fill } from "react-icons/ri";

type ResizableFileProps = ComponentProps<typeof ResizableFileBlockWrapper>;

function createLobeImageBlockConfig(options: ImageOptions = {}) {
  const base = createImageBlockConfig(options);
  return {
    ...base,
    propSchema: {
      ...base.propSchema,
      alt: { default: "" as const },
    },
  };
}

type LobeImageProps = ReactCustomBlockRenderProps<
  typeof createLobeImageBlockConfig
>;

function LobeImagePreview(props: Omit<LobeImageProps, "contentRef">): React.ReactElement {
  const resolved = useResolveUrl(props.block.props.url!);
  const alt =
    props.block.props.alt ||
    props.block.props.name ||
    props.block.props.caption ||
    "";

  return (
    <img
      className="bn-visual-media"
      src={
        resolved.loadingState === "loading"
          ? props.block.props.url
          : resolved.downloadUrl
      }
      alt={alt}
      contentEditable={false}
      draggable={false}
    />
  );
}

function LobeImageToExternalHTML(
  props: Omit<LobeImageProps, "contentRef">
): React.ReactElement {
  if (!props.block.props.url) {
    return <p>Add image</p>;
  }

  const alt =
    props.block.props.alt ||
    props.block.props.name ||
    props.block.props.caption ||
    "Image";

  const image = props.block.props.showPreview ? (
    <img
      src={props.block.props.url}
      alt={alt}
      width={props.block.props.previewWidth}
    />
  ) : (
    <a href={props.block.props.url}>
      {props.block.props.name || props.block.props.url}
    </a>
  );

  if (props.block.props.caption) {
    return props.block.props.showPreview ? (
      <FigureWithCaption caption={props.block.props.caption}>
        {image}
      </FigureWithCaption>
    ) : (
      <LinkWithCaption caption={props.block.props.caption}>
        {image}
      </LinkWithCaption>
    );
  }

  return image;
}

function LobeImageBlock(props: LobeImageProps): React.ReactElement {
  const rf = props as unknown as ResizableFileProps;
  return (
    <ResizableFileBlockWrapper
      {...rf}
      buttonIcon={<RiImage2Fill size={24} />}
    >
      <div>
        <LobeImagePreview
          {...(props as unknown as Omit<LobeImageProps, "contentRef">)}
        />
        {props.editor.isEditable ? (
          <div
            className="lobe-image-alt-row"
            contentEditable={false}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="lobe-image-alt-label">Alt text</span>
            <input
              className="lobe-image-alt-input"
              type="text"
              value={props.block.props.alt ?? ""}
              placeholder="Describe for screen readers"
              aria-label="Image alt text"
              onChange={(e) => {
                props.editor.updateBlock(props.block, {
                  props: { alt: e.target.value },
                });
              }}
            />
          </div>
        ) : null}
      </div>
    </ResizableFileBlockWrapper>
  );
}

export const lobeExtendedImageBlock = createReactBlockSpec(
  createLobeImageBlockConfig,
  (config) => ({
    render: LobeImageBlock,
    parse: imageParse(config),
    toExternalHTML: LobeImageToExternalHTML,
    meta: {
      fileBlockAccept: ["image/*"],
    },
  })
);
