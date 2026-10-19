import React from 'react';
import { STRINGS } from '../constants/strings';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface LoginPageProps {
  onLoginWithGoogle: () => void;
  onLoginDemo: () => void;
  isLoading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginWithGoogle,
  onLoginDemo,
  isLoading,
}) => {
  return (
    <div className="min-h-screen bg-moneta-bg flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6 text-center animate-in fade-in duration-300">
        {/* App Logo */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white text-3xl font-black shadow-float">
          M
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {STRINGS.appName}
          </h1>
          <p className="text-sm font-semibold text-moneta-primary">
            "{STRINGS.tagline}"
          </p>
          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            {STRINGS.login.welcomeSubtitle}
          </p>
        </div>

        {/* Feature Badges */}
        <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
            <Zap size={14} className="text-teal-600" />
            <span>Ekstrak struk foto & nota warung</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
            <Sparkles size={14} className="text-teal-600" />
            <span>Chat AI bahasa santai anak kos</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>Wallet Health Score otomatis</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onLoginWithGoogle}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-moneta-primary hover:bg-teal-800 disabled:opacity-50 text-white rounded-btn font-semibold text-sm shadow-md transition flex items-center justify-center gap-3 touch-target"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z"
              />
            </svg>
            <span>{STRINGS.login.googleButton}</span>
          </button>

          <button
            type="button"
            onClick={onLoginDemo}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-btn font-medium text-xs transition flex items-center justify-center gap-2 touch-target"
          >
            <span>{STRINGS.login.demoButton}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          {STRINGS.login.footerNote}
        </p>
      </div>
    </div>
  );
};
