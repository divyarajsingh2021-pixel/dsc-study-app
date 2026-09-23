import React, { useState, useEffect } from 'react';
import { 
  FileQuestion, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  Trophy, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQuiz, submitQuizResult } from '../api';

export default function MockTestView({ documents, preselectedDocId, onQuizFinished }) {
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || '');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quiz active state
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qIdx]: optionIdx }
  const [isAnswerRevealed, setIsAnswerRevealed] = useState({}); // { [qIdx]: boolean }
  const [quizFinished, setQuizFinished] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    if (preselectedDocId) {
      setSelectedDocId(preselectedDocId);
    } else if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, preselectedDocId]);

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      setError('Please select a document to generate questions from.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await generateQuiz(selectedDocId, topic, numQuestions);
      if (!res.questions || res.questions.length === 0) {
        throw new Error('No questions could be generated from this material. Try another topic or document.');
      }
      setQuizData(res);
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setIsAnswerRevealed({});
      setQuizFinished(false);
      setReviewMode(false);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optIdx) => {
    if (isAnswerRevealed[currentQuestionIdx]) return; // already answered

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optIdx,
    }));
    setIsAnswerRevealed((prev) => ({
      ...prev,
      [currentQuestionIdx]: true,
    }));
  };

  const currentQ = quizData?.questions?.[currentQuestionIdx];
  const totalQ = quizData?.questions?.length || 0;
  const isLastQuestion = currentQuestionIdx === totalQ - 1;
  const isCurrentAnswered = isAnswerRevealed[currentQuestionIdx] !== undefined;

  // Calculate score
  const score = Object.entries(selectedAnswers).reduce((acc, [qIdx, ansIdx]) => {
    const q = quizData?.questions?.[parseInt(qIdx, 10)];
    return q && q.correct_answer === ansIdx ? acc + 1 : acc;
  }, 0);

  const handleNext = async () => {
    if (isLastQuestion) {
      setQuizFinished(true);
      if (score / totalQ >= 0.6) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
      // Record score in backend
      try {
        await submitQuizResult(quizData.quiz_id, quizData.document_id, score, totalQ);
        if (onQuizFinished) onQuizFinished();
      } catch (e) {
        console.error('Failed to submit score:', e);
      }
    } else {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setQuizData(null);
    setQuizFinished(false);
    setReviewMode(false);
    setSelectedAnswers({});
    setIsAnswerRevealed({});
    setCurrentQuestionIdx(0);
  };

  // If no documents exist
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">No study documents available</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Please upload at least one PDF notes or textbook file in the Dashboard before generating mock tests.
        </p>
      </div>
    );
  }

  // 1. QUIZ GENERATOR FORM
  if (!quizData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileQuestion size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Generate AI Mock Test</h2>
              <p className="text-xs text-slate-500">
                Create multiple choice questions grounded strictly in your uploaded notes
              </p>
            </div>
          </div>

          <form onSubmit={handleStartQuiz} className="space-y-4">
            {/* Document selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Study Document <span className="text-red-500">*</span>
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

            {/* Optional Topic input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chapter / Focus Topic <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Critical Section, Semaphores, Deadlocks..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave empty for a comprehensive test spanning the whole document.
              </p>
            </div>

            {/* Number of questions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 15].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                      numQuestions === num
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {num} MCQs
                  </button>
                ))}
              </div>
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
                    <span>Generating Questions with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Mock Test &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. QUIZ FINISHED / SCORE SUMMARY
  if (quizFinished && !reviewMode) {
    const percentage = Math.round((score / totalQ) * 100);
    const passed = percentage >= 60;

    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className={passed ? 'text-amber-500' : 'text-blue-600'} />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mock Test Completed
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            {passed ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Document: {quizData.document_name}
          </p>

          {/* Score Display Card */}
          <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-4xl font-black text-slate-900 tracking-tight">
              {score} <span className="text-xl font-normal text-slate-400">/ {totalQ}</span>
            </div>
            <div className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-blue-600">
              {percentage}% Accuracy
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {percentage >= 80
                ? 'Outstanding performance! You have grasped the key concepts thoroughly.'
                : percentage >= 60
                ? 'Good effort! Review the questions you missed to reinforce your understanding.'
                : 'Review the lecture notes and try again to boost your score.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setReviewMode(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              Review All Answers
            </button>
            <button
              onClick={handleRestart}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Take Another Test</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. REVIEW MODE
  if (reviewMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900">Quiz Review</h3>
            <p className="text-xs text-slate-500">
              Score: {score}/{totalQ} ({Math.round((score / totalQ) * 100)}%) • {quizData.document_name}
            </p>
          </div>
          <button
            onClick={handleRestart}
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            New Test
          </button>
        </div>

        <div className="space-y-4">
          {quizData.questions.map((q, idx) => {
            const userAns = selectedAnswers[idx];
            const isCorrect = userAns === q.correct_answer;
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-5 shadow-sm ${
                  isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-900">{q.question}</p>
                </div>

                <div className="space-y-2 ml-8">
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = userAns === optIdx;
                    const isRightOption = q.correct_answer === optIdx;

                    let optStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isRightOption) {
                      optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                    } else if (isUserPick && !isCorrect) {
                      optStyle = 'bg-rose-50 border-rose-300 text-rose-900';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optStyle}`}
                      >
                        <span>
                          <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                        </span>
                        {isRightOption && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Correct
                          </span>
                        )}
                        {isUserPick && !isRightOption && (
                          <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                            <XCircle size={13} /> Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="mt-3 ml-8 p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-slate-700">
                  <strong className="text-blue-900 font-semibold flex items-center gap-1 mb-0.5">
                    <HelpCircle size={13} /> Explanation:
                  </strong>
                  <p>{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. ACTIVE TEST TAKING (One question at a time with instant feedback)
  const userAns = selectedAnswers[currentQuestionIdx];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Progress Bar & Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">
              Question {currentQuestionIdx + 1} of {totalQ}
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[160px] sm:max-w-xs">
              {quizData.topic || quizData.document_name}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Score: <strong className="text-blue-600 font-bold">{score}</strong> / {totalQ}
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-200"
            style={{ width: `${((currentQuestionIdx + 1) / totalQ) * 100}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="p-6 sm:p-7">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-5">
            {currentQ?.question}
          </h3>

          {/* 4 Options */}
          <div className="space-y-2.5">
            {currentQ?.options.map((optText, optIdx) => {
              const isSelected = userAns === optIdx;
              const isCorrectOpt = currentQ.correct_answer === optIdx;

              let btnClass = 'border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-800';
              if (isCurrentAnswered) {
                if (isCorrectOpt) {
                  btnClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400';
                } else {
                  btnClass = 'opacity-50 border-slate-200 text-slate-500';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isCurrentAnswered}
                  className={`w-full p-3.5 rounded-lg border text-left text-sm font-medium transition-all flex items-start gap-3 ${btnClass}`}
                >
                  <span className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center text-xs font-bold shrink-0 text-slate-700">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1 mt-0.5">{optText}</span>
                  {isCurrentAnswered && isCorrectOpt && (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isCurrentAnswered && isSelected && !isCorrectOpt && (
                    <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Instant Right/Wrong Feedback + Grounded Explanation */}
          {isCurrentAnswered && (
            <div className={`mt-5 p-4 rounded-lg border text-xs transition-all ${
              userAns === currentQ.correct_answer 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="font-bold mb-1 flex items-center gap-1.5">
                {userAns === currentQ.correct_answer ? (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>Correct Answer!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} className="text-rose-600" />
                    <span>Incorrect — The correct answer is Option {String.fromCharCode(65 + currentQ.correct_answer)}</span>
                  </>
                )}
              </div>
              <p className="text-slate-700 mt-1 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleRestart}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel Quiz
            </button>

            {isCurrentAnswered ? (
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all"
              >
                <span>{isLastQuestion ? 'Finish Test & See Results' : 'Next Question'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Select an answer to reveal feedback
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
