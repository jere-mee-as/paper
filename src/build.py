#!/usr/bin/env python3
"""Assembles ../index.html (the one page the APK ships and the phone downloads) from the pieces in this folder.
   python3 build.py"""
import json, pathlib
here = pathlib.Path(__file__).parent
r = lambda n: (here / n).read_text(encoding="utf-8")
arity = json.dumps(json.loads(r("arity.json")), separators=(",", ":"))
html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,interactive-widget=resizes-content">
<meta name="color-scheme" content="light">
<title>Paper</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
{r("paper.css")}</style>
</head>
<body>
{r("body.html")}<script>
{r("mock.js").replace("__ARITY__", arity)}</script>
<script>
{r("paper.js").replace("/*__THEMES__*/", r("themes.js")).replace("/*__FUN__*/", r("fun.js"))}</script>
</body>
</html>
"""
(here.parent / "index.html").write_text(html, encoding="utf-8")
print("index.html", len(html.encode()), "bytes")
