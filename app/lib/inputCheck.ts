// ASHA Awaaz — input check, BEFORE the AI is called.
//
// Catches keyboard mash ("asdfgh"), a lone word, or a noise burst from the
// speech engine. Cheap rules, no AI: saves a wasted call and saves her a
// screen of blank fields. Runs in the browser AND in /api/structure.
//
// It only blocks text that cannot be a visit note. Anything that looks like
// words passes; the validator and her confirmation handle the rest.

export type InputVerdict =
  | { ok: true }
  | { ok: false; reason: "too_short" | "gibberish"; message: string };

const DEVANAGARI = /[ऀ-ॿ]/;
const LETTERS = /\p{L}/gu;

// A Latin-script token "looks like a word" if it has a vowel, no run of 5+
// consonants, and no letter repeated 4+ times ("aaaa", "kkkkk").
function latinLooksReal(t: string): boolean {
  const w = t.toLowerCase();
  if (/(.)\1{3,}/.test(w)) return false;
  if (!/[aeiouy]/.test(w)) return false;
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(w)) return false;
  return true;
}

export function checkTranscript(text: string): InputVerdict {
  const letters = (text.match(LETTERS) ?? []).length;
  const tokens = text.split(/[\s,.;:!?।|/\\-]+/).filter((t) => (t.match(LETTERS) ?? []).length >= 2);

  if (letters < 8 || tokens.length < 2) {
    return {
      ok: false,
      reason: "too_short",
      message: "बहुत कम सुनाई दिया। नाम, उम्र और जाँच की बात बोलिए या लिखिए।",
    };
  }

  const real = tokens.filter((t) => DEVANAGARI.test(t) || latinLooksReal(t)).length;
  if (real / tokens.length < 0.6) {
    return {
      ok: false,
      reason: "gibberish",
      message: "यह बात समझ नहीं आई। कृपया फिर से बोलिए या साफ़ लिखिए।",
    };
  }
  return { ok: true };
}
