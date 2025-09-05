async function processJob(job) {
  const { headline, description, cta, iterations, productUrl, templateUrl } = job.data;
  // console.log(headline, description, cta, iterations, productUrl, templateUrl);

  const urls = [];

  // prepare inputs once
  const [product, template] = await Promise.all([urlToBase64(productUrl), urlToBase64(templateUrl)]);
  for (let i = 1; i <= iterations; i++) {
    const prompt = buildAdPrompt(headline, description, cta, i);

    const parts = [
      { text: prompt },
      { inlineData: { mimeType: product.mime, data: product.base64 } },
      { inlineData: { mimeType: template.mime, data: template.base64 } },
    ];

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: parts,
    });

    const genPart = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!genPart?.inlineData?.data) {
      job.log(`Iteration ${i} produced no inline image`);
      continue;
    }

    // const outBuffer = Buffer.from(genPart.inlineData.data, "base64");
    // console.log(outBuffer)
    // upload result to Cloudinary
    for (const part of parts) {
      if (part.inlineData) {
        const data = genPart.inlineData.data || "";
        const buffer = Buffer.from(data, "base64");
        console.log(objects(part.inlineData))
        // Convert buffer into a base64 data URI to preview in browser
        // Save inside project "public" folder
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `ad_${job.id}_${i}`, resource_type: "auto" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          )

          uploadStream.end(buffer);
        }
        )
        // const result = await uploadBufferToCloudinary(buffer, `ad_${job.id}_${i}`);

        // // const filePath = path.join(process.cwd(), "public", `gemini-test-${iteration}.png`);
        // // fs.writeFileSync(filePath, buffer);

        urls.push(result.secure_url);
      }
    }
    // const upload = await uploadBufferToCloudinary(outBuffer, `ad_${job.id}_${i}`);
    urls.push(upload.secure_url);

    // progress
    await job.updateProgress(Math.round((i / iterations) * 100));
  }

  return { urls };
}
