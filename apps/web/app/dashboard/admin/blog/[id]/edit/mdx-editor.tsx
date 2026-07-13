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
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

interface MDXEditorComponentProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export function MDXEditorComponent({ markdown, onChange }: MDXEditorComponentProps) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      contentEditableClassName="prose prose-sm prose-rose max-w-none p-6 min-h-[500px] outline-none"
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
        imagePlugin({
          imageUploadHandler: async (file) => {
            // Note: Replace with actual presigned URL / S3 upload logic
            // For now, this just yields a base64 string or error
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
          }
        }),
        toolbarPlugin({
          toolbarContents: () => (
            <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b">
              <UndoRedo />
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <BoldItalicUnderlineToggles />
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <BlockTypeSelect />
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <ListsToggle />
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <InsertThematicBreak />
            </div>
          ),
        }),
      ]}
    />
  );
}
