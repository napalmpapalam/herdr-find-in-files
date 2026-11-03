# herdr-find-in-files

A Herdr mod in `mods/find-in-files/`, in plain JavaScript: Herdr loads only
JS mods. The `dd:ts:*` conventions apply where JS has the feature (no types,
no zod; `Object.freeze` objects stand in for enums; `main.js` keeps the
default export that Herdr needs). Herdr's API is in
`~/.config/herdr-app/AGENTS.md`, `herdr.d.ts` and `gpui-kit.d.ts`.

## Checks

- `bun fmt --check`, `bun lint`, `bun test` (config in `bunfig.toml`; the
  format keeps the Herdr house style of double quotes and semicolons). The
  tests sit next to the modules they test, which do not import Herdr.
- `scripts/install.sh` copies the mod into Herdr and runs `herdr-app check`.
  It leaves out the tests. Never symlink the mod: Herdr does not reload a
  linked folder.

## Releasing

The version is the `version` field in `mods/find-in-files/mod.json`. Each
release is an annotated tag `v<version>` on `main` that points at the commit
that set that field.

For every change a user would notice (behaviour, keys, commands), in the same
commit:

1. Bump `version` in `mods/find-in-files/mod.json`. Patch for fixes, minor
   for new behaviour.
2. Update the Versions section of `README.md` with the Herdr version it was
   tested on (`herdr-app --version`).
3. Run `scripts/install.sh` and try the mod in the app.

After it lands on `main`:

```
git tag -a v<version> -m "find-in-files <version>"
git push origin main v<version>
```

## Commits

Never add Co-Authored-By trailers or "Generated with" lines to commits.
