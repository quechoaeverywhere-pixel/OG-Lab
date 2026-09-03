import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Sun,
  Moon,
  Compass,
  ArrowRight,
  BookOpen,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Feather
} from 'lucide-react';
import { OGLogo } from './OGLogo';
import { DynamicHarmonicCanvas } from './DynamicHarmonicCanvas';
import { useAuth } from '../contexts/AuthContext';

interface AuthLandingGateProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onEnterGuestMode?: () => void;
}

export const AuthLandingGate: React.FC<AuthLandingGateProps> = ({
  theme,
  onToggleTheme,
  onEnterGuestMode
}) => {
  const { signInWithGoogle, activateAuthorRole } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState('');

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setPasscodeError('');
    setPasscodeSuccess('');

    const clean = passcode.trim().toUpperCase();
    const res = await activateAuthorRole(clean);
    if (res.success) {
      setPasscodeSuccess(res.message);
    } else {
      setPasscodeError(res.message || 'Mã ủy quyền không chính xác.');
    }
  };

  const pillarsList = [
    { num: 'I', label: 'Bản Thể', color: 'border-purple-500/40 text-purple-400 bg-purple-950/20' },
    { num: 'II', label: 'Cơ Chế', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20' },
    { num: 'III', label: 'Kiến Trúc', color: 'border-sky-500/40 text-sky-400 bg-sky-950/20' },
    { num: 'IV', label: 'Biện Chứng', color: 'border-pink-500/40 text-pink-400 bg-pink-950/20' },
    { num: 'V', label: 'Tĩnh Tâm', color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
    { num: 'VI', label: 'Đất Trời', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' }
  ];

  return (
    <div
      id="og-auth-landing-gate"
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#070614] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Generative Dynamic Harmonic Canvas Background */}
      <DynamicHarmonicCanvas theme={theme} />

      {/* 2. Top Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <OGLogo size={38} theme={theme} animated={true} />
          <div>
            <span className="font-display-title font-black text-sm tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300">
              Oneness Governance
            </span>
            <p className="text-[10px] font-tech text-slate-400 uppercase tracking-wider">
              OG Intelligence Lab • Shinbashira Core
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white/80 border-slate-200 text-slate-700 hover:text-black'
            }`}
            title="Chuyển đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* 3. Central Login & Transformation Showcase */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center my-auto">
        {/* Ambient Halo */}
        <div className="absolute -top-12 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Minimalist Card Container */}
        <div
          className={`w-full rounded-3xl border p-7 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all ${
            theme === 'dark'
              ? 'bg-[#0d0c22]/85 border-purple-900/40 shadow-purple-950/40 text-slate-100'
              : 'bg-white/90 border-slate-200 shadow-slate-300/40 text-slate-900'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border bg-purple-950/40 text-purple-300 border-purple-500/30 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Cổng Nghiên Cứu & Khảo Luận Hàn Lâm</span>
          </div>

          {/* Main Title & Slogan */}
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display-title tracking-tight mb-3">
            Deep Research & Knowledge Transforming
          </h1>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 dark:text-slate-400 max-w-lg mx-auto mb-6">
            Tiếp nhận và đúc kết tri thức ở tầm mức học thuật uyên áo, chuyển hóa thành ngôn ngữ đời thường, trong sáng và thực chiến để kiến tạo giá trị nhân sinh.
          </p>

          {/* 6 Dynamic Pillars Minimalist Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
            {pillarsList.map((p, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-mono transition-transform hover:scale-105 ${p.color}`}
              >
                <span className="font-bold text-xs">{p.num}</span>
                <span className="text-[10px] tracking-tight">{p.label}</span>
              </div>
            ))}
          </div>

          {/* Google Sign-in Primary CTA (No Username, No Password, No Email Inputs) */}
          <div className="space-y-3 max-w-md mx-auto">
            <button
              id="btn-google-auth-primary"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-tech uppercase tracking-wider text-sm font-bold shadow-xl shadow-purple-900/40 transition-all active:scale-98 cursor-pointer disabled:opacity-50 group"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 bg-white rounded-full p-0.5 group-hover:scale-110 transition-transform"
              />
              <span>{isAuthenticating ? 'Đang Xác Thực...' : 'ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Direct Guest Mode Button */}
            {onEnterGuestMode && (
              <button
                type="button"
                id="btn-guest-explore"
                onClick={onEnterGuestMode}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border font-tech text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900/90 border-purple-500/30 text-purple-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                }`}
              >
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>KHÁM PHÁ NGAY (CHẾ ĐỘ ĐỘC GIẢ / VIEWER)</span>
              </button>
            )}

            {/* Privacy & Zero-Email-Gathering Notice */}
            <div className="flex items-start gap-2 text-left p-3 rounded-xl bg-slate-900/50 dark:bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300">Bảo mật & Quyền riêng tư:</span> Hệ thống không thu thập hay công khai địa chỉ email của học giả. Danh tính trên hệ thống chỉ hiển thị duy nhất bằng <strong>Tên Tài Khoản (Display Name)</strong>.
              </div>
            </div>

            {/* Optional Author Passcode Form */}
            <div className="pt-2">
              {!showPasscodeForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasscodeForm(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Kích hoạt mã Tác Giả (Author Passcode)</span>
                </button>
              ) : (
                <form onSubmit={handleVerifyPasscode} className="space-y-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      placeholder="Nhập mã tác giả (ví dụ: OG-AUTHOR-2026)..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold font-tech rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors"
                    >
                      Kích Hoạt
                    </button>
                  </div>
                  {passcodeError && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{passcodeError}</span>
                    </div>
                  )}
                  {passcodeSuccess && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{passcodeSuccess}</span>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2 border-t border-slate-800/40">
        <div>Kiến trúc Shinbashira & 6 Trụ Cột Động • Oneness Governance</div>
        <div>Vận hành trên nền tảng Trí tuệ Nhân tạo Đa tác nhân (Multi-Agent Swarm)</div>
      </footer>
    </div>
  );
};
