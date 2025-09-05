import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { buildAdPrompt } from "@/lib/promtBuilder";
import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryUploadResponse } from "@/schema/cloudinaryUpload";
import { uploadBufferToCloudinary } from "@/utils/cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});



export async function POST(req: NextRequest) {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

        const formData = await req.formData();

        const productFile = formData.get("product") as File;
        const templateFile = formData.get("template") as File;
        const headline = formData.get("headline") as string;
        const description = formData.get("description") as string;
        const cta = formData.get("cta") as string;

        if (!productFile) {
            return NextResponse.json({ error: "Missing product file" }, { status: 400 });
        }
        if (!templateFile) {
            return NextResponse.json({ error: "Missing template file" }, { status: 400 });
        }

        // Convert uploaded images to base64
        const productBuffer = Buffer.from(await productFile.arrayBuffer());
        const productBase64 = productBuffer.toString("base64");

        const templateBuffer = Buffer.from(await templateFile.arrayBuffer());
        const templateBase64 = templateBuffer.toString("base64");

        const imageUrls: string[] = [];
        for (let iteration = 1; iteration <= 2; iteration++) {
            const prompt_text = buildAdPrompt(
                headline,
                description,
                cta,
                iteration
            );


            const prompt = [
                { text: prompt_text },
                {
                    inlineData: {
                        mimeType: productFile.type,
                        data: productBase64,
                    },
                },
                {
                    inlineData: {
                        mimeType: templateFile.type,
                        data: templateBase64,
                    },
                },
            ];
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-image-preview",
                contents: prompt,
            });

            const parts = response.candidates?.[0]?.content?.parts || [];
            let imageUrls: string[] = [];

            for (const part of parts) {
                if (part.inlineData) {
                    const data = part.inlineData.data || "";
                    const buffer = Buffer.from(data, "base64");
                    // Convert buffer into a base64 data URI to preview in browser
                    // Save inside project "public" folder
                    // const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
                    //     const uploadStream = cloudinary.uploader.upload_stream(
                    //         { folder: `ads/image-${iteration}`, resource_type: "auto" },
                    //         (error, result) => {
                    //             if (error) {
                    //                 reject(error);
                    //             } else {
                    //                 resolve(result as CloudinaryUploadResponse);
                    //             }
                    //         }
                    //     )

                    //     uploadStream.end(buffer);
                    // }
                    // )
                    const result = await uploadBufferToCloudinary(buffer, `image-${iteration}`);
                  
                    // const filePath = path.join(process.cwd(), "public", `gemini-test-${iteration}.png`);
                    // fs.writeFileSync(filePath, buffer);

                    imageUrls.push(result.secure_url as string);
                }
            }
        }

        return NextResponse.json({
            message: "Gemini test working",
            images: imageUrls,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
