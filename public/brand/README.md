# Brand assets

**`logo-accelerez.png` is the logo.** The header loads it directly — there is no
upload step and no setting to fill in.

It is 1920×1920 with generous padding around the mark, which is why the header
sizes it at 48–56px rather than the 36px a cropped wordmark would take: the
visible mark is a fraction of the box. Replacing it with a tightly cropped
version means reducing that height in
`accelerez-frontend/src/components/public/PublicLayout.tsx` — the one reference
to it in the codebase.

The `site.logo` setting still wins if it is filled, so a second site running on
this codebase can override the file without touching the repository. For this
one, the file is the source of truth.

Until the file exists the header shows the site's name set in type, which is a
placeholder that is obviously a placeholder.
