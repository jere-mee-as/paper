# Paper (Android app)

Package `ing.jere.paper`, label Paper. A thin Kotlin shell: one WebView running the repo's `index.html`
(copied into the APK's assets at build time) plus `window.PaperNative` for the phone. Forked from the
SHELL launcher's shell (jere-mee-as/shell) on 2026-11-13; it shares nothing with it at runtime.

| | |
|---|---|
| Version | 0.1.0 (versionCode 1) |
| SDK | min 26, target/compile 35 |
| Toolchain | AGP 8.7.3, Kotlin 2.0.21, Gradle wrapper, JDK 17 |

```
app/src/main/java/ing/jere/paper/
  MainActivity.kt  WebView, insets, native → page events (PAPER.onNative), bar colours from PAPER.bars()
  Native.kt        window.PaperNative: every method the page calls (list at the top of src/arity.json)
  Notifs.kt        notification access: the waiting list, replies, media sessions
  Reminders.kt     remind: exact alarms → a notification; rescheduled after a restart
  Updater.kt       page updates from main/index.html, app updates from the latest release
  IconHandler.kt   /icon/<pkg>/<activity> (unused by this page: no icons)
```

Changes from SHELL: renamed (package, bridge, events), light bars and icon, and the updater accepts any page over 8 KB
that mentions PaperNative.

## Build

Actions → **Release APK** → Run workflow (the button is the only trigger). Publishes release `v<versionName>`
with `paper.apk`. Signing: secret `PAPER_KEYSTORE_B64` (+ optional `PAPER_KEYSTORE_PASSWORD`, `PAPER_KEY_ALIAS`,
`PAPER_KEY_PASSWORD`); without it the APK is debug-signed and each build needs an uninstall first.

The Kotlin is SHELL's, which compiles on CI; only names and colours changed.
