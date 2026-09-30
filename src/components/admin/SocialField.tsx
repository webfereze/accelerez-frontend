import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import SocialIcon, { SOCIAL_LABELS, SOCIAL_NETWORKS } from "@/components/public/SocialIcons";
import type { SocialProfile } from "@/types/content";

/**
 * The association's social profiles, edited as an ordered list.
 *
 * **The network is a picker, not a text field.** The site draws a brand mark
 * for each one, and a typed "Facebook" / "facebook" / "FB" would render three
 * different things — or nothing. The order here is the order they appear in the
 * header panel, the footer and the contact panel, so it is reorderable.
 *
 * A network already used is removed from the other rows' options: two Instagram
 * entries is a mistake every time, and preventing it is cheaper than explaining
 * it.
 *
 * The icon is shown beside each row so an editor can see they picked the right
 * one without saving and going to look.
 */
export default function SocialField({
  value,
  onChange,
}: {
  value: SocialProfile[];
  onChange: (next: SocialProfile[]) => void;
}) {
  const { t } = useTranslation("common");
  const rows = value ?? [];

  const used = new Set(rows.map((row) => row.network));
  const free = SOCIAL_NETWORKS.filter((network) => !used.has(network));

  const set = (index: number, changes: Partial<SocialProfile>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          {t("settings.socialEmpty")}
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={`${row.network}-${index}`}
          className="grid gap-3 sm:grid-cols-[2.75rem_11rem_minmax(0,1fr)_auto] sm:items-end"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <SocialIcon network={row.network} className="h-5 w-5" />
          </span>

          <Select
            label={t("settings.socialNetwork")}
            value={row.network}
            onChange={(event) => set(index, { network: event.target.value })}
          >
            {/* The row's own network stays listed even though it is "used", or
                the select would have no value to show. */}
            {[row.network, ...free]
              .filter((network, i, all) => all.indexOf(network) === i)
              .map((network) => (
                <option key={network} value={network}>
                  {SOCIAL_LABELS[network as keyof typeof SOCIAL_LABELS] ?? network}
                </option>
              ))}
          </Select>

          <Input
            label={t("settings.socialUrl")}
            type="url"
            placeholder="https://"
            value={row.url}
            onChange={(event) => set(index, { url: event.target.value })}
          />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              aria-label={t("menu.moveUp")}
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUpIcon className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              aria-label={t("menu.moveDown")}
              disabled={index === rows.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDownIcon className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              aria-label={t("common.remove")}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ))}

      {free.length > 0 && (
        <div>
          <Button
            variant="secondary"
            onClick={() => onChange([...rows, { network: free[0], url: "" }])}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {t("settings.socialAdd")}
          </Button>
        </div>
      )}
    </div>
  );
}
