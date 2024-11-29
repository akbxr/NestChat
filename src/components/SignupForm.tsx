"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Github,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AuthLayout from "./AuthLayout";

import { z } from "zod";

const signupSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    mode: "onSubmit",
    // criteriaMode: "all",
  });

  const [generalError, setGeneralError] = React.useState("");

  const onSubmit = async (data: FormData) => {
    setGeneralError("");
    try {
      const { confirmPassword, ...registerData } = data;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(registerData),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      router.push("/chat");
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "An error occurred during signup. Please try again.",
      );
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setGeneralError("");
    try {
      if (provider === "google") {
        // Redirect ke Google OAuth
        window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/google`;
      } else if (provider === "github") {
        // Redirect ke GitHub OAuth
        window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/github`;
      }
    } catch (error) {
      setGeneralError(`Failed to sign up with ${provider}`);
    }
  };

  const InputField = React.memo(
    ({
      name,
      type,
      icon: Icon,
      placeholder,
    }: {
      name: keyof FormData;
      type: string;
      icon: React.ElementType;
      placeholder: string;
    }) => {
      const [showPassword, setShowPassword] = React.useState(false);
      const isPassword = type === "password";

      return (
        <div>
          <label htmlFor={name} className="sr-only">
            {placeholder}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="relative">
              <input
                {...register(name)}
                type={isPassword ? (showPassword ? "text" : "password") : type}
                className={`appearance-none relative block w-full pl-10 ${isPassword ? "pr-10" : "pr-3"} py-2 border ${
                  errors[name] ? "border-red-500" : "border-gray-600"
                } rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors duration-200`}
                placeholder={placeholder}
              />
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400 hover:text-gray-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400 hover:text-gray-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
          {errors[name] && (
            <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>
          )}
        </div>
      );
    },
  );

  return (
    <AuthLayout title="Create an account" subtitle="Sign up to get started">
      {generalError && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-400">{generalError}</p>
          </div>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleFormSubmit(onSubmit)}>
        <div className="space-y-4">
          <InputField
            name="username"
            type="text"
            icon={User}
            placeholder="Username"
          />
          <InputField
            name="email"
            type="email"
            icon={Mail}
            placeholder="Email address"
          />
          <InputField
            name="password"
            type="password"
            icon={Lock}
            placeholder="Password"
          />
          <InputField
            name="confirmPassword"
            type="password"
            icon={Lock}
            placeholder="Confirm password"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Sign up
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors duration-200"
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
            onClick={() => handleSocialLogin("github")}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors duration-200"
          >
            <Github className="h-5 w-5" />
            <span className="ml-2">GitHub</span>
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <a
          href="/signin"
          className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors duration-200"
        >
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}
