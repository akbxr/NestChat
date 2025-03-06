"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import AuthLayout from "./AuthLayout";

const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const [generalError, setGeneralError] = React.useState("");
  const [isSuccess, setIsSuccess] = React.useState(false);

  const onSubmit = async (formData: FormData) => {
    setGeneralError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      setIsSuccess(true);
    } catch (error) {
      setGeneralError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.",
      );
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We have sent a password reset link to your email address"
      >
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-emerald-500 hover:text-emerald-400 transition-colors duration-200"
            >
              try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
    >
      {generalError && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-400">{generalError}</p>
          </div>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                errors.email ? "border-red-500" : "border-gray-600"
              } rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors duration-200`}
              placeholder="Email address"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
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
                Send reset link
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        Remember your password?{" "}
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
