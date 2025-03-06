import React from "react";
import { Shield, Lock, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gray-900 h-screen">
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

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
              Secure chats for the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                privacy-conscious
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300 mb-8">
              Experience truly private conversations with NestChat's
              military-grade encryption. Your messages stay between you and your
              recipients - always.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={"/signup"}
                className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
              <button className="px-6 py-3 rounded-lg border border-gray-600 hover:border-emerald-500 text-white font-semibold transition-all duration-200">
                See How It Works
              </button>
            </div>
          </div>

          {/* Chat Preview */}
          <div className="lg:w-1/2">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Encrypted Chat</span>
                </div>
                <Lock className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-emerald-500 text-white rounded-lg rounded-tr-none p-3 max-w-xs">
                    Hey! How's it going?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white rounded-lg rounded-tl-none p-3 max-w-xs">
                    All good! Using NestChat for secure messaging 🔒
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-800 rounded-xl p-6 transform transition-all duration-200 hover:scale-105">
            <Shield className="h-8 w-8 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              End-to-End Encryption
            </h3>
            <p className="text-gray-400">
              Your messages are encrypted before leaving your device.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 transform transition-all duration-200 hover:scale-105">
            <MessageSquare className="h-8 w-8 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Secure Group Chats
            </h3>
            <p className="text-gray-400">
              Create encrypted groups for team collaboration.
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 transform transition-all duration-200 hover:scale-105">
            <Lock className="h-8 w-8 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Zero Knowledge
            </h3>
            <p className="text-gray-400">
              We can't read your messages, even if we wanted to.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
