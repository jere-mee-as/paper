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
| Tap or drag along the dots at the bottom | Jump or scrub between Calendar, Home and Folders |
| Hold an app | It lifts and a menu springs out: open, remove from Home, move to folder, app info, uninstall |
| Hold the clock, or hold Settings on Now | Paper's settings |

Back always returns home. Unfolded, Calendar, Home and Folders show side by side.

## The two hidden folders

Neither is on any page. Swipe down and type the name.

- **`fun`** opens **Fun stuff**: 35 small toys in five groups (Decide, Fidget, Watch, Play, Odd). Coin, dice, oracle, bubble wrap, fidget spinner, doodle, lava lamp, Snake, 2048, Simon, a pet rock, and so on. Tap one to open it full screen; × or Back returns to the folder, Home leaves. Scores are kept. Typing a toy's name (`snake`) opens it directly.
- **`themes`** opens **Themes**. A theme is a color plus an optional pattern:
  - **Follow the sun** switches between Dawn, Day, Dusk and Night skies using sunrise and sunset for Reston.
  - **Sets** are ready-made pairs (Tablet, Blueprint, Arcade, Terrazzo, Night sky, Desert, Memphis, Graph paper, Picnic).
  - **Palettes**, **One color, all the way through** (light and dark of nine hues), **Loud**, and **Gradients**.
  - **Weather** (under Follow the sun), as on jere.ing: Clear, Rain or Storm, falling behind everything over any theme, with lightning in storms. **Real** follows Reston's actual weather (rain, snow, storms) and checks every 30 minutes. The rain pauses whenever Paper isn't on screen.
  - **SHELL**: SHELL's nine themes (Ember, Mono, Dusk, Moss, Ice, Blood, Gold, Rose, Void): the color at the top falling into black, a grey band at the bottom, grain. The **Scanlines** pattern adds SHELL's CRT lines.
  - **A color for each page**: Calendar, Home and Folders each get their own color, blending as you swipe (Neapolitan, Fruit, Pastel, Earth, Sea, Loud three, Night three, SHELL three, Candy).
  - **Fonts**: Paper, SHELL (JetBrains Mono), Serif, Editorial, Grotesk, Rounded, Typewriter, Terminal, System. They download the first time you pick one; without internet the phone's own font stands in.
  - **Patterns** go over any color, Soft or Bold: Tablet, Dots, Graph, Blueprint, Hatch, Ripples, Dunes, Stars, Terrazzo, Maze, Crosses, Confetti, Memphis, Stripes, Gingham.
  - **Surprise me** picks at random; **Back to Paper** undoes everything. Typing a color's name (`lapis`) applies it directly.

## Messages (on Now)

Tap a message to open it. Swipe it right to clear it.

## The player (on Now)

Shows the album art, the song, the artist and album, and which app is playing it. Drag along the bar to jump anywhere in the track. Tap the artwork to open the app.

## Folders

On the Folders page each folder shows the names of its first apps. Open one and the apps are icons, with their names underneath. Hold an icon for its menu; hold the folder's name to add apps, rename or delete it.

## Changing things

- **Home apps**: Settings → Edit home apps, or hold an app on Home. An app shown crossed out wasn't found on the phone: hold it and tap *Choose the app*.
- **Folders**: open a folder tile and tap **+ Add** to tick apps in or out. Hold a tile to rename or delete it. Drag an open folder down to close it. Settings → New folder adds one. Settings → Re-sort folders refills them from app names.
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
