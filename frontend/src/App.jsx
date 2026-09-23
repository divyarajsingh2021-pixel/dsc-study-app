import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileQuestion, 
  Zap, 
  MessageSquareText, 
  Award, 
  TrendingUp, 
  BookCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MobileNav from './components/MobileNav';
import StatCard from './components/StatCard';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import MockTestView from './components/MockTestView';
import RevisionView from './components/RevisionView';
import QAChatView from './components/QAChatView';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import AccountView from './components/AccountView';
import InstallPrompt from './components/InstallPrompt';

import { fetchDocuments, fetchStats, fetchHealth } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('study_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    documents_uploaded: 0,
    tests_taken: 0,
    avg_score: 0.0,
    topics_revised: 0,
  });
  const [healthInfo, setHealthInfo] = useState(null);
  const [preselectedDocId, setPreselectedDocId] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('study_user', JSON.stringify(user));
    } catch (e) {}
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('study_user');
    } catch (e) {}
  };

  const loadAllData = async () => {
    try {
      setIsRefreshing(true);
      const [docsRes, statsRes, healthRes] = await Promise.allSettled([
        fetchDocuments(),
        fetchStats(),
        fetchHealth(),
      ]);

      if (docsRes.status === 'fulfilled') {
        setDocuments(docsRes.value.documents || []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (healthRes.status === 'fulfilled') {
        setHealthInfo(healthRes.value);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  const handleDocumentUploaded = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    loadAllData();
  };

  const handleDocumentDeleted = (deletedId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
    loadAllData();
  };

  const handleQuickQuiz = (docId) => {
    setPreselectedDocId(docId);
    setCurrentTab('mock-test');
  };

  const handleQuickRevision = (docId) => {
    setPreselectedDocId(docId);
    setCurrentTab('revision');
  };

  const pageTitles = {
    'dashboard': 'DSC Intelligence Dashboard',
    'mock-test': 'Interactive Mock Test Engine',
    'revision': 'One-Shot Revision Sheets',
    'qa-chat': 'Grounded Q&A (RAG Assistant)',
    'account': 'My Account & Registered Users',
    'settings': 'Settings & Provider Configuration',
  };

  // If user is not logged in, render the secure Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar (ERP Navy Style) */}
      <Sidebar
        currentTab={currentTab}
        setTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        healthInfo={healthInfo}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
        <InstallPrompt />
        <Topbar
          title={pageTitles[currentTab] || 'Study Assistant'}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAccount={() => setCurrentTab('account')}
          onRefresh={loadAllData}
          healthInfo={healthInfo}
          isRefreshing={isRefreshing}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-7 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Metric Stat Cards (ERP Left-Border Style) */}
          {/* On mobile: horizontally swipeable row as requested */}
          <div className="flex overflow-x-auto gap-3 pb-2 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible no-scrollbar">
            <div className="min-w-[210px] sm:min-w-0 flex-1">
              <StatCard
                title="Documents Uploaded"
                value={stats.documents_uploaded}
                subtitle="Indexed in ChromaDB"
                color="blue"
                icon={FileText}
              />
            </div>
            <div className="min-w-[210px] sm:min-w-0 flex-1">
              <StatCard
                title="Tests Taken"
                value={stats.tests_taken}
                subtitle="Completed mock quizzes"
                color="green"
                icon={FileQuestion}
              />
            </div>
            <div className="min-w-[210px] sm:min-w-0 flex-1">
              <StatCard
                title="Avg Score"
                value={`${stats.avg_score}%`}
                subtitle="Accuracy benchmark"
                color="amber"
                icon={TrendingUp}
              />
            </div>
            <div className="min-w-[210px] sm:min-w-0 flex-1">
              <StatCard
                title="Topics Revised"
                value={stats.topics_revised}
                subtitle="One-shot sheets generated"
                color="purple"
                icon={Zap}
              />
            </div>
          </div>

          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Tool Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setCurrentTab('mock-test')}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileQuestion size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      Generate Mock Test
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Instant MCQs with instant feedback, explanations, and score tracking.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <span>Start Test</span>
                    <ArrowRight size={13} />
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentTab('revision')}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Zap size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                      One-Shot Revision
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      High-yield definitions, core points, and practice Q&amp;As exportable to PDF.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-700">
                    <span>Revise Topic</span>
                    <ArrowRight size={13} />
                  </div>
                </div>

                <div 
                  onClick={() => setCurrentTab('qa-chat')}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <MessageSquareText size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      Ask Questions (RAG Chat)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Chat with your notes and see exact document and page citations.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                    <span>Open Chat</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <DocumentUpload onUploaded={handleDocumentUploaded} />

              {/* Documents Directory Table */}
              <DocumentList
                documents={documents}
                onDeleted={handleDocumentDeleted}
                onSelectForQuiz={handleQuickQuiz}
                onSelectForRevision={handleQuickRevision}
              />
            </div>
          )}

          {/* TAB 2: MOCK TEST */}
          {currentTab === 'mock-test' && (
            <MockTestView
              documents={documents}
              preselectedDocId={preselectedDocId}
              onQuizFinished={loadAllData}
            />
          )}

          {/* TAB 3: ONE-SHOT REVISION */}
          {currentTab === 'revision' && (
            <RevisionView
              documents={documents}
              preselectedDocId={preselectedDocId}
              onRevisionGenerated={loadAllData}
            />
          )}

          {/* TAB 4: Q&A RAG CHAT */}
          {currentTab === 'qa-chat' && (
            <QAChatView
              documents={documents}
              preselectedDocId={preselectedDocId}
            />
          )}

          {/* TAB 5: MY ACCOUNT & USER MANAGEMENT */}
          {currentTab === 'account' && (
            <AccountView
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Instagram-Style Mobile Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        setTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Settings / LLM Provider Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdated={loadAllData}
      />
    </div>
  );
}
