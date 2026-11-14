# Paper

A calm Android home screen. Plain type on bone paper, no icons.

```
            Search (swipe down)
                    ↑
Calendar  ←      Home      →  Folders
(swipe right)       ↓       (swipe left)
               Now (swipe up)
```

- **Home**: your apps in two columns, People and Things, plus an A–Z rail on the right edge.
- **Calendar**: the next 7 days as one list, read from the phone's calendar (Google Calendar).
- **Folders**: Finance, Dating, Social, AI, Audio, Media, Work, Proton. Tap to open, hold to rename.
- **Search**: apps, folders and commands. Type `jere mode`, `plain mode`, `settings` or `update`.
- **Now**: what's next, what's playing, who's waiting on a reply, plus Silent, Torch, Timer and Camera.
- **Jere mode** is the curated setup. **Plain mode** is every app A–Z with folders by type.
- Unfolded on the Fold, Calendar, Home and Folders sit side by side.

## Install

Download on the phone: **https://github.com/jere-mee-as/paper/releases/latest/download/paper.apk**

See [HOW-TO-USE.md](HOW-TO-USE.md) for first-time setup and updating.

## Repo

| Path | What |
|---|---|
| `index.html` | The whole page. Built from `src/`. The APK ships it, and the phone downloads newer copies of it from `main`. |
| `src/` | `paper.css`, `body.html`, `paper.js`, `mock.js` (browser preview bridge), `arity.json`, `build.py`, `check.js` |
| `android/` | The Kotlin shell: a WebView, the `PaperNative` bridge, notifications, the updater |
| `.github/workflows/release.yml` | **Actions → Release APK → Run workflow** builds and publishes `paper.apk` |

Edit the page: change files in `src/`, run `python3 src/build.py`, commit `index.html`. Open `index.html` in a browser to preview on made-up data. `node src/check.js` runs every gesture against a strict fake bridge and saves screenshots to `/tmp/paper-shots`.

The repo has to stay public: the phone fetches `index.html` from `raw.githubusercontent.com` without signing in.

The Android shell is forked from [SHELL](https://github.com/jere-mee-as/shell) (package `ing.jere.paper`, bridge `window.PaperNative`, events to `PAPER.onNative`).
