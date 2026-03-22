import {
  BlockNoteSchema,
  createCodeBlockSpec,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
} from "@blocknote/core";
import { withMultiColumn } from "@blocknote/xl-multi-column";

import { lobeBookmarkBlock } from "@/components/editor/blocks/LobeBookmarkBlock";
import { lobeBreadcrumbBlock } from "@/components/editor/blocks/LobeBreadcrumbBlock";
import { lobeButtonBlock } from "@/components/editor/blocks/LobeButtonBlock";
import { lobeCalloutBlock } from "@/components/editor/blocks/LobeCalloutBlock";
import { lobeEmbedBlock } from "@/components/editor/blocks/LobeEmbedBlock";
import { lobeExtendedAudioBlock } from "@/components/editor/blocks/LobeExtendedAudio";
import { lobeExtendedFileBlock } from "@/components/editor/blocks/LobeExtendedFile";
import { lobeExtendedImageBlock } from "@/components/editor/blocks/LobeExtendedImage";
import { lobeExtendedVideoBlock } from "@/components/editor/blocks/LobeExtendedVideo";
import { lobeMathBlock } from "@/components/editor/blocks/LobeMathBlock";
import { lobePagePreviewSectionBlock } from "@/components/editor/blocks/LobeArticlePreviewSectionBlock";
import { lobeSimpleTableBlock } from "@/components/editor/blocks/LobeSimpleTableBlock";
import { lobeSyncedBlock } from "@/components/editor/blocks/LobeSyncedBlock";
import { lobeTocBlock } from "@/components/editor/blocks/LobeTocBlock";
import { lobeTodoSectionBlock } from "@/components/editor/blocks/LobeTodoSectionBlock";
import { lobeMathInline } from "@/components/editor/inlines/LobeMathInline";
import { lobeMentionInline } from "@/components/editor/inlines/LobeMentionInline";
import { lobePageLinkInline } from "@/components/editor/inlines/LobeArticleLinkInline";
import {
  LOBE_SUPPORTED_LANGUAGES,
  createLobeCodeHighlighter,
} from "@/lib/editor/create-lobe-code-highlighter";

const {
  image: _defaultImage,
  video: _defaultVideo,
  audio: _defaultAudio,
  file: _defaultFile,
  ...lobeDefaultBlockSpecs
} = defaultBlockSpecs;

void _defaultImage;
void _defaultVideo;
void _defaultAudio;
void _defaultFile;

const lobeBlockNoteSchemaBase = BlockNoteSchema.create({
  blockSpecs: {
    ...lobeDefaultBlockSpecs,
    image: lobeExtendedImageBlock(),
    video: lobeExtendedVideoBlock(),
    audio: lobeExtendedAudioBlock(),
    file: lobeExtendedFileBlock(),
    heading: createHeadingBlockSpec({
      levels: [1, 2, 3],
      allowToggleHeadings: true,
    }),
    codeBlock: createCodeBlockSpec({
      defaultLanguage: "text",
      supportedLanguages: LOBE_SUPPORTED_LANGUAGES,
      createHighlighter: createLobeCodeHighlighter,
    }),
    callout: lobeCalloutBlock(),
    todoSection: lobeTodoSectionBlock(),
    bookmark: lobeBookmarkBlock(),
    lobeEmbed: lobeEmbedBlock(),
    simpleTable: lobeSimpleTableBlock(),
    mathBlock: lobeMathBlock(),
    lobeButton: lobeButtonBlock(),
    pagePreviewSection: lobePagePreviewSectionBlock(),
    breadcrumb: lobeBreadcrumbBlock(),
    tableOfContents: lobeTocBlock(),
    lobeSynced: lobeSyncedBlock(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: lobeMentionInline,
    pageLink: lobePageLinkInline,
    mathInline: lobeMathInline,
  },
  styleSpecs: defaultStyleSpecs,
});

export const lobeBlockNoteSchema = withMultiColumn(lobeBlockNoteSchemaBase);
