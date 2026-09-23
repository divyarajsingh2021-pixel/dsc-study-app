import React from 'react';
import { FileText, Download, Trash2, FileQuestion, Zap, Layers } from 'lucide-react';
import { downloadDocument, deleteDocument } from '../api';

export default function DocumentList({ documents, onDeleted, onSelectForQuiz, onSelectForRevision }) {
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = async (doc) => {
    try {
      await downloadDocument(doc.id, doc.filename);
    } catch (err) {
      alert('Failed to download document: ' + err.message);
    }
  };

  const handleDelete = async (doc) => {
    if (window.confirm(`Are you sure you want to delete "${doc.filename}"? This will remove its vectors and quiz history.`)) {
      try {
        await deleteDocument(doc.id);
        if (onDeleted) onDeleted(doc.id);
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            Uploaded Documents Directory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed study materials ready for RAG Q&amp;A, Mock Tests, and Summaries
          </p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </span>
      </div>

      {/* Table / List */}
      {documents.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText size={28} />
          </div>
          <h4 className="text-sm font-semibold text-slate-700">No documents uploaded yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Upload your lecture notes, textbook chapters, or syllabus PDFs above to start generating quizzes and revision sheets.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-600 font-semibold text-xs border-b border-slate-200">
                <th className="py-3 px-4 sm:px-5">Document Name</th>
                <th className="py-3 px-4 hidden md:table-cell">Uploaded Date</th>
                <th className="py-3 px-4">Pages / Chunks</th>
                <th className="py-3 px-4 hidden sm:table-cell">File Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* File Name & Icon */}
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <span className="text-[11px] text-slate-400 md:hidden block">
                          {doc.upload_date}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Upload Date */}
                  <td className="py-3.5 px-4 text-xs text-slate-500 hidden md:table-cell">
                    {doc.upload_date}
                  </td>

                  {/* Pages & Chunks Badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {doc.chunk_count} chunks
                      </span>
                    </div>
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-4 text-xs text-slate-500 hidden sm:table-cell">
                    {formatFileSize(doc.file_size)}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Mock test quick trigger */}
                      {onSelectForQuiz && (
                        <button
                          onClick={() => onSelectForQuiz(doc.id)}
                          title="Generate Mock Test"
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 hidden sm:inline-flex items-center gap-1 transition-colors"
                        >
                          <FileQuestion size={13} />
                          <span>Test</span>
                        </button>
                      )}

                      {/* Revision quick trigger */}
                      {onSelectForRevision && (
                        <button
                          onClick={() => onSelectForRevision(doc.id)}
                          title="One-Shot Revision"
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 hidden sm:inline-flex items-center gap-1 transition-colors"
                        >
                          <Zap size={13} />
                          <span>Revise</span>
                        </button>
                      )}

                      {/* Download original PDF */}
                      <button
                        onClick={() => handleDownload(doc)}
                        title="Download Original PDF"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                      >
                        <Download size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(doc)}
                        title="Delete Document"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
