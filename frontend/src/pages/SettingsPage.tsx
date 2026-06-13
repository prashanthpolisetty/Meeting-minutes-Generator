import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User, Bot, Mail, Mic, Palette,
  Save, Eye, EyeOff, CheckCircle2, Sun, Moon
} from 'lucide-react';

type Tab = 'profile' | 'ai' | 'email' | 'transcription' | 'appearance';

const SETTINGS_KEY = 'mom_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  catch { return {}; }
}
function saveSettings(data: object) {
  const prev = loadSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, ...data }));
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const saved = loadSettings();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved_ok, setSavedOk] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState(saved.displayName || user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

  // AI
  const [ollamaUrl, setOllamaUrl] = useState(saved.ollamaUrl || 'groq');
  const [ollamaModel, setOllamaModel] = useState(saved.ollamaModel || 'openai/gpt-oss-120b');
  const [summaryLevel, setSummaryLevel] = useState(saved.summaryLevel || 'detailed');
  const [outputLanguage, setOutputLanguage] = useState(saved.outputLanguage || 'English');

  // Email
  const [emailEnabled, setEmailEnabled] = useState(saved.emailEnabled ?? true);
  const [defaultEmail, setDefaultEmail] = useState(saved.defaultEmail || '');
  const [smtpHost, setSmtpHost] = useState(saved.smtpHost || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(saved.smtpPort || '587');
  const [smtpUser, setSmtpUser] = useState(saved.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(saved.smtpPass || '');
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Transcription
  const [whisperModel, setWhisperModel] = useState(saved.whisperModel || 'base');
  const [transcriptLang, setTranscriptLang] = useState(saved.transcriptLang || 'auto');

  const flash = () => {
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  };

  const handleSave = () => {
    saveSettings({
      displayName, ollamaUrl, ollamaModel, summaryLevel, outputLanguage,
      emailEnabled, defaultEmail, smtpHost, smtpPort, smtpUser, smtpPass,
      whisperModel, transcriptLang,
    });
    flash();
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',       label: 'Profile',       icon: User },
    { id: 'ai',            label: 'AI / LLM',       icon: Bot },
    { id: 'email',         label: 'Email',          icon: Mail },
    { id: 'transcription', label: 'Transcription',  icon: Mic },
    { id: 'appearance',    label: 'Appearance',     icon: Palette },
  ];

  const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600
    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    transition-all duration-200 text-sm`;

  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your account and application preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="lg:w-52 shrink-0 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${active
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Panel */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">

            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile</h2>

                <div>
                  <label className={labelCls}>Email Address</label>
                  <input className={inputCls} value={user?.email || ''} disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
                </div>

                <div>
                  <label className={labelCls}>Display Name</label>
                  <input className={inputCls} value={displayName}
                    onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Current Password</label>
                      <input className={inputCls} type="password" value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div>
                      <label className={labelCls}>New Password</label>
                      <div className="relative">
                        <input className={inputCls + ' pr-10'} type={showNewPass ? 'text' : 'password'}
                          value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters" />
                        <button type="button" onClick={() => setShowNewPass(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI / LLM ── */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI / LLM Settings</h2>

                <div>
                  <label className={labelCls}>Cloud LLM Provider</label>
                  <select className={inputCls} value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}>
                    <option value="groq">Groq Cloud API</option>
                    <option value="gemini">Google Gemini API</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">Configure keys securely inside your backend .env file.</p>
                </div>

                <div>
                  <label className={labelCls}>Cloud Model Name</label>
                  <select className={inputCls} value={ollamaModel} onChange={e => setOllamaModel(e.target.value)}>
                    <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Groq)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Groq)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Gemini)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">Select the active cloud model to summarize transcripts.</p>
                </div>

                <div>
                  <label className={labelCls}>Summary Detail Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['brief', 'detailed', 'extensive'] as const).map(level => (
                      <button key={level} type="button" onClick={() => setSummaryLevel(level)}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize
                          ${summaryLevel === level
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Output Language</label>
                  <select className={inputCls} value={outputLanguage} onChange={e => setOutputLanguage(e.target.value)}>
                    {['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Chinese', 'Japanese'].map(l => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── EMAIL ── */}
            {activeTab === 'email' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Email Notifications</h2>
                  <button type="button" onClick={() => setEmailEnabled(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                      ${emailEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300
                      ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className={`space-y-4 transition-opacity duration-200 ${emailEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <label className={labelCls}>Default Recipient Email</label>
                    <input className={inputCls} type="email" value={defaultEmail}
                      onChange={e => setDefaultEmail(e.target.value)} placeholder="team@example.com" />
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">SMTP Configuration</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>SMTP Host</label>
                        <input className={inputCls} value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                      </div>
                      <div>
                        <label className={labelCls}>Port</label>
                        <input className={inputCls} value={smtpPort}
                          onChange={e => setSmtpPort(e.target.value)} placeholder="587" />
                      </div>
                      <div>
                        <label className={labelCls}>Username</label>
                        <input className={inputCls} value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)} placeholder="you@gmail.com" />
                      </div>
                      <div>
                        <label className={labelCls}>Password / App Key</label>
                        <div className="relative">
                          <input className={inputCls + ' pr-10'} type={showSmtpPass ? 'text' : 'password'}
                            value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="••••••••" />
                          <button type="button" onClick={() => setShowSmtpPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TRANSCRIPTION ── */}
            {activeTab === 'transcription' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transcription Settings</h2>

                <div>
                  <label className={labelCls}>Whisper Model Size</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                    {[
                      { id: 'tiny',   label: 'Tiny',   sub: '~39M' },
                      { id: 'base',   label: 'Base',   sub: '~74M' },
                      { id: 'small',  label: 'Small',  sub: '~244M' },
                      { id: 'medium', label: 'Medium', sub: '~769M' },
                    ].map(m => (
                      <button key={m.id} type="button" onClick={() => setWhisperModel(m.id)}
                        className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all
                          ${whisperModel === m.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                          }`}>
                        <span className="font-semibold text-sm">{m.label}</span>
                        <span className="text-xs opacity-60 mt-0.5">{m.sub}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Larger models are more accurate but slower.</p>
                </div>

                <div>
                  <label className={labelCls}>Audio Language</label>
                  <select className={inputCls} value={transcriptLang} onChange={e => setTranscriptLang(e.target.value)}>
                    <option value="auto">Auto-detect</option>
                    {['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Chinese', 'Japanese'].map(l => (
                      <option key={l} value={l.toLowerCase()}>{l}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">Specifying the language improves accuracy.</p>
                </div>
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h2>

                <div>
                  <label className={labelCls}>Theme</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <button type="button" onClick={() => isDark && toggleTheme()}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all
                        ${!isDark
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <Sun className={`w-6 h-6 ${!isDark ? 'text-amber-500' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${!isDark ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}>Light Mode</p>
                        <p className="text-xs text-gray-400 mt-0.5">Clean & bright</p>
                      </div>
                    </button>

                    <button type="button" onClick={() => !isDark && toggleTheme()}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all
                        ${isDark
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}>
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <Moon className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold ${isDark ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-600'}`}>Dark Mode</p>
                        <p className="text-xs text-gray-400 mt-0.5">Easy on the eyes</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Live preview pill */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Currently using <span className="font-semibold">{isDark ? 'Dark' : 'Light'} Mode</span>. Changes apply instantly across the whole app.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Save footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-gray-400">Settings are saved locally on this device.</p>
            <button
              id="settings-save-btn"
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl
                         transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {saved_ok ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
