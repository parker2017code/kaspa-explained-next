# Kaspa, played live

A Kaspa explainer you can play with. The network is drawn as a live musical
score: about ten blocks a second, each one linked to the blocks it saw. Then
come a set of toys. You can pile up blocks, try to cheat the ordering
(GHOSTDAG), race two kinds of coin bookkeeping, price an attack, lock a
savings jar with covenant rules, play the emission schedule on a keyboard,
read recent posts from people building it (in plain English) and check what
is live, on testnet or only on paper.

Not an official Kaspa site. There's no price talk. Every claim links to its source.

Preview: https://parker2017code.github.io/kaspa-explained-next/ (noindex while it's a preview)

## How it works

- Static files only: `index.html`, `css/`, `js/`, `data/`, `fonts/` (all fonts are SIL OFL).
- Live numbers come straight from the browser via `https://api.kaspa.org` (blue
  score, hashrate, block reward, coin supply, next emission step, sample blocks).
  When the API can't be reached, the page says so, draws a simulated 10 BPS rhythm and
  marks the live numbers "offline".
- `data/x-feed.json` holds the "Overheard" posts. It is refreshed by hand with
  `scripts/refresh-x.py` (no X API keys; the search runs through a read-only X connector).

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
