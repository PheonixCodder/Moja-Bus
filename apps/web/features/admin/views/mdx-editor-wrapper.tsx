"use client";

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  frontmatterPlugin,
  toolbarPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle,
  InsertCodeBlock,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { toast } from "sonner";

interface MdxEditorWrapperProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
}

export function MdxEditorWrapper({ markdown, onChange, readOnly = false }: MdxEditorWrapperProps) {
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
          imageUploadHandler: async () => {
            toast.error("Image upload not configured. Add an S3 endpoint to enable image uploads.");
            throw new Error("Image upload not configured");
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
