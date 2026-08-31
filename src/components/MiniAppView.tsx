import React, { useState, useEffect } from 'react';
import {
  Tv,
  Play,
  CheckCircle2,
  Sparkles,
  Gift,
  Coins,
  ShieldCheck,
  Flame,
  ExternalLink,
  Settings,
  RefreshCw,
  Clock,
  Layers,
  Award,
  Globe,
  Check,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface MiniAppProps {
  initialUserId?: number;
  onBackToBot?: () => void;
}

export const MiniAppView: React.FC<MiniAppProps> = ({ initialUserId = 88776655, onBackToBot }) => {
  const [telegramId, setTelegramId] = useState<number>(initialUserId);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [monetagStats, setMonetagStats] = useState<any>(null);
  const [monetagConfig, setMonetagConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Active Ad Playback State
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState(0);
  const [currentAdType, setCurrentAdType] = useState<string>('rewarded_interstitial');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  // Monetag Settings Edit Mode
  const [showSettings, setShowSettings] = useState(false);
  const [editZoneId, setEditZoneId] = useState('');
  const [editDirectLink, setEditDirectLink] = useState('');
  const [editTagUrl, setEditTagUrl] = useState('');
  const [editRewardCredits, setEditRewardCredits] = useState('5');
  const [editDailyLimit, setEditDailyLimit] = useState('20');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Dynamically load Monetag SDK Script
  const loadMonetagSdk = (zoneId: string, tagUrl: string) => {
    if (!zoneId) return;
    try {
      const scriptId = `monetag-sdk-${zoneId}`;
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.setAttribute('data-zone', zoneId);
        script.setAttribute('data-sdk', `show_${zoneId}`);
        script.src = tagUrl.startsWith('//') ? window.location.protocol + tagUrl : tagUrl;
        
        script.onload = () => {
          setSdkLoaded(true);
          setSdkError(null);
        };
        script.onerror = () => {
          setSdkLoaded(false);
          setSdkError('Ad script blocked or loading failed (AdBlock active?)');
        };
        
        document.head.appendChild(script);
      } else {
        setSdkLoaded(true);
      }
    } catch (err) {
      console.warn('Monetag SDK Injection Notice:', err);
    }
  };

  // Detect Telegram WebApp user if running inside real Telegram
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        tg.ready();
        tg.expand();
        if (tg.initDataUnsafe?.user?.id) {
          setTelegramId(tg.initDataUnsafe.user.id);
        }
      } catch (err) {
        console.log('Telegram WebApp init notice:', err);
      }
    }
  }, []);

  // Fetch user data & Monetag config
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        fetch(`/api/miniapp/user/${telegramId}`),
        fetch('/api/miniapp/config'),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUserProfile(uData.user);
        setMonetagStats(uData.monetag);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        const cfg = cData.config;
        setMonetagConfig(cfg);
        setEditZoneId(cfg.zoneId || '');
        setEditDirectLink(cfg.directLink || '');
        setEditTagUrl(cfg.tagUrl || '');
        setEditRewardCredits(String(cfg.rewardCredits || '5'));
        setEditDailyLimit(String(cfg.dailyLimit || '20'));

        // Trigger Monetag SDK loader
        loadMonetagSdk(cfg.zoneId || '8839201', cfg.tagUrl || '//kulroakonsu.net/88/tag.min.js');
      }
    } catch (err) {
      console.error('Failed to load miniapp data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [telegramId]);

  // Handle countdown during ad playback
  useEffect(() => {
    if (!isWatchingAd || adSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setAdSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeAdReward(currentAdType);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isWatchingAd, adSecondsLeft, currentAdType]);

  // Start Watching Monetag Ad via Monetag SDK or Direct Link
  const startWatchAd = (adType: 'rewarded_interstitial' | 'in_page_push' | 'smartlink') => {
    if (monetagStats && monetagStats.remainingToday <= 0) {
      setErrorNotice(`Daily limit reached! You have completed all ${monetagStats.dailyLimit} ads today.`);
      return;
    }

    setErrorNotice(null);
    setRewardNotice(null);
    setCurrentAdType(adType);

    const zoneId = monetagConfig?.zoneId || '8839201';
    const sdkFunction = (window as any)[`show_${zoneId}`] || (window as any).show_8839201 || (window as any).show_rewarded;

    // Trigger Monetag Official SDK function if available
    if (adType === 'rewarded_interstitial' && typeof sdkFunction === 'function') {
      try {
        const result = sdkFunction();
        if (result && typeof result.then === 'function') {
          result
            .then(() => {
              completeAdReward(adType);
            })
            .catch((e: any) => {
              console.log('SDK close/dismiss:', e);
              // Fallback to in-app player countdown
              setIsWatchingAd(true);
              setAdSecondsLeft(10);
            });
          return;
        }
      } catch (err) {
        console.warn('Monetag SDK invoke error, fallback to visual player:', err);
      }
    }

    // If SmartLink or Direct Ad link is configured, open it in new tab/popup
    if (adType === 'smartlink' && monetagConfig?.directLink) {
      try {
        window.open(monetagConfig.directLink, '_blank', 'noopener,noreferrer');
      } catch {}
    }

    setIsWatchingAd(true);
    setAdSecondsLeft(10); // 10s rewarded duration
  };

  // Complete & Claim Ad Reward from server
  const completeAdReward = async (adType: string) => {
    setClaiming(true);
    try {
      const res = await fetch('/api/miniapp/claim-ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          adType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRewardNotice(`🎉 +${data.amount} Credits added to your account!`);
        setUserProfile((prev: any) => ({
          ...prev,
          balance: data.newBalance,
        }));
        setMonetagStats((prev: any) => ({
          ...prev,
          adsWatchedToday: data.adsWatchedToday,
          remainingToday: data.remainingToday,
          totalEarnedFromAds: (prev?.totalEarnedFromAds || 0) + data.amount,
        }));
      } else {
        setErrorNotice(data.error || 'Failed to claim ad reward.');
      }
    } catch (err) {
      setErrorNotice('Network error while verifying ad reward.');
    } finally {
      setIsWatchingAd(false);
      setClaiming(false);
    }
  };

  // Save Monetag Configuration
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/miniapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: editZoneId,
          directLink: editDirectLink,
          tagUrl: editTagUrl,
          rewardCredits: parseInt(editRewardCredits, 10) || 5,
          dailyLimit: parseInt(editDailyLimit, 10) || 20,
        }),
      });

      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
        fetchUserData();
        setShowSettings(false);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const progressPercent = monetagStats
    ? Math.min(100, Math.round((monetagStats.adsWatchedToday / (monetagStats.dailyLimit || 20)) * 100))
    : 0;

  return (
    <div className="w-full max-w-md mx-auto bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[640px]">
      {/* Top Telegram Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 border-b border-blue-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md">
              {userProfile?.firstName?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-white leading-none">
                  {userProfile?.firstName || 'Telegram User'}
                </h2>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  Mini App
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-0.5">
                @{userProfile?.username || 'user'} • ID: {telegramId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Monetag Settings"
              className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onBackToBot && (
              <button
                onClick={onBackToBot}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
              >
                Back to Bot
              </button>
            )}
          </div>
        </div>

        {/* Live Balance Card */}
        <div className="mt-3.5 bg-slate-900/90 backdrop-blur-md rounded-xl p-3.5 border border-blue-500/30 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Available Credits / Tokens
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-amber-400">
                {(userProfile?.balance ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium">Credits</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Today's Ad Earnings
            </span>
            <div className="flex items-center justify-end gap-1 mt-0.5 text-emerald-400 font-semibold text-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              +{(monetagStats?.totalEarnedFromAds ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Success / Error Alerts */}
        {rewardNotice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{rewardNotice}</span>
            </div>
            <button onClick={() => setRewardNotice(null)} className="text-emerald-400 hover:text-emerald-200">
              ✕
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-red-400 hover:text-red-200">
              ✕
            </button>
          </div>
        )}

        {/* Monetag Settings Modal / Drawer */}
        {showSettings ? (
          <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Monetag Ad Setup (অ্যাডমিন সেটিংস)</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Monetag Zone ID:</label>
                <input
                  type="text"
                  value={editZoneId}
                  onChange={(e) => setEditZoneId(e.target.value)}
                  placeholder="e.g. 8839201"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Found in Monetag Dashboard under Sites / Zones.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Monetag Direct SmartLink URL:</label>
                <input
                  type="url"
                  value={editDirectLink}
                  onChange={(e) => setEditDirectLink(e.target.value)}
                  placeholder="https://otieuwou.com/4/8839201"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Monetag Tag Script URL:</label>
                <input
                  type="text"
                  value={editTagUrl}
                  onChange={(e) => setEditTagUrl(e.target.value)}
                  placeholder="//kulroakonsu.net/88/tag.min.js"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Reward per Ad (Credits):</label>
                  <input
                    type="number"
                    value={editRewardCredits}
                    onChange={(e) => setEditRewardCredits(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Daily Limit (Ads/day):</label>
                  <input
                    type="number"
                    value={editDailyLimit}
                    onChange={(e) => setEditDailyLimit(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {settingsSaved ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Daily Monetag Progress Bar & SDK Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Daily Ad Tasks Progress
            </span>
            <span className="text-amber-400 font-semibold font-mono">
              {monetagStats?.adsWatchedToday ?? 0} / {monetagStats?.dailyLimit ?? 20}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${sdkLoaded ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-[10px] text-slate-300 font-mono">
                {sdkLoaded ? `SDK Active (Zone: ${monetagConfig?.zoneId || '8839201'})` : 'Monetag SDK Ready'}
              </span>
            </span>
            <span className="text-emerald-400 font-medium font-mono">
              +{monetagConfig?.rewardCredits || 5} Credits / Ad
            </span>
          </div>
        </div>

        {/* Active Watching Ad Interactive Screen */}
        {isWatchingAd ? (
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500 rounded-2xl p-5 text-center space-y-4 shadow-xl animate-fadeIn">
            <div className="inline-flex p-3 rounded-full bg-indigo-500/20 text-indigo-400">
              <Tv className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Monetag Sponsor Ad Playing</h3>
              <p className="text-xs text-slate-300 mt-1">
                Please stay on this screen until the timer finishes to receive your reward.
              </p>
            </div>

            {/* Countdown Display */}
            <div className="py-3 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-400 flex items-center justify-center text-2xl font-black text-white animate-spin-slow">
                {adSecondsLeft}
              </div>
              <span className="text-xs text-slate-400 mt-2 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Seconds remaining
              </span>
            </div>

            {/* Monetag Tag Ad Script Zone Container */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500 font-mono">
                <span>MONETAG REWARDED ZONE</span>
                <span>ID: {monetagConfig?.zoneId || '8839201'}</span>
              </div>
              <p className="text-slate-300 font-medium">
                🎯 Sponsor Ad is loaded. Your credit reward will be deposited automatically!
              </p>
            </div>

            {adSecondsLeft <= 0 && (
              <button
                onClick={() => completeAdReward(currentAdType)}
                disabled={claiming}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-lg hover:from-emerald-500 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
              >
                {claiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Claim +{monetagConfig?.rewardCredits || 5} Credits
              </button>
            )}
          </div>
        ) : (
          /* Available Ad Tasks List */
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Available Monetag Ad Rewards
            </h3>

            {/* Task 1: Rewarded Interstitial */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Watch Rewarded Video</h4>
                    <p className="text-xs text-slate-400">10s quick sponsor ad</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 block mb-1">
                    +{monetagConfig?.rewardCredits || 5} Credits
                  </span>
                  <button
                    onClick={() => startWatchAd('rewarded_interstitial')}
                    disabled={monetagStats?.remainingToday <= 0}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Watch
                  </button>
                </div>
              </div>
            </div>

            {/* Task 2: Monetag Direct SmartLink */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Monetag SmartLink Ad</h4>
                    <p className="text-xs text-slate-400">Visit sponsor page & earn</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 block mb-1">
                    +{monetagConfig?.rewardCredits || 5} Credits
                  </span>
                  <button
                    onClick={() => startWatchAd('smartlink')}
                    disabled={monetagStats?.remainingToday <= 0}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Visit
                  </button>
                </div>
              </div>
            </div>

            {/* Task 3: In-Page Push & Banner */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">In-Page Banner Ad</h4>
                    <p className="text-xs text-slate-400">Interactive display ad</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 block mb-1">
                    +{Math.max(1, (monetagConfig?.rewardCredits || 5) - 2)} Credits
                  </span>
                  <button
                    onClick={() => startWatchAd('in_page_push')}
                    disabled={monetagStats?.remainingToday <= 0}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> View
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information box */}
        <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-3 text-[11px] text-blue-200/80 space-y-1">
          <div className="font-semibold text-blue-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Monetag Monetization Active
          </div>
          <p>
            Earn free credits by viewing verified ads. You can use your credits to promote your own websites or exchange for traffic!
          </p>
        </div>
      </div>
    </div>
  );
};
