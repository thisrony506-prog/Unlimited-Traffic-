import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot as BotIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Wallet,
  CheckSquare,
  DollarSign,
  HelpCircle,
  Shield,
  FileText,
  User,
  Users,
  History as HistoryIcon,
  ListCheck,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';

interface SimulatedMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  replyKeyboard?: string[][];
  inlineKeyboard?: { text: string; callback_data?: string; url?: string }[][];
  timestamp: string;
}

export default function App() {
  const [botStatus, setBotStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<SimulatedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'simulator' | 'admin_testing' | 'deployment'>('simulator');
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
  }, [messages]);

  const sendTelegramUpdate = async (text: string, callbackData?: string) => {
    const userMsgId = Date.now().toString();
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

    // Construct Telegram Update Payload
    let updatePayload: any;

    if (callbackData) {
      updatePayload = {
        update_id: Math.floor(Math.random() * 1000000),
        callback_query: {
          id: `cb_${Date.now()}`,
          from: {
            id: 123456789,
            is_bot: false,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
          message: {
            message_id: 100,
            date: Math.floor(Date.now() / 1000),
            chat: { id: 123456789, type: 'private', first_name: 'John' },
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
            id: 123456789,
            is_bot: false,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
          chat: { id: 123456789, type: 'private', first_name: 'John' },
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
      if (data.responses && Array.isArray(data.responses) && data.responses.length > 0) {
        setMessages((prev) => [...prev, ...data.responses]);
      }
      await fetchStatus();
    } catch (err) {
      console.error('Error sending update:', err);
    }
  };

  // We can intercept bot messages sent via simulator for live preview
  useEffect(() => {
    // Poll or read status to update chat message output if available
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    sendTelegramUpdate(textToSend);
  };

  const executeCommand = (cmd: string) => {
    sendTelegramUpdate(cmd);
  };

  const approveSubmission = async (submissionId: string) => {
    try {
      const res = await fetch('/api/admin/approve-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Submission approved and reward credited!');
        fetchStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to approve submission');
    }
  };

  const processWithdrawal = async (withdrawalId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, status, reason: 'Reviewed by admin test suite' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Withdrawal ${status}!`);
        fetchStatus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to process withdrawal');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <BotIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">EarnFlow Telegram Bot</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Bot Engine Running
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Bot Username: <code className="text-cyan-400 font-mono">@{botStatus?.bot?.username || 'earnflowV3_bot'}</code> • Server: Port 3000
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStatus()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Status
          </button>
          <a
            href={`https://t.me/${botStatus?.bot?.username || 'earnflowV3_bot'}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs rounded-lg shadow-md transition flex items-center gap-2"
          >
            Open Telegram App
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              <div className="text-slate-400 text-xs font-medium mb-1">Total Users</div>
              <div className="text-xl font-bold text-white">{botStatus?.stats?.totalUsers || 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              <div className="text-slate-400 text-xs font-medium mb-1">Active Tasks</div>
              <div className="text-xl font-bold text-cyan-400">{botStatus?.stats?.totalTasks || 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              <div className="text-slate-400 text-xs font-medium mb-1">Pending Proofs</div>
              <div className="text-xl font-bold text-amber-400">{botStatus?.stats?.pendingSubmissions || 0}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              <div className="text-slate-400 text-xs font-medium mb-1">Pending Withdrawals</div>
              <div className="text-xl font-bold text-emerald-400">{botStatus?.stats?.pendingWithdrawals || 0}</div>
            </div>
          </div>

          {/* Quick Commands Navigation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Telegram Bot Command Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => executeCommand('/start')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-cyan-300 font-mono font-medium flex items-center justify-between group"
              >
                <span>/start</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/menu')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-cyan-300 font-mono font-medium flex items-center justify-between group"
              >
                <span>/menu</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/balance')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-emerald-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/balance</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/tasks')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-cyan-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/tasks</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/referral')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-purple-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/referral</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/withdraw')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-amber-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/withdraw</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/history')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-blue-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/history</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/profile')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-slate-300 font-mono font-medium flex items-center justify-between group"
              >
                <span>/profile</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition" />
              </button>
              <button
                onClick={() => executeCommand('/support')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-pink-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/support</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-400 transition" />
              </button>
              <button
                onClick={() => executeCommand('/rules')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-left transition text-indigo-400 font-mono font-medium flex items-center justify-between group"
              >
                <span>/rules</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
              </button>
            </div>
          </div>

          {/* Admin Verification Suite */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex-1">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Server Verification & Audit Tools
            </h3>

            {/* Submissions queue */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending Proof Submissions ({botStatus?.submissions?.filter((s: any) => s.status === 'pending').length || 0})
              </div>
              {botStatus?.submissions?.filter((s: any) => s.status === 'pending').length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">No pending task proofs. Submit a task in Telegram to test approval!</div>
              ) : (
                botStatus?.submissions
                  ?.filter((s: any) => s.status === 'pending')
                  .map((sub: any) => (
                    <div key={sub.submissionId} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs space-y-2">
                      <div className="flex justify-between font-medium text-slate-200">
                        <span>{sub.taskTitle || sub.taskId}</span>
                        <span className="text-emerald-400 font-bold">৳{sub.rewardAmount}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] truncate font-mono">
                        User ID: {sub.userId} • Proof: {sub.proofText || sub.proofFileId || 'Submitted'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveSubmission(sub.submissionId)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition"
                        >
                          Approve & Pay Reward
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection:', 'Invalid proof');
                            if (reason) {
                              fetch('/api/admin/reject-submission', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ submissionId: sub.submissionId, reason }),
                              }).then(() => fetchStatus());
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded font-medium text-[11px] transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
              )}

              {/* Withdrawals Queue */}
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-800">
                Pending Withdrawals ({botStatus?.withdrawals?.filter((w: any) => w.status === 'pending').length || 0})
              </div>
              {botStatus?.withdrawals?.filter((w: any) => w.status === 'pending').length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">No pending withdrawals. Request a withdrawal in Telegram to test processing!</div>
              ) : (
                botStatus?.withdrawals
                  ?.filter((w: any) => w.status === 'pending')
                  .map((wdr: any) => (
                    <div key={wdr.withdrawalId} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs space-y-2">
                      <div className="flex justify-between font-medium text-slate-200">
                        <span>{wdr.method} ({wdr.account})</span>
                        <span className="text-amber-400 font-bold">৳{wdr.amount}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        User: {wdr.userId} • ID: {wdr.withdrawalId}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => processWithdrawal(wdr.withdrawalId, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition"
                        >
                          Approve Payout
                        </button>
                        <button
                          onClick={() => processWithdrawal(wdr.withdrawalId, 'rejected')}
                          className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded font-medium text-[11px] transition"
                        >
                          Reject & Refund
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right Phone Simulator Container */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[740px]">
            {/* Telegram Header */}
            <div className="bg-slate-800/90 px-4 py-3 flex items-center justify-between border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow">
                  EF
                </div>
                <div>
                  <div className="font-semibold text-slate-100 text-sm">EarnFlow Bot</div>
                  <div className="text-[11px] text-cyan-400">bot • @{botStatus?.bot?.username || 'earnflowV3_bot'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[11px] text-slate-400 font-mono">Online</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 font-sans text-sm">
              <div className="text-center my-2">
                <span className="px-3 py-1 bg-slate-800/60 rounded-full text-[11px] text-slate-400 border border-slate-700/50">
                  Telegram Bot Session Simulator
                </span>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm whitespace-pre-line text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.inlineKeyboard && (
                    <div className="mt-1.5 space-y-1 w-full max-w-[85%]">
                      {msg.inlineKeyboard.map((row: any[], rIdx: number) => (
                        <div key={rIdx} className="flex gap-1.5 flex-wrap">
                          {row.map((btn: any, bIdx: number) => (
                            <button
                              key={bIdx}
                              onClick={() => sendTelegramUpdate(btn.text, btn.callback_data)}
                              className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700/90 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium transition text-center shadow-sm"
                            >
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Persistent Reply Keyboard Controls */}
            <div className="bg-slate-900 border-t border-slate-800 p-2 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 px-2 flex items-center justify-between">
                <span>Telegram Main Reply Keyboard</span>
                <span className="text-[10px] text-cyan-400">Interactive</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
                <button
                  onClick={() => sendTelegramUpdate('💰 My Balance')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  💰 My Balance
                </button>
                <button
                  onClick={() => sendTelegramUpdate('📋 Available Tasks')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  📋 Available Tasks
                </button>
                <button
                  onClick={() => sendTelegramUpdate('✅ My Tasks')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  ✅ My Tasks
                </button>
                <button
                  onClick={() => sendTelegramUpdate('👥 Referral')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  👥 Referral
                </button>
                <button
                  onClick={() => sendTelegramUpdate('💸 Withdraw')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  💸 Withdraw
                </button>
                <button
                  onClick={() => sendTelegramUpdate('📊 History')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  📊 History
                </button>
                <button
                  onClick={() => sendTelegramUpdate('👤 Profile')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => sendTelegramUpdate('🎧 Support')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 rounded-lg border border-slate-700/60 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  🎧 Support
                </button>
              </div>
              <button
                onClick={() => sendTelegramUpdate('📜 Rules')}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700/90 text-slate-200 text-xs rounded-lg border border-slate-700/60 transition font-medium"
              >
                📜 Rules
              </button>
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type a command (/start, /balance) or text proof..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                type="submit"
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition flex items-center justify-center shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
