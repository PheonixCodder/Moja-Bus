"use client";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  headingsPlugin,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useTranslations } from "next-intl";
import { useStorageUpload } from "@/lib/storage-client";

interface MdxEditorWrapperProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
  /** Post slug — used to scope uploaded images to the right S3 key prefix */
  postSlug?: string;
}

export function MdxEditorWrapper({
  markdown,
  onChange,
  readOnly = false,
  postSlug,
}: MdxEditorWrapperProps) {
  const t = useTranslations("adminDashboard.mdxEditorWrapper");
  const { upload } = useStorageUpload("blog-content", {
    slug: postSlug ?? "draft",
  });

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <MDXEditor
        markdown={markdown}
        onChange={onChange}
        readOnly={readOnly}
        contentEditableClassName="prose prose-sm prose-slate max-w-none p-6 min-h-[500px] outline-none focus:outline-none w-full"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "ts" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              ts: "TypeScript",
              js: "JavaScript",
              tsx: "TSX",
              jsx: "JSX",
              css: "CSS",
              html: "HTML",
              json: "JSON",
              bash: "Bash",
              sh: "Shell",
              sql: "SQL",
            },
          }),
          imagePlugin({
            imageUploadHandler: async (file: File) => {
              const result = await upload(file);
              return result.fileUrl;
            },
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-0.5 p-1.5">
                <UndoRedo />
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <BlockTypeSelect />
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <ListsToggle />
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertCodeBlock />
                <InsertThematicBreak />
              </div>
            ),
          }),
        ]}
      />
    </div>
  );
}
