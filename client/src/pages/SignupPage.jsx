import { SignUp } from "@clerk/clerk-react";
import { UserPlus, CheckCircle, Users, Zap } from "lucide-react";

const SignupPage = () => {
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row min-h-[min(100dvh,920px)] lg:min-h-[calc(100vh-180px)] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white mx-auto max-w-6xl transition-all duration-300">
        {/* Mobile / tablet brand */}
        <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 text-white px-6 py-10 sm:py-12 text-center">
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-400/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/15 shadow-lg">
              <UserPlus size={28} className="text-white" aria-hidden />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Join MediZen</h1>
            <p className="text-blue-100/90 text-sm sm:text-base mt-2 max-w-sm mx-auto leading-relaxed">
              Personalized healthcare, one account away.
            </p>
          </div>
        </div>

        {/* Desktop left */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 relative items-center justify-center p-12 xl:p-16 text-white overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full -mr-48 -mb-48 blur-3xl" />

          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-8 shadow-xl border border-white/10">
              <UserPlus size={32} className="text-white" aria-hidden />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold mb-6 tracking-tight text-white">Join MediZen</h1>
            <p className="text-lg xl:text-xl text-blue-100/85 leading-relaxed mb-10">
              Create your account today and experience a new standard in personalized healthcare.
            </p>

            <ul className="space-y-4">
              <li className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-blue-600 p-2.5 rounded-xl shrink-0">
                  <Users size={20} className="text-white" aria-hidden />
                </div>
                <p className="font-medium text-blue-50 text-sm leading-snug">Connect with top-rated specialists</p>
              </li>
              <li className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-blue-600 p-2.5 rounded-xl shrink-0">
                  <CheckCircle size={20} className="text-white" aria-hidden />
                </div>
                <p className="font-medium text-blue-50 text-sm leading-snug">Seamless appointment management</p>
              </li>
              <li className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                <div className="bg-blue-600 p-2.5 rounded-xl shrink-0">
                  <Zap size={20} className="text-white" aria-hidden />
                </div>
                <p className="font-medium text-blue-50 text-sm leading-snug">Instant AI health insights</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Clerk sign-up */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 sm:px-8 py-10 lg:py-12">
          <div className="w-full max-w-[min(100%,400px)]">
            <div className="hidden lg:block text-center mb-8">
              <p className="text-slate-500 text-sm font-medium">New here?</p>
              <p className="text-slate-800 font-semibold mt-1">Create your MediZen account</p>
            </div>

            <SignUp
              routing="path"
              path="/register"
              signInUrl="/login"
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

export default SignupPage;
