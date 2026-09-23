import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../api';

export default function DocumentUpload({ onUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    setSuccessMsg(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file (.pdf).');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(30);

      // Simulate step progress while processing vector indexing
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      const result = await uploadDocument(file);
      clearInterval(timer);
      setUploadProgress(100);

      setSuccessMsg(`"${file.name}" uploaded and indexed (${result.chunk_count} chunks, ${result.page_count} pages)!`);
      if (onUploaded) {
        onUploaded(result);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <UploadCloud size={19} className="text-blue-600" />
          Upload Notes &amp; Study Materials
        </h3>
        <span className="text-xs text-slate-500 font-medium">Supports PDF</span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60 scale-[1.005]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-800">
              Parsing &amp; Embedding Document Chunks...
            </p>
            <p className="text-xs text-slate-500 mt-1">Generating ChromaDB vectors &amp; indexing text</p>
            <div className="w-48 bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or drag and drop your PDF here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Lecture slides, textbooks, lecture notes, syllabus guides (up to 50MB)
            </p>
            <button
              type="button"
              className="mt-3.5 px-4 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
            >
              Select PDF File
            </button>
          </div>
        )}
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs font-medium text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
