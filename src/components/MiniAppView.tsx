import React, { useState, useEffect } from 'react';
import {
  Tv,
  Play,
  CheckCircle2,
  Coins,
  Flame,
  RefreshCw,
  AlertTriangle,
  Award,
  Sparkles,
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

  // Ad Loading & Claiming States
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Dynamically load Monetag SDK Script for Zone 11696929
  const loadMonetagSdk = (zoneId: string = '11696929', tagUrl: string = '//kulroakonsu.net/88/tag.min.js') => {
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
        };
        script.onerror = () => {
          setSdkLoaded(false);
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
        // Trigger Monetag SDK loader
        loadMonetagSdk(cfg.zoneId || '11696929', cfg.tagUrl || '//kulroakonsu.net/88/tag.min.js');
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

  // Start Watching Monetag Ad via Monetag SDK show_11696929()
  const handleWatchAd = () => {
    // Prevent multiple simultaneous ad requests
    if (isLoadingAd || claiming) {
      return;
    }

    if (monetagStats && monetagStats.remainingToday <= 0) {
      setErrorNotice(`Daily limit reached! You have completed all ${monetagStats.dailyLimit} ads today.`);
      return;
    }

    setErrorNotice(null);
    setRewardNotice(null);
    setIsLoadingAd(true);

    const zoneId = monetagConfig?.zoneId || '11696929';
    const sdkFunction =
      (window as any)[`show_${zoneId}`] ||
      (window as any).show_11696929;

    // Trigger Monetag Official SDK function for Rewarded Interstitial
    if (typeof sdkFunction === 'function') {
      try {
        const adPromise = sdkFunction();
        if (adPromise && typeof adPromise.then === 'function') {
          adPromise
            .then(() => {
              // Reward user ONLY after the Monetag promise resolves successfully
              const eventId = `evt_${Date.now()}_${telegramId}_${Math.random().toString(36).substring(2, 9)}`;
              processReward(eventId);
            })
            .catch((err: any) => {
              console.warn('Monetag ad promise rejected / closed early:', err);
              setErrorNotice('Ad could not be completed. Please try again.');
              setIsLoadingAd(false);
            });
          return;
        } else {
          setErrorNotice('Ad could not be completed. Please try again.');
          setIsLoadingAd(false);
          return;
        }
      } catch (err) {
        console.error('Monetag SDK invoke error:', err);
        setErrorNotice('Ad could not be completed. Please try again.');
        setIsLoadingAd(false);
        return;
      }
    } else {
      // SDK function is undefined / not loaded yet
      console.warn(`show_${zoneId} is not available on window`);
      setErrorNotice('Ad could not be completed. Please try again.');
      setIsLoadingAd(false);
    }
  };

  // Secure Server-side Reward Verification
  const processReward = async (eventId: string) => {
    setClaiming(true);
    try {
      const res = await fetch('/api/miniapp/claim-ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          adType: 'rewarded_interstitial',
          eventId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRewardNotice('Reward added successfully');
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
        setErrorNotice(data.error || 'Ad could not be completed. Please try again.');
      }
    } catch (err) {
      setErrorNotice('Ad could not be completed. Please try again.');
    } finally {
      setClaiming(false);
      setIsLoadingAd(false);
    }
  };

  const progressPercent = monetagStats
    ? Math.min(100, Math.round((monetagStats.adsWatchedToday / (monetagStats.dailyLimit || 20)) * 100))
    : 0;

  const rewardPerAd = monetagConfig?.rewardCredits || 5;

  return (
    <div className="w-full max-w-md mx-auto bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[580px]">
      {/* Telegram User & Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 border-b border-blue-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md">
              {userProfile?.firstName?.charAt(0) || 'U'}
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

          {onBackToBot && (
            <button
              onClick={onBackToBot}
              className="px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium transition-colors shadow"
            >
              Back to Bot
            </button>
          )}
        </div>

        {/* Live Token / Credit Balance Display */}
        <div className="mt-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-blue-500/30 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Your Tokens / Credits
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-6 h-6 text-amber-400" />
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                {(userProfile?.balance ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-medium self-end mb-1">Tokens</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Today's Earnings
            </span>
            <div className="flex items-center justify-end gap-1 mt-1 text-emerald-400 font-bold text-base font-mono">
              <Award className="w-4 h-4" />
              +{(monetagStats?.totalEarnedFromAds ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body - Only Ad Watch & Token Count */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        {/* Status Alerts */}
        {rewardNotice && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-medium text-sm">{rewardNotice}</span>
            </div>
            <button
              onClick={() => setRewardNotice(null)}
              className="text-emerald-400 hover:text-emerald-200 text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="p-3.5 bg-red-950/90 border border-red-500/60 rounded-xl text-red-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="font-medium">{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-red-400 hover:text-red-200 text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Daily Progress Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Today's Ad Tasks
            </span>
            <span className="text-amber-400 font-bold font-mono text-sm">
              {monetagStats?.adsWatchedToday ?? 0} / {monetagStats?.dailyLimit ?? 20}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Remaining today: <strong className="text-slate-200 font-mono">{monetagStats?.remainingToday ?? 20} ads</strong></span>
            <span className="text-emerald-400 font-bold font-mono">+{rewardPerAd} Tokens / Ad</span>
          </div>
        </div>

        {/* Single Monetag Rewarded Ad Watch Card */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-indigo-500/50 rounded-2xl p-6 text-center shadow-xl space-y-5 my-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
            <Tv className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              Watch Ad & Earn Tokens
            </h3>
            <p className="text-xs text-slate-400 mt-1.5">
              Watch a quick sponsor video to earn instant credits directly into your wallet.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 font-bold text-sm font-mono">
            <Sparkles className="w-4 h-4" />
            +{rewardPerAd} Tokens Reward
          </div>

          {/* Watch Ad Button */}
          <button
            id="watch-ad-main-btn"
            onClick={handleWatchAd}
            disabled={isLoadingAd || claiming || (monetagStats?.remainingToday ?? 0) <= 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLoadingAd ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading ad...</span>
              </>
            ) : claiming ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Crediting tokens...</span>
              </>
            ) : (monetagStats?.remainingToday ?? 0) <= 0 ? (
              <span>Daily Limit Reached</span>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Watch Ad</span>
              </>
            )}
          </button>
        </div>

        {/* Minimal Footer Info */}
        <div className="text-center text-[11px] text-slate-500 font-mono py-1">
          Zone: 11696929 • Monetag Rewarded Interstitial
        </div>
      </div>
    </div>
  );
};
