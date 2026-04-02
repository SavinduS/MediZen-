import { SignIn } from "@clerk/clerk-react";

const LoginPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left Side: Professional Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold mb-6 text-blue-400">MediZen</h1>
          <p className="text-xl text-slate-300 leading-relaxed">
            Welcome to your digital healthcare gateway. Securely access your
            appointments, medical reports, and AI health suggestions.
          </p>
        </div>
      </div>

      {/* Right Side: Clerk Component */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              card: "shadow-none border-none bg-transparent",
            },
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;
