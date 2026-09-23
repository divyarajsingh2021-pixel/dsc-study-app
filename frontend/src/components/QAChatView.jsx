import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  BookOpen, 
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { sendChatMessage } from '../api';

export default function QAChatView({ documents, preselectedDocId }) {
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || '');
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Study Assistant. Ask me any question about your uploaded study materials, and I will provide an answer grounded strictly in your notes with exact page citations.',
      citations: [],
      provider: 'System'
    }
  ]);
  const [expandedCitation, setExpandedCitation] = useState(null); // 'msgIdx-citIdx'

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (preselectedDocId) {
      setSelectedDocId(preselectedDocId);
    }
  }, [preselectedDocId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText = inputQuery) => {
    const textToSend = queryText.trim();
    if (!textToSend || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInputQuery('');
    setLoading(true);

    try {
      // Send past turns to maintain context
      const formattedHistory = nextHistory
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatMessage(textToSend, selectedDocId || null, formattedHistory);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          citations: res.citations || [],
          provider: res.provider_used
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error retrieving answer: ${err.message}. Please check that backend and vector store are active.`,
          citations: [],
          provider: 'Error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat session cleared. How can I help you study your uploaded notes today?',
        citations: [],
        provider: 'System'
      }
    ]);
  };

  const samplePrompts = [
    'What are the 4 conditions required for a deadlock?',
    'What is the difference between a process and a thread?',
    'Explain the Critical-Section Problem and its 3 criteria.',
    'How do counting semaphores differ from binary semaphores?'
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[520px]">
      {/* Top Filter & Toolbar */}
      <div className="bg-white rounded-t-xl border border-slate-200 p-3 sm:px-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Layers size={16} className="text-blue-600 shrink-0" />
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">Search Across All Uploaded Documents</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-xs flex items-center gap-1 font-medium"
          title="Clear Conversation"
        >
          <RotateCcw size={14} />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 bg-white border-x border-slate-200 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, msgIdx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msgIdx}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <Bot size={16} />
                </div>
              )}

              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[82%]`}>
                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-[#f8fafc] border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounded Citation Chips */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                        <Sparkles size={12} className="text-blue-600" />
                        <span>Retrieved RAG Sources ({msg.citations.length})</span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.citations.map((cit, cIdx) => {
                          const citKey = `${msgIdx}-${cIdx}`;
                          const isExpanded = expandedCitation === citKey;
                          return (
                            <div
                              key={cIdx}
                              className="rounded-lg border border-slate-200 bg-white overflow-hidden text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedCitation(isExpanded ? null : citKey)}
                                className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <FileText size={13} className="text-blue-600 shrink-0" />
                                  <strong className="text-slate-800 font-semibold truncate">
                                    {cit.document_name}
                                  </strong>
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                                    Page {cit.page}
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp size={14} className="text-slate-400" />
                                ) : (
                                  <ChevronDown size={14} className="text-slate-400" />
                                )}
                              </button>

                              {/* Accordion snippet preview */}
                              {isExpanded && (
                                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed italic">
                                  "{cit.snippet}"
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Meta info below bubble */}
                {!isUser && msg.provider && msg.provider !== 'System' && (
                  <span className="text-[10px] text-slate-400 mt-1 ml-1 flex items-center gap-1">
                    Grounded with: <strong className="text-slate-500 font-medium">{msg.provider}</strong>
                  </span>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading typing bubble */}
        {loading && (
          <div className="flex gap-3 mr-auto items-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl rounded-tl-none flex items-center gap-2 text-xs text-slate-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="font-medium text-slate-600">Retrieving chunks &amp; formulating grounded response...</span>
            </div>
          </div>
        )}

        {/* Quick starter prompts if only initial message */}
        {messages.length === 1 && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-blue-600" />
              Suggested questions to try:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs text-left text-slate-700 font-medium transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-b-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              documents.length === 0
                ? 'Upload notes first to ask questions...'
                : 'Ask anything about your uploaded study materials...'
            }
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm shadow-blue-600/30 flex items-center justify-center gap-1.5 text-xs transition-all shrink-0"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
}
