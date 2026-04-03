import { SignUp } from "@clerk/clerk-react";

const SignupPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left Side: Info */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold mb-6">Join Us</h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Create an account to book top-rated doctors, upload your medical
            history safely, and consult via high-quality video sessions.
          </p>
        </div>
      </div>

      {/* Right Side: Clerk Component */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-6">
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignupPage;
