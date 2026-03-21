"use client";

import { createFileBlockConfig, fileParse } from "@blocknote/core";
import {
  AddFileButton,
  createReactBlockSpec,
  LinkWithCaption,
  useUploadLoading,
  type ReactCustomBlockRenderProps,
} from "@blocknote/react";
import type { ComponentProps } from "react";
import { Download, File } from "lucide-react";
import { RiFile2Line } from "react-icons/ri";

function createLobeFileBlockConfig() {
  const base = createFileBlockConfig();
  return {
    ...base,
    propSchema: {
      ...base.propSchema,
      fileSizeBytes: { default: undefined, type: "number" as const },
    },
  };
}

type LobeFileProps = ReactCustomBlockRenderProps<
  typeof createLobeFileBlockConfig
>;

type AddFileButtonProps = ComponentProps<typeof AddFileButton>;

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LobeFileRow(props: Omit<LobeFileProps, "contentRef">): React.ReactElement {
  const { name, url, fileSizeBytes } = props.block.props;
  const sizeLabel = formatBytes(fileSizeBytes);

  return (
    <div
      className="lobe-file-row bn-file-name-with-icon"
      contentEditable={false}
      draggable={false}
    >
      <div className="bn-file-icon">
        <File size={24} />
      </div>
      <div className="lobe-file-row__meta">
        <p className="bn-file-name">{name || "File"}</p>
        {sizeLabel ? (
          <p className="lobe-file-row__size">{sizeLabel}</p>
        ) : null}
      </div>
      {url ? (
        <a
          className="lobe-file-row__download"
          href={url}
          download={name || undefined}
          target="_blank"
          rel="noreferrer"
        >
          <Download size={16} />
          <span>Download</span>
        </a>
      ) : null}
    </div>
  );
}

function LobeFileToExternalHTML(
  props: Omit<LobeFileProps, "contentRef">
): React.ReactElement {
  if (!props.block.props.url) {
    return <p>Add file</p>;
  }

  const link = (
    <a href={props.block.props.url}>
      {props.block.props.name || props.block.props.url}
    </a>
  );

  if (props.block.props.caption) {
    return (
      <LinkWithCaption caption={props.block.props.caption}>
        {link}
      </LinkWithCaption>
    );
  }

  return link;
}

function LobeFileBlock(props: LobeFileProps): React.ReactElement {
  const showLoader = useUploadLoading(props.block.id);

  return (
    <div className="bn-file-block-content-wrapper">
      {showLoader ? (
        <div className="bn-file-loading-preview">Loading...</div>
      ) : props.block.props.url === "" ? (
        <AddFileButton
          {...(props as unknown as AddFileButtonProps)}
          buttonIcon={<RiFile2Line size={24} />}
        />
      ) : (
        <>
          <LobeFileRow
            {...(props as unknown as Omit<LobeFileProps, "contentRef">)}
          />
          {props.block.props.caption ? (
            <p className="bn-file-caption">{props.block.props.caption}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export const lobeExtendedFileBlock = createReactBlockSpec(
  createLobeFileBlockConfig,
  () => ({
    render: LobeFileBlock,
    parse: fileParse(),
    toExternalHTML: LobeFileToExternalHTML,
    meta: {
      fileBlockAccept: ["*/*"],
    },
  })
);
