import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Animated encryption background */}
      <div className="absolute inset-0 opacity-10">
        <div className="animate-slide-left absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="whitespace-nowrap text-xl text-green-500 font-mono opacity-20"
              style={{ marginTop: `${i * 2}rem` }}
            >
              {"01".repeat(50)}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl relative z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">{title}</h2>
          <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
