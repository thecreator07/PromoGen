import { adsQueue } from "@/lib/queque";
import { uploadFileToCloudinary } from "@/utils/cloudinary";
import { NextRequest, NextResponse } from "next/server";
// import { adsQueue } from "@/lib/queue";
// import { uploadFileToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs"; // ensure Node (not edge)

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const product = form.get("product") as File | null;
    const template = form.get("template") as File | null;

    const headline = (form.get("headline") as string) ?? "Go with Flow";
    const description = (form.get("description") as string) ?? "Best product for listening";
    const cta = (form.get("cta") as string) ?? "Shop Now";
    const iterations = Number(form.get("iterations") ?? 3);

    if (!product || !template) {
      return NextResponse.json({ error: "product and template files are required" }, { status: 400 });
    }

    // 1) Upload inputs to Cloudinary so worker can fetch them later
    const [prodRes, tmplRes] = await Promise.all([
      uploadFileToCloudinary(product, "ads/inputs"),
      uploadFileToCloudinary(template, "ads/inputs"),
    ]);
    const jobs: string[] = [];
    // 2) Enqueue job
    for (let index = 1; index <= iterations; index++) {
      const job = await adsQueue.add(
        "generate-ads",
        {
          headline,
          description,
          cta,
          iteration: index,
          productUrl: prodRes.secure_url,
          templateUrl: tmplRes.secure_url,
        },
        {
          removeOnComplete: { age: 24 * 3600, count: 1000 },
          removeOnFail: { age: 24 * 3600, count: 1000 },
          attempts: 2, // retry once in worker
        }
      );
      if (job.id) {
        jobs.push(job.id);
      }
    }


    return NextResponse.json({ jobIds: jobs });
  } catch (e: any) {
    console.error("enqueue error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
