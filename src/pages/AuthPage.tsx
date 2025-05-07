
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/auth/AuthForm";

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-brand-50 to-purple-50">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-300 to-brand-500 flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">CR</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">ContactRemind</h1>
        <p className="text-gray-600 mt-2">Never forget to stay in touch</p>
      </div>
      
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Demo version - All data is stored locally</p>
      </div>
    </div>
  );
};

export default AuthPage;
