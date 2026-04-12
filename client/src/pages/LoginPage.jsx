import { SignIn } from "@clerk/clerk-react";
import { Shield, Activity, Clock, Award } from "lucide-react";

const LoginPage = () => {
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row min-h-[min(100dvh,920px)] lg:min-h-[calc(100vh-180px)] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white mx-auto max-w-6xl transition-all duration-300">
        {/* Mobile / tablet brand */}
        <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-10 sm:py-12 text-center">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-600/25">
              <Activity size={28} className="text-white" aria-hidden />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Medi<span className="text-blue-400">Zen</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-sm mx-auto leading-relaxed">
              Your secure gateway to modern healthcare.
            </p>
          </div>
        </div>

        {/* Desktop left: branding */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-12 xl:p-16 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full -mr-36 -mt-36 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/10 rounded-full -ml-36 -mb-36 blur-3xl" />

          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-8 shadow-lg shadow-blue-600/20">
              <Activity size={32} className="text-white" aria-hidden />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold mb-6 tracking-tight">
              Medi<span className="text-blue-400">Zen</span>
            </h1>
            <p className="text-lg xl:text-xl text-slate-300 leading-relaxed mb-10">
              Your secure digital gateway to modern healthcare. Access your medical world with confidence.
            </p>

            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="mt-0.5 bg-slate-800/80 p-2.5 rounded-xl text-blue-400 shrink-0">
                  <Shield size={20} aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure access</h3>
                  <p className="text-sm text-slate-400 leading-snug">Encryption-protected medical records and data.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-0.5 bg-slate-800/80 p-2.5 rounded-xl text-blue-400 shrink-0">
                  <Clock size={20} aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-white">24/7 connectivity</h3>
                  <p className="text-sm text-slate-400 leading-snug">Connect with care teams when you need them.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-0.5 bg-slate-800/80 p-2.5 rounded-xl text-blue-400 shrink-0">
                  <Award size={20} aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Trusted care</h3>
                  <p className="text-sm text-slate-400 leading-snug">A streamlined experience built for patients.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Clerk sign-in */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 sm:px-8 py-10 lg:py-12">
          <div className="w-full max-w-[min(100%,380px)]">
            <div className="hidden lg:block text-center mb-8">
              <p className="text-slate-500 text-sm font-medium">Welcome back</p>
              <p className="text-slate-800 font-semibold mt-1">Sign in to continue</p>
            </div>

            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/register"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent w-full p-0",
                  headerTitle: "text-xl sm:text-2xl font-bold text-slate-800",
                  headerSubtitle: "text-slate-500 text-sm",
                  formButtonPrimary:
                    "bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] rounded-lg",
                  formFieldLabel: "text-slate-700 font-medium text-sm",
                  formFieldInput:
                    "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold",
                  socialButtonsBlockButton:
                    "border-slate-200 hover:bg-slate-50 transition-colors rounded-lg",
                  socialButtonsBlockButtonText: "font-medium text-slate-600 text-sm",
                  dividerLine: "bg-slate-200",
                  dividerText: "text-slate-400 font-medium text-xs",
                  formFieldInputShowPasswordButton: "text-slate-500",
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
