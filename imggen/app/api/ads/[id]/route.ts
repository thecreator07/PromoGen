import { AdsJobResult, adsQueue } from "@/lib/queque";
import { NextRequest, NextResponse } from "next/server";
// import { adsQueue, AdsJobResult } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await adsQueue.getJob(params.id);
    if (!job) return NextResponse.json({ state: "not_found" }, { status: 404 });

    const state = await job.getState();        // waiting | active | completed | failed | delayed
    const progress = job.progress || 0;        // 0..100
    const result = (await job.returnvalue) as AdsJobResult | undefined;

    return NextResponse.json({ state, progress, result });
  } catch (e: any) {
    console.error("status error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
