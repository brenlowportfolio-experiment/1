# Handoff: AI voice cloning reel

Read this first in a new chat, then use `/insta-reel` (`.claude/skills/insta-reel/SKILL.md`).

## Current state

- Reel: composition `Reel`, 1080x1920, 2:22 after pause removal. Captions, hook, chapter labels, info cards, b-roll, credited photo, lo-fi music bed. Render: `out/reel-instagram.mp4` (not in git, re-render to get it).
- LinkedIn carousel: composition `Carousel`, 8 slides at 1080x1350, exported to `out/linkedin-carousel.pdf` and `out/linkedin-slides/slide-1..8.jpg` (not in git, re-render to get them).
- Branch: `claude/elegant-ride-9my2q4`. The default branch does not have this work or the skill until merged.

## Decisions the user made

- Captions: calm sentence case, 50 px on a soft dark box, centred. Loud all-caps TikTok style was rejected.
- Everything centred on the vertical centre line.
- Pauses over 0.35 s cut down to about 0.24 s.
- Credits on screen: `Credit: Timeory (YouTube)` on the Spider-Man and Wolverine/Deadpool clips; `Photo: Dick Thomas Johnson, CC BY 2.0, via Wikimedia Commons` on the Scarlett Johansson photo.
- Music: Pixabay "Lofi Hip Hop" by kamaleshsiddu, about 22 dB under the voice, looped with a 3 s crossfade.
- Prefers working locally in future; one folder per video in this repo.
- Dropped: a "Yu Hng / Jeffrey Gomes" story (user said to ignore it).

## Known issues and open items

- The reel says "TikTok got into legal trouble". Accurate: Tsuda sued an anonymous TikTok **account**, and the Guardian calls it a **partial** victory. The reel says "he won the case". The audio can't be changed; the carousel and LinkedIn text use the accurate wording.
- Avengers name tags sit slightly left until the Deadpool tag pops in (empty slot takes space).
- Carousel last slide says "Follow for more on AI & creators"; swap in the user's name or handle when known.
- The user could not upload the PDF to LinkedIn. Likely causes: preview instead of download, the photo button instead of Add a document, or the mobile app. JPG slides were sent as a fallback.

## LinkedIn post text (short version, for the carousel)

Can AI clone your voice without your permission?

A Tokyo court just ruled that a voice actor's voice is a protected publicity right, after an anonymous TikTok account posted 188 AI videos imitating him.

But AI voices also power fan fiction millions enjoy. So where's the line?

Swipe through 👉

#AI #IntellectualProperty #VoiceActing #TechLaw
