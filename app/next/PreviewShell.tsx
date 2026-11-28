import Link from "next/link";

export default function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="aa-root">
      <div className="aa-shell">
        <div className="aa-topbar">
          <div>
            <Link href="/" className="aa-wordmark" style={{ textDecoration: "none" }}>
              ASHA <span>Awaaz</span>
            </Link>
            <div className="aa-tagline">जल्द आ रहा है · coming next</div>
          </div>
          <span className="nx-pill">Preview · pilot next</span>
        </div>
        {children}
      </div>
    </main>
  );
}
