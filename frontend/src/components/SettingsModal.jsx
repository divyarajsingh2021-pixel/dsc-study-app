import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Cpu, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ExternalLink 
} from 'lucide-react';
import { updateAppSettings, fetchHealth } from '../api';

export default function SettingsModal({ isOpen, onClose, onUpdated }) {
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.1:latest');
  const [ollamaEmbedModel, setOllamaEmbedModel] = useState('nomic-embed-text');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.1-8b-instant');
  const [preferredProvider, setPreferredProvider] = useState('auto');
  
  const [health, setHealth] = useState(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      setTesting(true);
      const data = await fetchHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await updateAppSettings({
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        ollama_embed_model: ollamaEmbedModel,
        groq_api_key: groqApiKey,
        groq_model: groqModel,
        preferred_provider: preferredProvider,
      });
      setHealth(res.status);
      setMsg({ type: 'success', text: 'Settings updated successfully!' });
      if (onUpdated) onUpdated();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">LLM Provider &amp; Model Configuration</h3>
              <p className="text-xs text-slate-500">Configure Ollama local models and Groq cloud fallback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="bg-slate-100/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${health?.ollama_connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span className="font-medium text-slate-600">
                Ollama: <strong>{health?.ollama_connected ? 'Connected' : 'Offline'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${health?.groq_configured ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span className="font-medium text-slate-600">
                Groq: <strong>{health?.groq_configured ? 'Configured' : 'No Key'}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={loadStatus}
            disabled={testing}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw size={11} className={testing ? 'animate-spin' : ''} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Preferred Provider
            </label>
            <select
              value={preferredProvider}
              onChange={(e) => setPreferredProvider(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="auto">Automatic (Ollama Local &rarr; Groq Cloud &rarr; Local Heuristic)</option>
              <option value="ollama">Ollama Only (Local Open-Source)</option>
              <option value="groq">Groq Only (Fast Cloud Free Tier)</option>
              <option value="offline">Offline / Local Heuristic (Zero external setup)</option>
            </select>
          </div>

          {/* Section 1: Ollama */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Cpu size={15} className="text-blue-600" />
              <span>Ollama Settings (Local)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Base URL</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  placeholder="http://localhost:11434"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">LLM Model</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  placeholder="llama3.1:latest"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Embeddings Model</label>
              <input
                type="text"
                value={ollamaEmbedModel}
                onChange={(e) => setOllamaEmbedModel(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500"
                placeholder="nomic-embed-text"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Falls back automatically to local ONNX MiniLM if Ollama is not running.
              </span>
            </div>
          </div>

          {/* Section 2: Groq */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <Cloud size={15} className="text-indigo-600" />
                <span>Groq API (Free Fast Cloud Fallback)</span>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink size={10} />
              </a>
            </div>

            <div className="text-xs">
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Groq API Key</label>
              <input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-mono"
                placeholder="gsk_..."
              />
            </div>

            <div className="text-xs">
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Groq Model</label>
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Highest Quality)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </select>
            </div>
          </div>

          {msg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{msg.text}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-colors disabled:opacity-70"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
