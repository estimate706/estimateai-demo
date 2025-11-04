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
    console.log('Upload button clicked'); // DEBUG
    setMessage('');
    setResult(null);
    setStatus('picking');
    inputRef.current?.click();
  };

  const handleFiles = async (file?: File) => {
    console.log('handleFiles called with:', file); // DEBUG
    if (!file) {
      console.log('No file provided');
      return;
    }
    
    if (file.type !== 'application/pdf') {
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
      console.log('Starting upload...');

      const fd = new FormData();
      fd.append('file', file);

      setStatus('analyzing');
      setMessage('Analyzing with AI… This may take 30-60 seconds.');

      console.log('Calling /api/analyze...');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: fd,
      });

      console.log('Response status:', res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error('Server error:', text);
        setStatus('error');
        setMessage(`Server error (${res.status}). ${text || 'Check logs.'}`);
        return;
      }

      const json = (await res.json()) as AnalyzeResponse;
      console.log('Response JSON:', json);

      if ('ok' in json && json.ok) {
        setStatus('done');
        setMessage('Takeoff complete.');
        setResult(json.takeoff);
      } else {
        setStatus('error');
        setMessage(json.error || 'Analysis failed.');
      }
    } catch (e: any) {
      console.error('Catch error:', e);
      setStatus('error');
      setMessage(e?.message || 'Network error.');
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input change event'); // DEBUG
    const file = e.target.files?.[0];
    await handleFiles(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    console.log('Drop event'); // DEBUG
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    await handleFiles(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-serif">AI Construction Estimator</h1>
        <p className="text-slate-600">
          Upload your plans to get a fast, first-pass takeoff and cost breakdown for materials and labor.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-slate-700 font-medium">
            {status === 'idle' && 'Ready to upload…'}
            {status === 'picking' && 'Choose a PDF…'}
            {status === 'uploading' && 'Uploading…'}
            {status === 'analyzing' && 'Analyzing with AI…'}
            {status === 'done' && '✅ Done.'}
            {status === 'error' && '❌ Error.'}
          </div>
          <button
            onClick={openPicker}
            className="rounded-full px-6 py-3 font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md"
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
          className="h-64 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={openPicker}
        >
          <div className="text-center space-y-2">
            <div className="text-6xl">📄</div>
            <div className="text-slate-700 font-medium text-lg">
              Drag & drop your construction plans here
            </div>
            <div className="text-slate-500 text-sm">
              or click anywhere to browse (PDF only)
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg text-sm font-medium ${
              status === 'error' 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-4 overflow-auto max-h-96">
            <h3 className="font-bold text-lg mb-2">Results:</h3>
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

