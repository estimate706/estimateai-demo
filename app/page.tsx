"use client";

import { useRef, useState } from "react";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  function onChoose() {
    inputRef.current?.click();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setStatus("Ready to upload...");
    // Placeholder upload logic — add your PDF processing later
  }

  return (
    <main className="mx-auto max-w-5xl px-6 pt-16 pb-20 space-y-14">

      {/* HERO */}
      <section className="text-center space-y-5">
        <div className="flex justify-center gap-3 flex-wrap mt-2">
          <span className="chip">Instant Estimate</span>
          <span className="chip">Material + Labor Costs</span>
          <span className="chip">Upload PDF Plans</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold text-cream">
          AI Construction Estimator
        </h1>
        <p className="subtitle text-base sm:text-lg max-w-3xl mx-auto">
          Upload your plans to get a fast, first-pass takeoff and cost breakdown for
          materials and labor.
        </p>
      </section>

      {/* UPLOADER CARD */}
      <section className="card-pro max-w-3xl mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-200">
            {status ? status : "Upload a PDF plan set to begin."}
          </div>
          <button onClick={onChoose} className="btn-gold">
            Upload PDF
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Dropzone */}
        <div className="dropzone">
          <div className="text-6xl leading-none mb-3">☁️</div>
          <div className="text-slate-100 font-medium">
            Drag & drop your construction plans here
          </div>
          <div className="text-slate-300 text-sm">
            or click the gold button to browse (PDF only)
          </div>
        </div>

        {blobUrl && (
          <div className="mt-4 text-xs text-slate-400">
            Stored at:{" "}
            <a
              className="underline decoration-gold hover:text-gold"
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {blobUrl}
            </a>
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-pro p-4 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-semibold text-cream">Fast</div>
          <div className="text-slate-300 text-sm">~60 seconds</div>
        </div>
        <div className="card-pro p-4 text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div className="font-semibold text-cream">Accurate</div>
          <div className="text-slate-300 text-sm">AI-assisted parsing</div>
        </div>
        <div className="card-pro p-4 text-center">
          <div className="text-2xl mb-1">🧮</div>
          <div className="font-semibold text-cream">Complete</div>
          <div className="text-slate-300 text-sm">Materials + Labor</div>
        </div>
      </section>

      {/* PREVIEWS */}
      {!!previews.length && (
        <section className="grid grid-cols-2 gap-3">
          {previews.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Page ${i + 1}`}
              className="w-full rounded-xl border border-slate-800"
            />
          ))}
        </section>
      )}

      {/* RESULTS */}
      {result && (
        <section className="card-pro p-5">
          <h2 className="text-xl font-semibold mb-2 text-cream">AI Results</h2>
          <pre className="text-xs text-slate-200 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
