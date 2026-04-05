import { SignUp } from "@clerk/clerk-react";
import { UserPlus, CheckCircle, Users, Zap } from "lucide-react";

const SignupPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-200px)] rounded-3xl overflow-hidden shadow-2xl bg-white my-4 lg:my-8 mx-auto max-w-6xl transition-all duration-300">
      {/* Left Side: Info */}
      <div className="hidden lg:flex w-1/2 bg-blue-950 relative items-center justify-center p-16 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mb-48 blur-3xl"></div>
        
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-8 shadow-xl border border-white/10">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-white">Join MediZen</h1>
          <p className="text-xl text-blue-100/80 leading-relaxed mb-10">
            Create your account today and experience a new standard in personalized healthcare.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users size={20} className="text-white" />
              </div>
              <p className="font-medium text-blue-50">Connect with top-rated specialists</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
              <div className="bg-blue-600 p-2 rounded-lg">
                <CheckCircle size={20} className="text-white" />
              </div>
              <p className="font-medium text-blue-50">Seamless appointment management</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap size={20} className="text-white" />
              </div>
              <p className="font-medium text-blue-50">Instant AI health insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Clerk Component */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-slate-50/50 p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-bold text-blue-600">MediZen</h1>
            <p className="text-slate-500 mt-2">Start your health journey</p>
          </div>
          
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
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

export default SignupPage;
