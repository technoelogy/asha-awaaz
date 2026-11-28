// ASHA Awaaz — demo video voiceover (Sarvam Bulbul v3, Indian English, female).
//
//   node scripts/voiceover.mjs                 # voice "ishita" (default)
//   node scripts/voiceover.mjs --speaker priya # try another voice
//   PACE=0.95 node scripts/voiceover.mjs       # a touch slower
//
// Reads SARVAM_API_KEY from .env.local (never printed). Writes to voiceover/:
//   01-hook.wav … 13-close.wav   one clip per beat, so each line starts on its shot
//   preview.wav                  all clips on the video timeline, silence between
//   subtitles.srt                the same words, timed, for burning into the video
// Cost: about 1,800 characters ≈ ₹6 at ₹30 per 10,000 characters.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const key = (process.env.SARVAM_API_KEY || env.match(/^SARVAM_API_KEY=(.*)$/m)?.[1] || "").trim().replace(/^["']|["']$/g, "");
if (!key) {
  console.error("No SARVAM_API_KEY found. Run this from the ASHA-Awaaz folder (where .env.local is).");
  process.exit(1);
}
const speakerArg = process.argv.indexOf("--speaker");
const SPEAKER = speakerArg > -1 ? process.argv[speakerArg + 1] : "ishita";
const PACE = Number(process.env.PACE || 1);

// start = second on the video timeline; end = when the next beat begins.
// tts = what the voice reads (spelled for speech; Indian words in Devanagari so Sarvam says them right);
// sub = what the screen shows.
const BEATS = [
  { id: "01-hook", start: 0, end: 8,
    sub: "Ten lakh women carry India’s health system to the doorstep. They are called ASHAs. Most people have never heard of them.",
    tts: "Ten lakh women carry India's health system to the doorstep. They are called आशा workers. Most people have never heard of them." },
  { id: "02-who", start: 8, end: 20,
    sub: "An ASHA visits every pregnant woman in her village. She checks for danger signs, and writes it all in a paper register.",
    tts: "An आशा worker visits every pregnant woman in her village. She checks for danger signs, and writes it all in a paper register." },
  { id: "03-gap", start: 20, end: 35,
    sub: "But paper can’t be checked. In one study, records showed 96% of day-7 newborn visits done. Families confirmed 46%.",
    tts: "But paper can't be checked. In one study, records showed ninety-six percent of day-seven newborn visits done. Families confirmed forty-six percent." },
  { id: "04-agitate", start: 35, end: 55,
    sub: "And when she sends a woman with a danger sign to the health centre, nobody tells her if anyone saw it. Half of maternal deaths start with a delay like this.",
    tts: "And when she sends a woman with a danger sign to the health centre, nobody tells her if anyone saw it. Half of maternal deaths start with a delay like this." },
  { id: "05-loop", start: 55, end: 70,
    sub: "ASHA Awaaz closes that loop. The health centre marks the referral seen, and the tick lands on her phone. Here is how it got there.",
    tts: "आशा आवाज़ closes that loop. The health centre marks the referral seen, and the tick lands on her phone. Here is how it got there." },
  { id: "06-pick", start: 70, end: 78,
    sub: "She picks who the visit is for.",
    tts: "She picks who the visit is for." },
  { id: "07-speak", start: 90, end: 98,
    sub: "She just speaks, in Hindi or Hinglish. No typing.",
    tts: "She just speaks, in Hindi or Hinglish. No typing." },
  { id: "08-check", start: 98, end: 120,
    sub: "AI turns her words into the form. Code checks every field. A danger sign means a red referral. And it remembers her: 28 weeks last visit, so 26 today gets a question.",
    tts: "A.I. turns her words into the form. Code checks every field. A danger sign means a red referral. And it remembers her. Twenty-eight weeks last visit, so twenty-six today gets a question." },
  { id: "09-save", start: 120, end: 130,
    sub: "She saves. No signal? The visit waits on the phone and syncs later.",
    tts: "She saves. No signal? The visit waits on the phone, and syncs later." },
  { id: "10-phc", start: 130, end: 145,
    sub: "At the health centre: who is waiting, who is overdue past 24 hours, who was referred twice. One click exports the register.",
    tts: "At the health centre: who is waiting, who is overdue past twenty-four hours, who was referred twice. One click exports the register." },
  { id: "11-safety", start: 145, end: 157,
    sub: "Noise and gibberish never reach the AI. 29 safety tests and 7 live tests pass after every change.",
    tts: "Noise and gibberish never reach the A.I. Twenty-nine safety tests and seven live tests pass after every change." },
  { id: "12-next", start: 157, end: 168,
    sub: "Next: women over 30, new mothers and young children, on the same engine. About 53 paise a note.",
    tts: "Next: women over thirty, new mothers and young children, on the same engine. About fifty-three paise a note." },
  { id: "13-close", start: 168, end: 175,
    sub: "ASHA Awaaz. Built for impact. Built for a greater Bharat.",
    tts: "आशा आवाज़. Built for impact. Built for a greater भारत." },
];

// --- tiny WAV helpers (PCM 16-bit) -------------------------------------------
function parseWav(buf) {
  let off = 12, fmt = null, data = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4), size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { channels: buf.readUInt16LE(off + 10), rate: buf.readUInt32LE(off + 12), bits: buf.readUInt16LE(off + 22) };
    if (id === "data") data = buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  return { ...fmt, data };
}
function wavFile(pcm, { channels, rate, bits }) {
  const h = Buffer.alloc(44), block = channels * (bits / 8);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * block, 28); h.writeUInt16LE(block, 32); h.writeUInt16LE(bits, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
const srtTime = (s) => {
  const ms = Math.round(s * 1000), p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

// --- generate -----------------------------------------------------------------
mkdirSync("voiceover", { recursive: true });
console.log(`\nVoiceover · Sarvam bulbul:v3 · en-IN · speaker "${SPEAKER}" · pace ${PACE}\n`);
const clips = [];
let srt = "", n = 0, chars = 0;
for (const b of BEATS) {
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text: b.tts, target_language_code: "en-IN", speaker: SPEAKER, model: "bulbul:v3", pace: PACE }),
  });
  if (!res.ok) { console.error(`✖ ${b.id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); process.exit(1); }
  const body = await res.json();
  const wav = Buffer.from(body.audios.join(""), "base64");
  writeFileSync(`voiceover/${b.id}.wav`, wav);
  const w = parseWav(wav);
  const secs = w.data.length / (w.rate * w.channels * (w.bits / 8));
  const slot = b.end - b.start;
  chars += b.tts.length;
  clips.push({ ...b, w, secs });
  console.log(`${secs <= slot ? "✅" : "⚠️ "} ${b.id.padEnd(11)} ${secs.toFixed(1).padStart(5)} s of ${String(slot).padStart(2)} s slot${secs > slot ? "  ← too long: trim the line or raise PACE" : ""}`);
  srt += `${++n}\n${srtTime(b.start)} --> ${srtTime(b.start + Math.max(secs, 2))}\n${b.sub}\n\n`;
}

// preview.wav: each clip placed at its start second, silence elsewhere
const fmt = clips[0].w, bytesPerSec = fmt.rate * fmt.channels * (fmt.bits / 8);
const total = Buffer.alloc(Math.ceil(175 * bytesPerSec) + bytesPerSec * 10);
for (const c of clips) {
  const at = Math.floor(c.start * bytesPerSec / 2) * 2;
  c.w.data.copy(total, at, 0, Math.min(c.w.data.length, total.length - at));
}
writeFileSync("voiceover/preview.wav", wavFile(total.subarray(0, Math.ceil(175 * bytesPerSec / 2) * 2), fmt));
writeFileSync("voiceover/subtitles.srt", srt);
console.log(`\n${clips.length} clips · ${chars} characters ≈ ₹${(chars / 10000 * 30).toFixed(1)} · voiceover/preview.wav (2:55) · voiceover/subtitles.srt\n`);
console.log("Gap 1:18–1:30 is left silent on purpose: her real voice note plays there.\n");
