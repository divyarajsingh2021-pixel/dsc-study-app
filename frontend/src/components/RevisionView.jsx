import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { generateRevisionSheet } from '../api';
import { exportRevisionToPdf } from '../utils/pdfExport';

export default function RevisionView({ documents, preselectedDocId, onRevisionGenerated }) {
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || '');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preselectedDocId) {
      setSelectedDocId(preselectedDocId);
    } else if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, preselectedDocId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      setError('Please select a document.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await generateRevisionSheet(selectedDocId, topic);
      setSheet(res);
      if (onRevisionGenerated) onRevisionGenerated();
    } catch (err) {
      setError(err.message || 'Failed to generate revision sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (sheet?.raw_markdown) {
      navigator.clipboard.writeText(sheet.raw_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = () => {
    exportRevisionToPdf(sheet?.topic || 'One-Shot Revision');
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">No study documents available</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Please upload a study PDF in the Dashboard to generate one-shot revision notes.
        </p>
      </div>
    );
  }

  // 1. GENERATOR FORM (if no sheet yet)
  if (!sheet) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">One-Shot Topic Revision</h2>
              <p className="text-xs text-slate-500">
                Condense extensive chapters into high-yield definitions, key takeaways, and practice Q&amp;As
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Document <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename} ({doc.page_count} pages)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specific Chapter or Topic <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Critical Section, Semaphores, Deadlock Conditions..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave empty to synthesize a condensed summary across the entire document.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Extracting &amp; Formatting Revision Sheet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate One-Shot Sheet &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. SCANNABLE REVISION SHEET
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Action Toolbar (no-print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheet(null)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="Generate Another Sheet"
          >
            <RotateCcw size={16} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {sheet.topic}
            </h3>
            <span className="text-[11px] text-slate-500">Source: {sheet.document_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} />
            <span>Download as PDF</span>
          </button>
        </div>
      </div>

      {/* The Printable Revision Document */}
      <div className="revision-sheet bg-white rounded-xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-bold uppercase tracking-wider mb-2">
            One-Shot Revision Sheet
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {sheet.topic}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Grounded from: <strong>{sheet.document_name}</strong> • Quick Exam Preparation Reference
          </p>
        </div>

        {/* Section 1: Key Definitions */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-extrabold">1</span>
            Key Definitions &amp; Core Terminology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sheet.key_definitions.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-lg"
              >
                <strong className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">
                  {item.term}
                </strong>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Key Takeaways & Bullets */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">2</span>
            Core Principles &amp; Key Takeaways
          </h2>
          <div className="bg-slate-50/60 border border-slate-200/80 rounded-lg p-4 sm:p-5">
            <ul className="space-y-2.5">
              {sheet.key_points.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 3: High-Yield Practice Q&As */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-extrabold">3</span>
            High-Yield Exam Practice Q&amp;A
          </h2>
          <div className="space-y-3">
            {sheet.example_qas.map((qa, idx) => (
              <div
                key={idx}
                className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm"
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-700">Q{idx + 1}:</span>
                  <p className="text-xs font-bold text-slate-900">{qa.question}</p>
                </div>
                <div className="flex items-start gap-2 pl-4 text-xs text-slate-700 leading-relaxed border-l-2 border-emerald-400">
                  <p>
                    <strong className="text-emerald-800 font-semibold">Answer: </strong>
                    {qa.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
