'use client';

import React, { useRef, useState } from 'react';
import type { TakeoffResult } from '@/lib/types';

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ↓↓↓ This is what was missing
  const [result, setResult] = useState<TakeoffResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChosen(file: File) {
    setError(null);
    setResult(null);

    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Analyze failed');
      } else {
        // the API returns { ok: true, takeoff: TakeoffResult }
        setResult(data.takeoff as TakeoffResult);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setIsUploading(false);
    }
  }

  function onUploadClick() {
    fileInputRef.current?.click();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-serif text-slate-100">
          AI Construction Estimator
        </h1>
        <p className="text-slate-300 mt-3">
          Upload your plans (PDF) to get a first-pass takeoff and cost breakdown.
        </p>
      </header>

      {/* Upload card */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-200 font-semibold">Upload PDF</h2>
          <button
            onClick={onUploadClick}
            disabled={isUploading}
            className="rounded-full px-4 py-2 bg-amber-400 text-slate-900 font-semibold disabled:opacity-60"
          >
            {isUploading ? 'Uploading…' : 'Upload PDF'}
          </button>
        </div>

        <div
          className="mt-6 h-56 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-400"
          onClick={onUploadClick}
        >
          <div className="text-center">
            <div className="text-slate-300 mb-2">Drag & drop your construction plans here</div>
            <div className="text-xs">(or click anywhere to browse — PDF only)</div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileChosen(file);
          }}
        />

        {error && (
          <div className="mt-4 rounded-md bg-rose-900/30 border border-rose-700 px-3 py-2 text-rose-200">
            {error}
          </div>
        )}

        {isUploading && (
          <div className="mt-4 text-slate-300">
            Uploading… this can take a moment for large plan sets.
          </div>
        )}
      </section>

      {/* Results */}
      {result && (
        <section className="mt-8 space-y-6">
          <div className="rounded-xl border border-green-900 bg-green-900/20 p-4">
            <h3 className="text-green-300 font-semibold mb-2">Analysis Results</h3>

            {/* Summary */}
            {result.summary && (
              <div className="mb-4 rounded-lg border border-blue-800 bg-blue-900/20 p-4">
                <h4 className="font-semibold text-blue-200 mb-1">Summary</h4>
                <p className="text-blue-100 whitespace-pre-wrap">{result.summary}</p>
              </div>
            )}

            {/* Confidence */}
            {typeof result.confidence === 'number' && (
              <div className="mb-4">
                <span className="text-sm text-slate-300">
                  Confidence: {Math.round(result.confidence * 100)}%
                </span>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.round(result.confidence * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="mt-6">
              <h4 className="text-slate-200 font-semibold mb-3">Line Items</h4>
              {result.items?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.items.map((it, i) => (
                    <div key={i} className="rounded-md border border-slate-700 p-3 bg-slate-900/40">
                      <div className="text-slate-200 font-medium">
                        {it.description || 'Item'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {it.category} • {it.qty} {it.unit}
                      </div>
                      {it.notes?.length ? (
                        <div className="text-xs text-slate-400 mt-1">
                          Notes: {it.notes.join(', ')}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">No items extracted.</div>
              )}
            </div>
          </div>

          {/* Optional: show which model was used if you added that field */}
          {/* {result as any}.usedModel && (
            <div className="text-xs text-slate-400">Model: {(result as any).usedModel}</div>
          )} */}
        </section>
      )}
    </main>
  );
}


