# KaspOS · Kaspa explained as a pretend computer

A Kaspa explainer you play with instead of read. It looks like a toy desktop
computer. The wallpaper is the real network, drawn live at about ten blocks a
second. Every icon is a small toy that explains one idea: block rhythm, trying to
cheat the ordering and getting caught, a payments race, robbing a rule-locked
savings jar, the coin supply as a piano, a "real or not?" game about what's
shipped versus promised, a pub quiz, a jargon dictionary and recent posts from
builders in plain English. There are hidden stickers and easter eggs too.

Not an official Kaspa site. No price talk. Every claim links to its source in
the Receipts app.

Preview: https://parker2017code.github.io/kaspa-explained-next/ (noindex while it's a preview)

## How it works

- Static files only, with no build step: `index.html`, `css/os.css`, `js/`, `data/`, `fonts/` (fonts are SIL OFL).
  - `js/live.js`: live numbers from `https://api.kaspa.org` (blue score, hashrate, reward, supply, next emission step, sample blocks).
    If the API can't be reached, the page says "simulated" and keeps drawing a 10-blocks-a-second rhythm.
  - `js/core.js`: shared helpers, stickers, sounds (off until you turn them on), the ticker.
  - `js/wm.js`: the window manager, start menu, desktop icons, Dag the helper, easter eggs, boot screen.
  - `js/wall.js`: the live block wallpaper.
  - `js/apps-a.js`, `js/apps-b.js`: the apps. `js/data.js`: shipped/testnet/proposal items with sources.
- `data/x-feed.json` holds the "Overheard" posts, refreshed with `scripts/refresh-x.py` (no X API keys).

## Refreshing the X feed

```sh
python3 scripts/refresh-x.py query            # prints the search to run
# run that search with a public, read-only X search tool; save the JSON list of posts as raw.json
python3 scripts/refresh-x.py ingest raw.json  # filters to scripts/x-sources.json handles -> data/x-candidates.json
# edit data/x-candidates.json: write a one-line "plain" summary and a "tag" for each post you want to keep; delete the rest
python3 scripts/refresh-x.py publish --push   # validates, merges the newest 16, stamps the time, commits and pushes
```

Allowed tags are listed in `scripts/refresh-x.py`. Posts without a `plain` line are dropped.

## Local preview

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

Add `?noboot` to skip the boot screen, or `#quiz` (any app id) to open an app directly.
