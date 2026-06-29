import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingApi } from '../services/api';
import { ChevronLeft, FileText, Mic, CheckSquare, Clock, Users, RefreshCw, Mail, Bot, Award } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function MeetingDetails() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'action_items' | 'comparison'>('summary');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'success' | 'error' | null>(null);

  const handleSendEmail = async () => {
    if (!id) return;
    try {
      setIsSendingEmail(true);
      setEmailStatus(null);
      await meetingApi.resendEmail(id);
      setEmailStatus('success');
      setTimeout(() => setEmailStatus(null), 3000);
    } catch (error) {
      console.error('Failed to send email', error);
      setEmailStatus('error');
      setTimeout(() => setEmailStatus(null), 3000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const fetchMeeting = async () => {
    if (!id) return;
    try {
      if (!isRefreshing) setIsLoading(true);
      const response = await meetingApi.getOne(id);
      setMeeting(response.data);
    } catch (error) {
      console.error('Failed to fetch meeting', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchMeeting(); }, [id]);

  // Auto-poll until completed/failed
  useEffect(() => {
    let intervalId: any;
    if (meeting && meeting.status !== 'completed' && meeting.status !== 'failed') {
      intervalId = setInterval(() => {
        if (id) {
          meetingApi.getOne(id)
            .then(r => setMeeting(r.data))
            .catch(err => console.error('Auto-refresh poll error:', err));
        }
      }, 3000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [meeting?.status, id]);

  const handleRefresh = () => { setIsRefreshing(true); fetchMeeting(); };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="h-3 w-3 bg-indigo-300 dark:bg-indigo-600 rounded-full" />
          <div className="h-3 w-3 bg-indigo-400 dark:bg-indigo-500 rounded-full" />
          <div className="h-3 w-3 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Meeting not found</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The meeting you're looking for doesn't exist.</p>
        <Link to="/history" className="mt-4 inline-flex items-center text-brand-600 dark:text-indigo-400 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to History
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'summary' as const,      name: 'Executive Summary',       icon: FileText },
    ...(meeting.candidates && meeting.candidates.length > 0 ? [{ id: 'comparison' as const, name: 'AI Comparison', icon: Bot }] : []),
    { id: 'transcript' as const,   name: 'Full Transcript',          icon: Mic },
    { id: 'action_items' as const, name: 'Action Items & Decisions', icon: CheckSquare },
  ];

  const sc =
    meeting.status === 'completed'
      ? { badge: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', dot: 'bg-green-500' }
      : meeting.status === 'failed'
        ? { badge: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', dot: 'bg-red-500' }
        : { badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500 animate-pulse' };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          to="/history"
          className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to meetings
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{meeting.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">

              {/* Date pill */}
              <div className="flex items-center bg-white dark:bg-gray-700 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="dark:text-gray-300">{new Date().toLocaleDateString()}</span>
              </div>

              {/* Participants pill */}
              {meeting.participants?.length > 0 && (
                <div className="flex items-center bg-white dark:bg-gray-700 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <Users className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                  <span className="dark:text-gray-300">{meeting.participants.join(', ')}</span>
                </div>
              )}

              {/* Status badge */}
              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1.5 shadow-sm border ${sc.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {meeting.status}
              </span>
            </div>
          </div>

          {/* Refresh button (processing) */}
          {meeting.status !== 'completed' && meeting.status !== 'failed' && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center px-4 py-2
                         bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                         rounded-xl shadow-sm text-sm font-semibold
                         text-gray-700 dark:text-gray-200
                         hover:bg-gray-50 dark:hover:bg-gray-600
                         transition-colors disabled:opacity-50"
            >
              <RefreshCw className={twMerge(clsx('w-4 h-4 mr-2', isRefreshing && 'animate-spin'))} />
              Refresh Status
            </button>
          )}

          {/* Send email button (completed) */}
          {meeting.status === 'completed' && meeting.participants?.length > 0 && (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex items-center justify-center px-4 py-2
                           bg-brand-600 hover:bg-brand-700 border border-transparent
                           rounded-xl shadow-sm text-sm font-semibold text-white
                           transition-colors disabled:opacity-50"
              >
                {isSendingEmail
                  ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  : <Mail className="w-4 h-4 mr-2" />
                }
                Send Email
              </button>
              {emailStatus === 'success' && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Email sent!</span>
              )}
              {emailStatus === 'error' && (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">Failed to send email</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Processing banner ────────────────────────────────────────────── */}
      {meeting.status !== 'completed' && meeting.status !== 'failed' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-9 h-9 text-amber-500 dark:text-amber-400 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300">Processing in Progress</h3>
          <p className="text-amber-700 dark:text-amber-400/80 mt-2 max-w-md">
            Our AI is currently transcribing and summarizing this meeting. Check back in a minute.
          </p>
        </div>
      )}

      {/* ── Failed banner ────────────────────────────────────────────────── */}
      {meeting.status === 'failed' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Processing Failed</h3>
          <p className="text-red-700 dark:text-red-400/80 mt-2 max-w-md">
            There was an error processing this meeting. Please try uploading again.
          </p>
        </div>
      )}

      {/* ── Completed: tabbed content ───────────────────────────────────── */}
      {meeting.status === 'completed' && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden transition-colors duration-300">

          {/* Tab bar */}
          <div className="border-b border-gray-200 dark:border-gray-700 flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={twMerge(clsx(
                  'flex-1 md:flex-none flex items-center justify-center px-8 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-brand-500 dark:border-indigo-400 text-brand-600 dark:text-indigo-400 bg-brand-50/50 dark:bg-indigo-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                ))}
              >
                <tab.icon className={twMerge(clsx(
                  'w-4 h-4 mr-2',
                  activeTab === tab.id ? 'text-brand-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                ))} />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-8">

            {/* Summary */}
            {activeTab === 'summary' && (
              <div>
                {meeting.agenda && (
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Agenda</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-semibold">{meeting.agenda}</p>
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Summary</h3>
                {meeting.summary ? (
                  <div
                    className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: meeting.summary.replace(/\\n/g, '<br/>') }}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No summary available.</p>
                )}
              </div>
            )}

            {/* AI Comparison */}
            {activeTab === 'comparison' && meeting.candidates && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {meeting.candidates.map((c: any, index: number) => {
                    const isBest = index === meeting.best_candidate_index;
                    return (
                      <div key={index} className={clsx(
                        "border rounded-2xl p-6 transition-all relative flex flex-col justify-between",
                        isBest 
                          ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 shadow-md ring-2 ring-indigo-500/20"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      )}>
                        {isBest && (
                          <span className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                            <Award className="w-3.5 h-3.5" /> Best Choice
                          </span>
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              {c.model_name}
                            </h4>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-600">
                              {c.provider.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            {c.agenda && (
                              <div>
                                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Agenda</h5>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
                                  {c.agenda}
                                </p>
                              </div>
                            )}

                            <div>
                              <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Summary</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {c.summary}
                              </p>
                            </div>
                            
                            {c.key_decisions && c.key_decisions.length > 0 && (
                              <div>
                                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Key Decisions</h5>
                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {c.key_decisions.map((d: string, idx: number) => (
                                    <li key={idx}>{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {c.action_items && c.action_items.length > 0 && (
                              <div>
                                <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Action Items</h5>
                                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {c.action_items.map((item: any, idx: number) => {
                                    const text = typeof item === 'object' ? item.task : item;
                                    return <li key={idx}>{text}</li>;
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Transcript */}
            {activeTab === 'transcript' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transcript</h3>
                {meeting.transcript ? (
                  <div className="bg-gray-50 dark:bg-gray-700/60 p-6 rounded-xl border border-gray-100 dark:border-gray-600
                                  text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed
                                  whitespace-pre-wrap h-96 overflow-y-auto">
                    {meeting.transcript}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No transcript available.</p>
                )}
              </div>
            )}

            {/* Action items & decisions */}
            {activeTab === 'action_items' && (
              <div className="space-y-8">

                {/* Key decisions */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Key Decisions</h3>
                  {meeting.key_decisions?.length > 0 ? (
                    <ul className="space-y-3">
                      {meeting.key_decisions.map((decision: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full
                                          bg-brand-100 dark:bg-indigo-900/50
                                          flex items-center justify-center
                                          text-brand-600 dark:text-indigo-400
                                          font-bold text-xs mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="ml-3 text-gray-700 dark:text-gray-300">{decision}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No key decisions recorded.</p>
                  )}
                </div>

                {/* Action items */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Action Items</h3>
                  {meeting.action_items?.length > 0 ? (
                    <div className="space-y-3">
                      {meeting.action_items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600
                                     p-4 rounded-xl shadow-sm flex items-start gap-4 transition-colors"
                        >
                          <div className="mt-0.5">
                            <CheckSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.task || item}</p>
                            {item.assignee && (
                              <p className="text-sm mt-1">
                                <span className="text-gray-500 dark:text-gray-400">Assigned to:</span>{' '}
                                <span className="font-medium text-brand-600 dark:text-indigo-400">{item.assignee}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No action items found.</p>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
