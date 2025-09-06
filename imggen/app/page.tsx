"use client";

import { useState } from "react";

export default function Home() {
  const [product, setProduct] = useState<File | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [headline, setHeadline] = useState("Go with Flow");
  const [description, setDescription] = useState("Best product for listening");
  const [cta, setCta] = useState("Shop Now");
  const [folderName, setFolderName] = useState("ads/inputs");
  const [iterations, setIterations] = useState(3);
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !template) {
      alert("Both product and template images are required");
      return;
    }

    const formData = new FormData();
    formData.append("product", product);
    formData.append("template", template);
    formData.append("headline", headline);
    formData.append("description", description);
    formData.append("cta", cta);
    formData.append("folderName", folderName);
    formData.append("iterations", String(iterations));

    setLoading(true);
    try {
      const res = await fetch("/api/imginput", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setJobIds(data.jobIds || []);
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold">Welcome to the Image Generation App</h1>
      <p className="mt-2 text-gray-600">
        Upload your product and template images to get started.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 shadow-md rounded-2xl p-6"
      >
        {/* Product Upload */}
        <div>
          <label className="block font-medium">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProduct(e.target.files?.[0] || null)}
            required
            className="mt-1 block w-full"
          />
        </div>

        {/* Template Upload */}
        <div>
          <label className="block font-medium">Template Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setTemplate(e.target.files?.[0] || null)}
            required
            className="mt-1 block w-full"
          />
        </div>

        {/* Headline */}
        <div>
          <label className="block font-medium">Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          />
        </div>

        {/* CTA */}
        <div>
          <label className="block font-medium">CTA</label>
          <input
            type="text"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          />
        </div>

        {/* Folder Name */}
        <div>
          <label className="block font-medium">Folder Name</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2"
          />
        </div>

        {/* Iterations */}
        <div>
          <label className="block font-medium">Iterations</label>
          <input
            type="number"
            min={1}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="mt-1 block w-full border rounded-md p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Generate Ads"}
        </button>
      </form>

      {jobIds.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Jobs Enqueued:</h2>
          <ul className="list-disc list-inside mt-2">
            {jobIds.map((id) => (
              <li key={id} className="text-sm text-gray-700">
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
