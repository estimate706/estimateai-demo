'use client';

import React, { useRef, useState, DragEvent } from 'react';

type AnalyzeResponse =
  | { ok: true; takeoff: any }
  | { ok: false; error: string };

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<'idle'|'picking'|'uploading'|'analyzing'|'done'|'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);

  const openPicker = () => {
    setMessage('');
    setResult(null);
    setStatus('picking');
    inputRef.current?.click();
  };

  const handleFiles = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      // Some browsers send an empty type; allow by extension as fallback
      const nameOk = /\.pdf$/i.test(file.name);
      if (!nameOk) {
        setStatus('error');
        setMessage('Please choose a PDF file.');
        return;
      }
    }

    try {
      setStatus('uploading');
      setMessage('Uploading…');

      const fd = new FormData();
      fd.append('file', file);

      setStatus('analyzing');
      setMessage('Analyzing with AI…');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: fd,
      });

      // Surface non-2xx immediately
      if (!res.ok) {
        const text = await res.text();
        setStatus('error');
        setMessage(`Server error (${res.status}). ${text || 'Check project logs.'}`);
        return;
      }

      const json = (await res.json()) as AnalyzeResponse;

      if ('ok' in json && json.ok) {
        setStatus('done');
        setMessage('Takeoff complete.');
        setResult(json.takeoff);
      } else {
        setStatus('error');
        setMessage(json.error || 'Analysis failed.');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Network error.');
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    await handleFiles(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    await handleFiles(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-serif">AI Construction Estimator</h1>
        <p className="text-slate-300">
          Upload your plans to get a fast, first-pass takeoff and cost breakdown for materials and labor.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between">
          <div className="text-slate-300">
            {status === 'idle' && 'Ready to upload…'}
            {status === 'picking' && 'Choose a PDF…'}
            {status === 'uploading' && 'Uploading…'}
            {status === 'analyzing' && 'Analyzing with AI…'}
            {status === 'done' && 'Done.'}
            {status === 'error' && 'Error.'}
          </div>
          <button
            onClick={openPicker}
            className="rounded-full px-5 py-2 font-medium bg-yellow-400 hover:bg-yellow-300 text-black"
          >
            Upload PDF
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={onInputChange}
          />
        </div>

        <div
          className="mt-6 h-64 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 flex items-center justify-center"
          onDrop={onDrop}
          onDragOver={onDragOver}
          role="button"
          aria-label="Drag and drop your construction plans here"
          onClick={openPicker}
        >
          <div className="text-center space-y-2">
            <div className="text-6xl">☁️</div>
            <div className="text-slate-300 font-medium">
              Drag & drop your construction plans here
            </div>
            <div className="text-slate-500 text-sm">
              or click anywhere in this box to browse (PDF only)
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 text-sm ${
              status === 'error' ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            {message}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-slate-500">
        © {new Date().getFullYear()} EstimateAI – Demo
      </footer>
    </main>
  );
}

