import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

/**
 * The rich-text editor itself — one Quill, one toolbar, one set of allowed
 * formats, for every screen in the admin that edits HTML.
 *
 * `RichTextField` edits one language of a `Translated` value and wraps this in
 * a preview card and a modal; a campaign body is a plain string and uses it
 * directly. Both get the same toolbar, which is the point: two editors with
 * different buttons produce two kinds of HTML on one site.
 *
 * NOTE: **`react-quill-new`**, not `react-quill`. The original is unmaintained and
 * project is on React 19, where `ReactDOM.findDOMNode` was removed —
 * `react-quill@2` calls it and crashes. `react-quill-new` is the maintained
 * drop-in fork.
 */
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-gray-100" />,
});

export const QUILL_MODULES = {
  history: { delay: 400, maxStack: 200, userOnly: true },
  toolbar: [
    // Only h2/h3 — the page title is the h1, and skipping heading levels breaks
    // the hierarchy Lighthouse and screen readers depend on.
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

/** Formats allowed through — anything else is stripped, including on paste. */
export const QUILL_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "blockquote",
  "link",
];

/** Treats "<p><br></p>", whitespace and empty tags as no content. */
export const isEmptyHtml = (html?: string | null) =>
  !html ||
  !html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

/**
 * The chrome around Quill — sticky toolbar, scrolling body, admin borders.
 * Exported because `RichTextField` puts the editor in a modal and needs the
 * same treatment there.
 */
export const EDITOR_CHROME = `
  [&_.ql-container.ql-snow]:overflow-y-auto
  [&_.ql-container.ql-snow]:rounded-b-lg [&_.ql-container.ql-snow]:border-gray-300
  [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base
  [&_.ql-toolbar.ql-snow]:sticky [&_.ql-toolbar.ql-snow]:top-0 [&_.ql-toolbar.ql-snow]:z-10
  [&_.ql-toolbar.ql-snow]:rounded-t-lg [&_.ql-toolbar.ql-snow]:border-gray-300
  [&_.ql-toolbar.ql-snow]:bg-gray-50
`;

export default function HtmlEditor({
  value,
  onChange,
  /** Remount key — pass the language when editing a `Translated` value, so
      Quill picks up the new text instead of keeping the previous document. */
  editorKey,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  editorKey?: string;
  className?: string;
}) {
  return (
    <div className={`${EDITOR_CHROME} ${className ?? ""}`}>
      <ReactQuill
        key={editorKey}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={QUILL_MODULES}
        formats={QUILL_FORMATS}
        className="bg-white"
      />
    </div>
  );
}
