import { SignIn } from "@clerk/clerk-react";
import { Shield, Activity, Clock, Award } from "lucide-react";

const LoginPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-200px)] rounded-3xl overflow-hidden shadow-2xl bg-white my-4 lg:my-8 mx-auto max-w-6xl transition-all duration-300">
      {/* Left Side: Professional Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-16 text-white overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-8 shadow-lg shadow-blue-600/20">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
            Medi<span className="text-blue-400">Zen</span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed mb-10">
            Your secure digital gateway to modern healthcare. Access your medical world with confidence.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-slate-800 p-2 rounded-lg text-blue-400">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure Access</h3>
                <p className="text-sm text-slate-400">Encryption-protected medical records and data.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-slate-800 p-2 rounded-lg text-blue-400">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">24/7 Connectivity</h3>
                <p className="text-sm text-slate-400">Connect with doctors anytime, anywhere.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 bg-slate-800 p-2 rounded-lg text-blue-400">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Top-tier Care</h3>
                <p className="text-sm text-slate-400">Access to verified healthcare professionals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Clerk Component */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-slate-50/50 p-8 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">MediZen</h1>
            <p className="text-slate-500 mt-2">Welcome back to your health portal</p>
          </div>
          
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent w-full",
                headerTitle: "text-2xl font-bold text-slate-800",
                headerSubtitle: "text-slate-500",
                formButtonPrimary:
                  "bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]",
                formFieldLabel: "text-slate-700 font-medium",
                formFieldInput: "border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold",
                socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50 transition-colors",
                socialButtonsBlockButtonText: "font-medium text-slate-600",
                dividerLine: "bg-slate-200",
                dividerText: "text-slate-400 font-medium",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
