import { useState } from "react";
import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import { EyeIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import { BLOCK_DEFINITIONS } from "@/blocks/registry";
import { isFullBleed } from "@/blocks/types";
import { translations } from "@/utils/i18n";

/**
 * *Biblioteca de blocuri* — every block an editor can put on a page, rendered
 * with sample content.
 *
 * **It renders the real renderer, not a screenshot.** A picture of a block goes
 * stale the first time somebody changes it, and the whole point of this screen
 * is that an editor can trust what they are looking at. Each preview is the same
 * component the public site uses, given the `sample()` data from the registry.
 *
 * Built from `BLOCK_DEFINITIONS` rather than a list kept here, so a new block
 * type appears on this page the moment it is registered — which is the only way
 * a documentation screen stays true.
 *
 * The previews are rendered inside a **light card on the admin's own ground**,
 * so the screen still reads as the admin. A block that paints its own dark band
 * brings it with it, which is correct: that is what it will do on the site.
 */
export default function AdminBlocks() {
  const { t } = useTranslation("common");
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();

  const shown = BLOCK_DEFINITIONS.filter((definition) => {
    if (!term) return true;
    const name = t(`blocks.${definition.key}.name`).toLowerCase();
    const description = t(`blocks.${definition.key}.description`).toLowerCase();
    return (
      name.includes(term) ||
      description.includes(term) ||
      definition.type.toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={Squares2X2Icon}
        title={t("blocks.library.title")}
        description={t("blocks.library.description")}
      />

      <div className="mb-4 sm:max-w-sm">
        <Input
          srOnlyLabel
          type="search"
          label={t("blocks.library.search")}
          placeholder={t("blocks.library.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {shown.length === 0 ? (
        <p role="status" className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          {t("common.noResults")}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((definition) => {
            const { Renderer, Preview, icon: Icon } = definition;
            // A block whose content is resolved server-side supplies its own
            // preview wrapper; everything else previews with its renderer.
            const Body = Preview ?? Renderer;

            return (
              <li
                key={definition.type}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <div className="flex flex-wrap items-start gap-3 border-b border-gray-100 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                    <Icon className="h-5 w-5 text-primary-700" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {t(`blocks.${definition.key}.name`)}
                      </h2>
                      {/* The one property an editor has to know before
                          choosing: whether it will break the page gutter. */}
                      {isFullBleed(definition.type) && (
                        <Badge tone="brand">{t("blocks.library.fullBleed")}</Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {t(`blocks.${definition.key}.description`)}
                    </p>

                    <code className="mt-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600">
                      {definition.type}
                    </code>
                  </div>
                </div>

                <CollapsiblePanel
                  icon={EyeIcon}
                  title={t("blocks.library.preview")}
                  defaultOpen
                >
                  {/* The site's own type and colours apply inside here, which is
                      the point — this is what the visitor will see. */}
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-sand-50">
                    <Body data={definition.sample(t)} locale="ro" />
                  </div>
                </CollapsiblePanel>
              </li>
            );
          })}
        </ul>
      )}
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
