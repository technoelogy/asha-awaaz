// ASHA Awaaz — 4-step progress strip. Each step deepens the Prussian blue,
// so she always sees where she is: किसके लिए → बोलें → जाँचें → सेव.

const STEPS = [
  { hi: "किसके लिए", en: "Who" },
  { hi: "बोलें", en: "Speak" },
  { hi: "जाँचें", en: "Check" },
  { hi: "सेव", en: "Saved" },
];

export default function ProgressStrip({ current }: { current: number }) {
  return (
    <ol className="aa-steps" aria-label="Visit steps">
      {STEPS.map((s, i) => (
        <li
          key={s.en}
          className="aa-step"
          data-step={i}
          data-state={i < current ? "done" : i === current ? "now" : "next"}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="aa-step-num">{i < current ? "✓" : i + 1}</span>
          <span className="aa-step-hi">{s.hi}</span>
        </li>
      ))}
    </ol>
  );
}
