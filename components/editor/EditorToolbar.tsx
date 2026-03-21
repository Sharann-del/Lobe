"use client";

import {
  AddCommentButton,
  BasicTextStyleButton,
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileDeleteButton,
  FileDownloadButton,
  FilePreviewButton,
  FileReplaceButton,
  FormattingToolbar,
  FormattingToolbarController,
  TextAlignButton,
} from "@blocknote/react";

import { cn } from "@/lib/utils";

export interface EditorToolbarProps {
  className?: string;
}

/**
 * Floating formatting toolbar on text selection (Bold → Comment).
 */
export function EditorToolbar({ className }: EditorToolbarProps) {
  return (
    <FormattingToolbarController
      floatingUIOptions={{
        elementProps: { className: cn("lobe-formatting-toolbar-root", className) },
      }}
      formattingToolbar={() => (
        <FormattingToolbar>
          <BasicTextStyleButton basicTextStyle="bold" />
          <BasicTextStyleButton basicTextStyle="italic" />
          <BasicTextStyleButton basicTextStyle="underline" />
          <BasicTextStyleButton basicTextStyle="strike" />
          <BasicTextStyleButton basicTextStyle="code" />
          <CreateLinkButton />
          <ColorStyleButton />
          <TextAlignButton textAlignment="left" />
          <TextAlignButton textAlignment="center" />
          <TextAlignButton textAlignment="right" />
          <TextAlignButton textAlignment="justify" />
          <FileCaptionButton />
          <FileReplaceButton />
          <FilePreviewButton />
          <FileDownloadButton />
          <FileDeleteButton />
          <AddCommentButton />
        </FormattingToolbar>
      )}
    />
  );
}
