# Jua web font provenance

Copied unchanged from `D:/iscreammedia_sc34/1udangtangtang/public/assets/fonts` on 2026-10-21. No network font request is required during gameplay.

| File | Bytes | SHA-256 |
|---|---:|---|
| jua-korean-400.woff2 | 368172 | b5c280f7c75d6634c3011682ab7787b73b8cfc4acaee4b70fa7aad228adf7d70 |
| jua-latin-400.woff2 | 16620 | a317499f46a11810207ace4e5fdf04c9949250abeb914a1e713c391e4606c4f2 |

Both embedded font name tables identify `Jua`, `Regular`, `Version 1.001`, copyright `2018 The BM JUA Project Authors`, and the SIL OFL URL. The font binary files were not modified.

The sibling project's notice had a legacy 2017 copyright heading. `Jua-OFL.txt` keeps the SIL Open Font License 1.1 text and now includes the current upstream copyright heading plus the binary's embedded notice. It must be included with the font files in the delivery.

Primary license source checked 2026-10-21: [Google Fonts Jua OFL](https://github.com/google/fonts/blob/main/ofl/jua/OFL.txt). Commercial bundling and embedding are allowed under its conditions; do not sell the font on its own or claim ownership of the font.


# NanumSquareNeo review update (2026-11-10)

The active UI, Phaser text, research notes and canvas exports use three unmodified local NanumSquareNeo static weights.
Source: https://hangeul.pstatic.net/hangeul_static/css/nanum-square-neo.css (files under `webfont/NanumSquareNeo/`)
License: NanumSquareNeo-OFL.txt (SIL Open Font License 1.1), https://help.naver.com/service/30016/contents/18088?osType=PC&lang=ko

| File | Weight | Bytes | SHA-256 |
|---|---|---:|---|
| NanumSquareNeoTTF-bRg.woff | 400 | 743272 | 065bd89190ec3442b24134e3b9901277e98857376b94b6fa9ea9f2ece835b04e |
| NanumSquareNeoTTF-cBd.woff | 700 | 741752 | 7a6718ea4b4bc15f67da16822a8db39dbad0a258e8134213c284c9e9749a1de3 |
| NanumSquareNeoTTF-dEb.woff | 800–900 | 750328 | 300fe691068e9ef6834b1fb10484929f26d188af7d8f45078b725e29e6883e9e |

Naver's `NanumSquareNeo-Variable.woff` (SHA-256 abbc7b2a…62d2e3) is not used: Chrome 156 on Windows rejects it
("OTS parsing error: Unable to instantiate font face"), both from this project and from Naver's own URL, so the page
fell back to Malgun Gothic. It is kept in `source/` for provenance and is excluded from the build.
Previously supplied font files are retained for provenance; the runtime no longer uses them.

# NanumSquareNeo WOFF2 (2026-11-21)

The 400 and 700 weights are now served as WOFF2 first, with the WOFF files above kept as the fallback in the same `@font-face`.
The WOFF2 files are copied unchanged from `7 earthchange/public/assets/fonts/` (its `NanumSquareNeo-SOURCE.json`:
source https://campaign.naver.com/nanumsquare_neo/download/NaverNanumSquareNeo.zip, SIL OFL 1.1). The 800–900 weight stays WOFF only,
because no WOFF2 copy with a recorded source was found.

| File | Weight | Bytes | SHA-256 |
|---|---|---:|---|
| NanumSquareNeoTTF-bRg.woff2 | 400 | 387104 | d13846b612acc829078aff4f91c272c637c08441b409d46bb1a4c802eb2967c3 |
| NanumSquareNeoTTF-cBd.woff2 | 700 | 384992 | 97dfe9720fbed813fc988fcedbcf741e97eef9353515b2043717484ec0b90aa1 |

Check before switching (headless Chrome): the advance width of 11,390 characters (ASCII, every Hangul syllable U+AC00–D7A3,
Hangul jamo and the symbols the game uses) is identical between each WOFF and WOFF2 pair (`.tmp/score-fix-20261121/fontcmp.mjs`).
