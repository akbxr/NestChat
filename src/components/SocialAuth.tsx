import React from "react";
import { Github } from "lucide-react";

interface SocialAuthProps {
  onSocialLogin: (provider: "google" | "github") => Promise<void>;
}

export default function SocialAuth({ onSocialLogin }: SocialAuthProps) {
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSocialLogin("google")}
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
        >
          <img
            className="h-5 w-5"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
          />
          <span className="ml-2">Google</span>
        </button>
        <button
          type="button"
          onClick={() => onSocialLogin("github")}
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
        >
          <Github className="h-5 w-5" />
          <span className="ml-2">GitHub</span>
        </button>
      </div>
    </>
  );
}
