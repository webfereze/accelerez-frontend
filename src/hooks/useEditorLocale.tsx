import { createContext, useContext, useMemo, useState } from "react";
import { SOURCE_LOCALE, type Locale } from "@/types/content";

type EditorLocaleValue = {
  /** The language currently being edited across the whole form. */
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const EditorLocaleContext = createContext<EditorLocaleValue | null>(null);

/**
 * One editing language for a whole form.
 *
 * Per-field language tabs made it impossible to tell which language you were
 * writing in — every field carried its own tabs and the form read as a pile of
 * duplicated inputs. Instead the language is chosen once, at the top of the
 * editor, and every translatable field follows it.
 *
 * **It opens in Romanian**, because Romanian is this site's source language —
 * the one every record must have and the one a reader gets by default. It
 * defaulted to Hungarian, inherited from the project this CMS was lifted from,
 * so every editor screen opened on a translation: somebody adding a page typed
 * the title into the Hungarian field and saved a record with no Romanian in it
 * at all.
 */
export function EditorLocaleProvider({
  children,
  initial = SOURCE_LOCALE,
}: {
  children: React.ReactNode;
  initial?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initial);
  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return (
    <EditorLocaleContext.Provider value={value}>
      {children}
    </EditorLocaleContext.Provider>
  );
}

/**
 * Reads the current editing language. Falls back to its own state when used
 * outside a provider, so a field still works standalone.
 */
export function useEditorLocale(): EditorLocaleValue {
  const context = useContext(EditorLocaleContext);
  const [fallback, setFallback] = useState<Locale>(SOURCE_LOCALE);

  return context ?? { locale: fallback, setLocale: setFallback };
}
