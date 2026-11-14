# How to use Paper

## Install (once)

1. On the phone, open **https://github.com/jere-mee-as/paper/releases/latest/download/paper.apk** and install it. Android will ask to allow installs from your browser.
2. Open Paper. Hold the clock to open **Settings**, then under **Access**:
   - **Home app**: makes Paper your home screen.
   - **Calendar**: lets the calendar page and Now read Google Calendar.
   - **Notifications**: lets Now show messages and music, and lets you reply from there. Android blocks this for sideloaded apps until you go to **Settings → Apps → Paper → ⋮ → Allow restricted settings**, then turn it on.
   - **Do Not Disturb**: lets the Silent button work.

## Getting around

| Do this on Home | You get |
|---|---|
| Swipe right | Calendar (next 7 days) |
| Swipe left | Folders |
| Swipe down | Search |
| Swipe down from the very top edge | The phone's own notifications |
| Swipe up | Now |
| Slide along the letters on the right edge | A card of that letter's apps follows your finger. Slide onto an app and let go to open it, or let go on the rail and tap one |
| Hold an app | Open, remove from Home, put in folders, app info, uninstall |
| Hold the clock, or hold Settings on Now | Paper's settings |

Back always returns home. Unfolded, Calendar, Home and Folders show side by side.

## Changing things

- **Home apps**: Settings → Edit home apps, or hold an app on Home. An app shown crossed out wasn't found on the phone: hold it and tap *Choose the app*.
- **Folders**: open a folder and tap **+ Add** to tick apps in or out. Hold a folder's name to rename, move up or delete it. Settings → New folder adds one. Settings → Re-sort folders refills them from app names.
- **Modes**: type `jere mode` or `plain mode` in search, or use Settings → Mode.

Everything you change is saved on the phone and survives updates.

## Updating

Settings → **Check for updates**.

- **Page updates** (almost every change: layout, looks, features) download `index.html` from GitHub and apply in a second, with no install. Paper also checks quietly every few hours and applies a new page the next time you go home. If a new page fails to start, Paper goes back to the one built into the app by itself. **Use the built-in page** in Settings does the same by hand.
- **App updates** (changes to the Android side) appear as **Install app x.y.z**. Paper downloads the newest release and Android asks you to confirm.

> The first builds are signed with a temporary key. Until a release key is set up (see below), an app update can fail with "signed with a different key": uninstall Paper once and install the new APK from the link above. Page updates are not affected.

## Publishing a new version (from GitHub)

- **Page only**: edit `src/`, run `python3 src/build.py`, push `index.html` to `main`. Phones pick it up on their next check.
- **App**: bump `versionName` (and `versionCode`) in `android/app/build.gradle.kts`, push, then **Actions → Release APK → Run workflow**. The release is tagged `v<versionName>` and the download link above always points at the newest one.
- **Release key** (so app updates install over each other): add the repository secret `PAPER_KEYSTORE_B64` (base64 of a PKCS12 keystore, password `paper-key`, alias `paper`), or set `PAPER_KEYSTORE_PASSWORD`, `PAPER_KEY_ALIAS` and `PAPER_KEY_PASSWORD` to your own.
