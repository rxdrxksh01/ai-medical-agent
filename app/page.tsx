"use client";

import { UserButton, useUser } from "@clerk/nextjs";

import { motion } from "motion/react";
import { FeatureBentoGrid } from "./_component/FeatureBentoGrid";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function Home() {
  return (
    <div className="relative min-h-screen pt-24 pb-10 flex flex-col items-center justify-center bg-white dark:bg-black">
      <Navbar />
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      {/* ... (rest of the content) ... */}


      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Your Personal AI Health Assistant – Always Available"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 0.8,
          }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
        >
          Describe your symptoms naturally to our AI Voice Agent. Get instant health insights, specialist recommendations, and guidance—while knowing when to consult a real doctor.
        </motion.p>
        <Link href={"/sign-in"}>
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.3,
              delay: 1,
            }}
            className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button className="w-60 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
              Explore Now
            </button>
          </motion.div>
        </Link>
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 1.2,
          }}
          className="relative z-10 mt-20 w-full max-w-5xl rounded-3xl border border-neutral-200 bg-neutral-100 p-2 md:p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* Main Visual Container */}
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black h-[550px] md:h-[600px] shadow-inner relative flex flex-col md:flex-row">

            {/* Concept 1: Symptom Analysis Flow (Left/Top) */}
            <div className="flex-1 p-6 relative flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
              <div className="absolute top-4 left-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1: Analysis</div>

              {/* Animated Pulse Ring */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                <div className="relative h-24 w-24 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
              </div>

              {/* Processing List */}
              <div className="space-y-3 w-full max-w-xs">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Processing Audio Input...</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.0, repeat: Infinity, repeatDelay: 3 }}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Identifying Symptoms</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.5, repeat: Infinity, repeatDelay: 3 }}
                  className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800"
                >
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Match Found: Neurologist</span>
                </motion.div>
              </div>
            </div>

            {/* Concept 2: Doctor Matching (Right/Bottom) */}
            <div className="flex-1 p-6 relative bg-gray-50/50 dark:bg-neutral-900/20 flex flex-col items-center justify-center">
              <div className="absolute top-4 left-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2: Match</div>

              <div className="relative w-full max-w-sm">
                {/* Background Cards */}
                <div className="absolute top-0 left-4 right-4 h-full bg-white dark:bg-neutral-800 rounded-2xl shadow-sm transform scale-95 translate-y-2 opacity-60"></div>
                <div className="absolute top-0 left-2 right-2 h-full bg-white dark:bg-neutral-800 rounded-2xl shadow-md transform scale-98 translate-y-1 opacity-80"></div>

                {/* Main Card */}
                <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-xl">DR</div>
                      <div>
                        <h4 className="font-bold text-lg dark:text-white">Dr. Sarah Chen</h4>
                        <p className="text-sm text-purple-600 font-medium">Top Rated Specialist</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">98% Match</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "95%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Expertise Match</span>
                      <span className="text-green-600 font-bold">High</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium">Book Now</button>
                    <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
      <FeatureBentoGrid />

    </div>
  );
}

const Navbar = () => {
  const { user } = useUser();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between border-b border-neutral-200 bg-white/50 px-4 py-4 backdrop-blur-md dark:border-neutral-800 dark:bg-black/50">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
        <h1 className="text-base font-bold md:text-2xl">AI-Medical Voice Agent</h1>
      </div>
      {!user ?
        <Link href={"/sign-in"}><button className="w-24 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 md:w-32 dark:bg-white dark:text-black dark:hover:bg-gray-200">
          Login
        </button></Link> :
        <div className="flex items-center gap-2">
          <UserButton />
          <Link href="/dashboard">
            <Button>Dashboard</Button>
          </Link>
        </div>}
    </nav>
  );
};  
