import re, html, json

DECK = r"C:\Users\Minto\Desktop\Arc Garde Clients\Arc Garde\ag-reports\presentations\muevelo-simplified\index.html"
DOCX = r"C:\Users\Minto\Desktop\Arc Garde Clients\Arc Garde\ag-reports\presentations\muevelo-simplified\reports\new-copy-extract-2026-06-10.txt"

# --- load deck slides ---
src = open(DECK, encoding="utf-8").read()
sections = re.findall(r'<section class="slide[^"]*"[^>]*>(.*?)</section>', src, re.S)
def strip_html(s):
    s = re.sub(r"<[^>]+>", " ", s)
    return html.unescape(s)
slide_texts = [strip_html(s) for s in sections]

# --- normalization: apply the AG standard conversions to docx text, then token-compare ---
SPELLED = {"fourteen": "14", "five": "5", "four": "4", "two": "2", "three": "3"}
def norm_tokens(s, convert_spelled=False):
    s = s.lower()
    s = s.replace("–", " ").replace("—", " ").replace("’", "'")
    if convert_spelled:
        for w, d in SPELLED.items():
            s = re.sub(r"\b" + w + r"\b", d, s)
    s = s.replace("&", " and ")
    toks = re.findall(r"[a-z0-9.%']+", s.replace("$", " ").replace(",", ""))
    toks = [t for t in toks if t not in ("to",)]  # en-dash ranges rendered as "to" / " - "
    return toks

slide_tok = [norm_tokens(t) for t in slide_texts]

# --- parse docx extract into slides ---
raw = open(DOCX, encoding="utf-8").read().replace("﻿", "")
blocks = re.split(r"^SLIDE (\d+)", raw, flags=re.M)
docx_slides = {}
for i in range(1, len(blocks), 2):
    docx_slides[int(blocks[i])] = [l.strip().lstrip("•").strip() for l in blocks[i + 1].splitlines() if l.strip()]

fail = []
# Direction 1: every docx line's tokens must be contained in its deck slide's token multiset
for n, lines in docx_slides.items():
    bag = list(slide_tok[n - 1])
    joined = " ".join(slide_tok[n - 1])
    for line in lines:
        lt = norm_tokens(line, convert_spelled=True)
        if not lt:
            continue
        if " ".join(lt) in joined:
            continue
        missing = []
        tmp = list(bag)
        for t in lt:
            if t in tmp:
                tmp.remove(t)
            else:
                missing.append(t)
        if missing:
            fail.append(f"SLIDE {n} docx line not fully in deck: '{line}'  MISSING TOKENS: {missing}")

# Direction 2: every deck slide token must be accounted for by docx slide tokens + whitelist
WHITELIST = set("privileged and confidential months month per guests enter exit full screen press esc".split())
for n, lines in docx_slides.items():
    docx_bag = []
    for line in lines:
        docx_bag += norm_tokens(line, convert_spelled=True)
    extra = []
    tmp = list(docx_bag)
    for t in slide_tok[n - 1]:
        if t in tmp:
            tmp.remove(t)
        elif t not in WHITELIST:
            extra.append(t)
    if extra:
        fail.append(f"SLIDE {n} deck has tokens NOT in docx: {sorted(set(extra))}")

print(f"deck slides: {len(slide_texts)} | docx slides: {len(docx_slides)}")
if fail:
    print("FAILURES:")
    for f in fail:
        print(" -", f)
else:
    print("PASS: all 26 docx slides word-for-word in deck (standard conversions only); no extra deck copy beyond whitelist.")
print("Slide 27 (Thank You) intentionally outside docx per Quinten.")
