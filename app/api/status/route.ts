// Reports which optional services are configured, so the UI can say
// "key not set" honestly instead of failing. Never returns key values.
export const dynamic = "force-dynamic";

export function GET() {
  const aiKey =
    !!process.env.ANTHROPIC_API_KEY &&
    process.env.ASHA_MOCK !== "1" &&
    process.env.ASHA_MOCK !== "true";
  const datastore =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY;
  return Response.json({
    structuring: aiKey ? "live" : "demo",
    speech: { sarvam: !!process.env.SARVAM_API_KEY?.trim() },
    datastore: datastore ? "live" : "local",
  });
}
