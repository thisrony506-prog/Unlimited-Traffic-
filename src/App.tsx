import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot as BotIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Globe,
  PlusCircle,
  CreditCard,
  Gift,
  Users,
  Wallet,
  BarChart3,
  History as HistoryIcon,
  Headphones,
  Sparkles,
  Zap,
  Info,
  Clock,
  Check,
  Tv,
  Smartphone,
} from 'lucide-react';
import { MiniAppView } from './components/MiniAppView';

interface SimulatedMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  replyKeyboard?: string[][];
  inlineKeyboard?: { text: string; callback_data?: string; url?: string }[][];
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'bot' | 'miniapp'>('bot');
  const [botStatus, setBotStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<SimulatedMessage[]>([]);
  const [activeReplyKeyboard, setActiveReplyKeyboard] = useState<string[][] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeVisitTimer, setActiveVisitTimer] = useState<{
    visitId: string;
    url: string;
    secondsLeft: number;
    totalSeconds: number;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setBotStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Initialize simulator with /start command
    sendTelegramUpdate('/start');
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeVisitTimer]);

  // Active visit countdown timer
  useEffect(() => {
    if (!activeVisitTimer || activeVisitTimer.secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setActiveVisitTimer((prev) => {
        if (!prev || prev.secondsLeft <= 1) {
          return prev ? { ...prev, secondsLeft: 0 } : null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeVisitTimer]);

  const sendTelegramUpdate = async (text: string, callbackData?: string) => {
    const userMsgId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!callbackData) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text,
          timestamp,
        },
      ]);
    }

    let updatePayload: any;

    if (callbackData) {
      updatePayload = {
        update_id: Math.floor(Math.random() * 1000000),
        callback_query: {
          id: `cb_${Date.now()}`,
          from: {
            id: 88776655,
            is_bot: false,
            first_name: 'Alex',
            last_name: 'Rivera',
            username: 'alex_web',
          },
          message: {
            message_id: 100,
            date: Math.floor(Date.now() / 1000),
            chat: { id: 88776655, type: 'private', first_name: 'Alex' },
            text: 'Previous message',
          },
          data: callbackData,
        },
      };
    } else {
      updatePayload = {
        update_id: Math.floor(Math.random() * 1000000),
        message: {
          message_id: Math.floor(Math.random() * 1000),
          from: {
            id: 88776655,
            is_bot: false,
            first_name: 'Alex',
            last_name: 'Rivera',
            username: 'alex_web',
          },
          chat: { id: 88776655, type: 'private', first_name: 'Alex' },
          date: Math.floor(Date.now() / 1000),
          text: text,
        },
      };
    }

    try {
      const res = await fetch('/api/simulator/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();

      if (data.responses && data.responses.length > 0) {
        data.responses.forEach((resp: any) => {
          setMessages((prev) => [...prev, resp]);
          if (resp.replyKeyboard && resp.replyKeyboard.length > 0) {
            setActiveReplyKeyboard(resp.replyKeyboard);
          }

          // Check if visit started
          if (resp.text.includes('Visit Started') && resp.inlineKeyboard) {
            // Find verify button
            let visitId = '';
            let targetUrl = 'https://techradar.com';
            resp.inlineKeyboard.forEach((row: any) => {
              row.forEach((btn: any) => {
                if (btn.callback_data && btn.callback_data.startsWith('visit_verify_')) {
                  visitId = btn.callback_data.replace('visit_verify_', '');
                }
                if (btn.url) {
                  targetUrl = btn.url;
                }
              });
            });
            if (visitId) {
              const match = resp.text.match(/Required time:\*?\s*(\d+)/i) || resp.text.match(/(\d+)\s*seconds/i);
              const durationSecs = match ? parseInt(match[1], 10) : 20;
              setActiveVisitTimer({
                visitId,
                url: targetUrl,
                secondsLeft: durationSecs,
                totalSeconds: durationSecs,
              });
            }
          }

          // Check if verified
          if (resp.text.includes('Visit Verified') || resp.text.includes('No Credit was added')) {
            setActiveVisitTimer(null);
          }
        });
      }
      fetchStatus();
    } catch (err) {
      console.error('Simulator error:', err);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    sendTelegramUpdate(text);
  };

  const handleCopyWebhook = () => {
    if (botStatus?.webhook?.endpoint) {
      navigator.clipboard.writeText(botStatus.webhook.endpoint);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Helper parser for markdown-like Telegram text
  const renderFormattedText = (raw: string) => {
    if (!raw) return null;
    const lines = raw.split('\n');
    return (
      <div className="space-y-1 text-sm sm:text-base leading-relaxed text-slate-100">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // Format bold *text* and code `text`
          const parts = line.split(/(\*[^*]+\*|`[^`]+`)/g);

          return (
            <div key={idx}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('*') && part.endsWith('*')) {
                  return (
                    <strong key={pIdx} className="font-bold text-cyan-300">
                      {part.slice(1, -1)}
                    </strong>
                  );
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code
                      key={pIdx}
                      className="bg-slate-900/90 text-amber-300 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono border border-slate-700/60"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                  return (
                    <em key={pIdx} className="text-slate-400 italic">
                      {part.slice(1, -1)}
                    </em>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Telegram Bot System Status Bar */}
      <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              IH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  InfiniteHits
                  <span className="text-xs font-normal text-cyan-400">@InfiniteHits_bot</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Active Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                More Hits. More Growth. Infinite Possibilities. • Telegram Bot Only
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <div>
                <span className="text-slate-400">Welcome Bonus:</span>{' '}
                <span className="font-bold text-amber-400">🎁 50 Credits</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div>
                <span className="text-slate-400">Active Campaigns:</span>{' '}
                <span className="font-bold text-cyan-400">{botStatus?.stats?.activeCampaigns ?? 3}</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div>
                <span className="text-slate-400">Completed Visits:</span>{' '}
                <span className="font-bold text-emerald-400">{botStatus?.stats?.completedVisits ?? 710}</span>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              title="Refresh State"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Telegram App View Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4 flex flex-col space-y-3">
        {/* Navigation Tabs between Bot Engine and Mini App */}
        <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('bot')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bot'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BotIcon className="w-4 h-4" />
              🤖 Telegram Bot Chat
            </button>
            <button
              onClick={() => setActiveTab('miniapp')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'miniapp'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              📱 Telegram Mini App (Monetag Ads)
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                Earn +5
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>Monetag Zone: <code className="text-cyan-300 font-mono">8839201</code></span>
          </div>
        </div>

        {activeTab === 'miniapp' ? (
          <div className="py-2">
            <MiniAppView onBackToBot={() => setActiveTab('bot')} />
          </div>
        ) : (
          /* Telegram Chat Mockup */
          <div className="flex-1 flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden min-h-[680px]">
            {/* Telegram Header */}
          <div className="bg-slate-800/95 px-4 py-3 flex items-center justify-between border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow">
                  IH
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-slate-800" />
              </div>
              <div>
                <div className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
                  InfiniteHits Bot
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">bot</span>
                </div>
                <div className="text-[11px] text-cyan-400">@{botStatus?.bot?.username || 'InfiniteHits_bot'} • 50 Free Credits</div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => sendTelegramUpdate('/start')}
                className="px-2.5 py-1 text-xs bg-slate-700/80 hover:bg-slate-600 rounded-md font-medium text-slate-200 transition border border-slate-600/60"
              >
                /start
              </button>
              <button
                onClick={() => sendTelegramUpdate('/menu')}
                className="px-2.5 py-1 text-xs bg-cyan-600/80 hover:bg-cyan-500 rounded-md font-medium text-white transition shadow-sm"
              >
                /menu
              </button>
            </div>
          </div>

          {/* Chat Messages Timeline */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90">
            {messages.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <BotIcon className="w-8 h-8 text-slate-600 animate-bounce" />
                Connecting to InfiniteHits Telegram Bot engine...
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3 shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-xs'
                      : 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/70'
                  }`}
                >
                  {/* Sender Header */}
                  {msg.sender === 'bot' && (
                    <div className="text-[11px] font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> InfiniteHits
                    </div>
                  )}

                  {/* Message Body */}
                  {renderFormattedText(msg.text)}

                  {/* Inline Keyboard (Buttons inside message) */}
                  {msg.inlineKeyboard && msg.inlineKeyboard.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
                      {msg.inlineKeyboard.map((row, rIdx) => (
                        <div key={rIdx} className="flex flex-wrap gap-1.5">
                          {row.map((btn, bIdx) => {
                            if (btn.url) {
                              if (btn.url.includes('/miniapp')) {
                                return (
                                  <button
                                    key={bIdx}
                                    onClick={() => setActiveTab('miniapp')}
                                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-xl shadow-md transition-all active:scale-95"
                                  >
                                    <Smartphone className="w-3.5 h-3.5" />
                                    {btn.text}
                                  </button>
                                );
                              }
                              return (
                                <a
                                  key={bIdx}
                                  href={btn.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 bg-slate-900/90 hover:bg-slate-800 hover:text-white rounded-xl border border-cyan-500/40 transition shadow-sm hover:border-cyan-400"
                                >
                                  {btn.text}
                                  <ExternalLink className="w-3 h-3 opacity-70" />
                                </a>
                              );
                            }
                            return (
                              <button
                                key={bIdx}
                                onClick={() => {
                                  if (btn.callback_data) {
                                    sendTelegramUpdate('', btn.callback_data);
                                  }
                                }}
                                className="flex-1 min-w-[120px] inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl border border-slate-600/70 hover:border-slate-500 transition shadow-sm active:scale-95"
                              >
                                {btn.text}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] text-right mt-1.5 ${
                      msg.sender === 'user' ? 'text-blue-200/80' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp || 'Just now'}
                  </div>
                </div>
              </div>
            ))}

            {/* Interactive Visit Countdown Notification Card */}
            {activeVisitTimer && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 max-w-[85%] mx-auto shadow-lg backdrop-blur text-center space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock className="w-4 h-4 animate-spin" />
                  Website Visit In Progress ({activeVisitTimer.secondsLeft}s remaining)
                </div>
                <p className="text-xs text-slate-300">
                  Stay on <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">{activeVisitTimer.url}</code> for at least 20 seconds.
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <a
                    href={activeVisitTimer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Website Tab
                  </a>
                  <button
                    onClick={() => sendTelegramUpdate('', `visit_verify_${activeVisitTimer.visitId}`)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold shadow-md transition ${
                      activeVisitTimer.secondsLeft <= 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {activeVisitTimer.secondsLeft <= 0 ? 'Verify Visit Now (+1 Credit)' : `Verify (${activeVisitTimer.secondsLeft}s)`}
                  </button>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Command Shortcuts Toolbar */}
          <div className="px-3 py-1.5 bg-slate-800/70 border-t border-slate-700/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-1 flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-cyan-400" /> Commands:
            </span>
            {[
              { cmd: '/traffic', label: '🌐 Get Traffic' },
              { cmd: '/promote', label: '➕ Promote' },
              { cmd: '/packages', label: '💳 Buy Credits' },
              { cmd: '/earn', label: '🎁 Earn' },
              { cmd: '/daily', label: '🎉 Daily Bonus' },
              { cmd: '/referral', label: '👥 Referral' },
              { cmd: '/balance', label: '💰 Balance' },
              { cmd: '/mycampaigns', label: '📊 My Campaigns' },
              { cmd: '/stats', label: '📈 Stats' },
              { cmd: '/history', label: '📜 History' },
              { cmd: '/profile', label: '👤 Profile' },
              { cmd: '/support', label: '🎧 Support' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => sendTelegramUpdate(item.cmd)}
                className="shrink-0 px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700/60 transition"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Persistent Telegram Reply Keyboard */}
          <div className="p-3 bg-slate-900 border-t border-slate-800/90 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => sendTelegramUpdate('🌐 Get Traffic')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <Globe className="w-3.5 h-3.5" /> 🌐 Get Traffic
              </button>
              <button
                onClick={() => sendTelegramUpdate('➕ Promote Website')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" /> ➕ Promote Website
              </button>
              <button
                onClick={() => sendTelegramUpdate('💳 Buy Credits')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <CreditCard className="w-3.5 h-3.5" /> 💳 Buy Credits
              </button>
              <button
                onClick={() => sendTelegramUpdate('🎁 Earn Credits')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <Gift className="w-3.5 h-3.5" /> 🎁 Earn Credits
              </button>
              <button
                onClick={() => sendTelegramUpdate('👥 Referral')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <Users className="w-3.5 h-3.5" /> 👥 Referral
              </button>
              <button
                onClick={() => sendTelegramUpdate('💰 My Balance')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5" /> 💰 My Balance
              </button>
              <button
                onClick={() => sendTelegramUpdate('📊 Statistics')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <BarChart3 className="w-3.5 h-3.5" /> 📊 Statistics
              </button>
              <button
                onClick={() => sendTelegramUpdate('🎧 Support')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl border border-slate-700/70 shadow-sm transition active:scale-95"
              >
                <Headphones className="w-3.5 h-3.5" /> 🎧 Support
              </button>
            </div>

            {/* Text Input Box */}
            <form onSubmit={handleSend} className="flex gap-2 items-center pt-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a message, website URL, TrxID, or command..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl shadow-md transition active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        )}

        {/* Telegram Bot Live Production Setup Guide Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" /> Real Telegram Connection & Status
            </div>
            <div className="flex items-center gap-2">
              {botStatus?.bot?.isPolling ? (
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Long Polling Active (Listening live)
                </span>
              ) : botStatus?.webhook?.currentUrl ? (
                <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Webhook Mode Active
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Engine Ready
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Telegram Bot Status:</span>
                <span className="text-cyan-300 font-bold">@{botStatus?.bot?.username || 'InfiniteHits_bot'}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {botStatus?.bot?.isPolling
                  ? 'বটটি Telegram Long Polling এর মাধ্যমে চালু আছে এবং মেসেজের সাথে সাথে স্বয়ংক্রিয়ভাবে রেসপন্স করবে।'
                  : botStatus?.bot?.pollingError
                  ? `Notice: ${botStatus.bot.pollingError}`
                  : 'Bot engine is running and ready for updates.'}
              </div>
              <div className="pt-1 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/telegram/start-polling', { method: 'POST' });
                      fetchStatus();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg transition active:scale-95 shadow-sm"
                >
                  🔄 Restart Long Polling
                </button>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <div className="text-slate-400 font-medium">Telegram Webhook Endpoint:</div>
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-cyan-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                <span className="truncate">{botStatus?.webhook?.endpoint || 'https://.../api/telegram/webhook'}</span>
                <button
                  onClick={handleCopyWebhook}
                  className="text-slate-400 hover:text-white shrink-0 p-1"
                  title="Copy webhook URL"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[10px] text-slate-400">
                Environment: <code className="text-amber-300">TELEGRAM_BOT_TOKEN</code> configured.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
