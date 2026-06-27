import { NextResponse } from "next/server";
import { getAnalyzedHomes } from "@/lib/listings";
import { buildWorkbook } from "@/lib/export";
import { DEFAULT_ASSUMPTIONS, type MortgageAssumptions } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExportBody {
  assumptions?: Partial<MortgageAssumptions>;
  wifeHours?: "low" | "high";
  ids?: string[];
}

export async function POST(req: Request) {
  let body: ExportBody = {};
  try {
    body = (await req.json()) as ExportBody;
  } catch {
    // empty body → export everything at default assumptions
  }

  const assumptions: MortgageAssumptions = { ...DEFAULT_ASSUMPTIONS, ...body.assumptions };
  let homes = await getAnalyzedHomes(undefined, { assumptions, wifeHours: body.wifeHours ?? "low" });

  if (body.ids && body.ids.length > 0) {
    const set = new Set(body.ids);
    homes = homes.filter((h) => set.has(h.listing.id));
  }

  const buffer = buildWorkbook(homes, assumptions);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="charleston-home-analysis-${stamp}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
