"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  Bot,
  Brain,
  ShieldCheck,
  LineChart,
  Users,
  BookHeart,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs group-hover:bg-teal-700 transition-colors">
              <Heart className="h-5 w-5 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                GeriCare <span className="text-teal-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">
                Compassionate Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-teal-700 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-teal-700 transition-colors">
              How It Works
            </a>
            <a href="#companion" className="hover:text-teal-700 transition-colors">
              Companion
            </a>
            <a href="#safety" className="hover:text-teal-700 transition-colors">
              Safety & Ethics
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href={user.role === "family" ? "/family" : "/caregiver"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
              >
                <span>Open Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/caregiver/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/caregiver"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
                >
                  <span>Launch Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-teal-100/40 blur-3xl" />
          <div className="h-[400px] w-[500px] rounded-full bg-emerald-50/60 blur-3xl -translate-y-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-xs font-semibold text-teal-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>Stage-Adaptive AI Companionship & Caregiver Reassurance</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
            Compassionate AI companionship designed for every stage of dementia.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Personalized voice interactions grounded in family memories, gentle reassurance,
            and real-time distress telemetry — giving caregivers peace of mind and loved ones familiar comfort.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/caregiver"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <Bot className="h-4 w-4" />
              <span>Caregiver Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/family"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-2xs hover:shadow-sm"
            >
              <Users className="h-4 w-4 text-teal-600" />
              <span>Family Circle Portal</span>
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Stages</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Early • Mid • Late</p>
              <p className="text-xs text-slate-500 mt-1">Adaptive cognitive framing</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Interaction</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Voice & Memory</p>
              <p className="text-xs text-slate-500 mt-1">Familiar personal grounding</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Insights</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Distress Signals</p>
              <p className="text-xs text-slate-500 mt-1">Repetition & evening patterns</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Safety</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Zero Hallucination</p>
              <p className="text-xs text-slate-500 mt-1">Strict clinical boundary</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Preview Card */}
      <section id="companion" className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Live Companion Telemetry</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Real-time conversational context with ethical guardrails
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              While the patient interacts naturally with voice, caregivers view structured insights without intrusive audio eavesdropping.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 shadow-card max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Dialogue flow */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900">Active Live Interaction</span>
                  </div>
                  <span className="text-xs text-slate-500">Configured Stage: Mid</span>
                </div>

                <div className="space-y-3 font-sans">
                  {/* Patient speech bubble */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      P
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-slate-200 shadow-2xs text-xs text-slate-800 leading-relaxed max-w-md">
                      &ldquo;Where is everyone? I was wondering if Priya was coming by today.&rdquo;
                    </div>
                  </div>

                  {/* Assistant speech bubble */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="p-3.5 rounded-2xl rounded-tr-xs bg-teal-600 text-white shadow-xs text-xs leading-relaxed max-w-md">
                      &ldquo;Priya called earlier and said she will be visiting at five o&rsquo;clock after work. Would you like to listen to some soft classical music while we wait?&rdquo;
                    </div>
                    <div className="h-8 w-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/60 text-xs text-teal-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
                  <span><strong>AI Strategy Applied:</strong> Gentle validation, time reassurance, and soothing comfort redirection.</span>
                </div>
              </div>

              {/* Right Column: Caregiver Context Stream */}
              <div className="lg:col-span-5 space-y-3.5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Care Telemetry & Observations
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Detected Intent</span>
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">Seeking reassurance / family</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Emotional State</span>
                    <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">Mild uncertainty</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Interaction Tension Score</span>
                    <span className="font-bold text-emerald-700">18 / 100 (Low risk)</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Referenced Memory</span>
                    <span className="font-medium text-teal-700 truncate max-w-[160px]">Daughter Priya Routine</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Escalation Status</span>
                    <span className="font-semibold text-emerald-700">Nominal · No alert required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Feature Pillars */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Comprehensive Platform</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed around dignity, memory, and calm
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Every feature is calibrated to reduce anxiety, reinforce identity, and keep caregivers informed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Pillar 1 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs hover:shadow-card transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Stage-Adaptive Dialogue</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Adapts conversational depth, sentence complexity, and guidance strategies across Early, Mid, and Late dementia stages.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Early: Cognitive games & active reminiscing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Mid: Gentle reassurance & simple choices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Late: Calming music, loved-one voices & presence</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs hover:shadow-card transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Caregiver Intelligence</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tracks distress trajectory over 7, 14, and 30 days, recurring semantic repetition patterns, and evening sundowning indicators.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                  <span>Distress tension curve & trend forecasting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                  <span>24-hour interaction rhythm heatmap</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                  <span>Automated safety alerts with clinical resolution logs</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs hover:shadow-card transition-all space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <BookHeart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Curated Care Content</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage personal memories, family voice greetings, calming music tracks, and cognitive activities in one cohesive space.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Voice greeting recorder for family members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Memory cards with sensitive topic guardrails</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>Instant device pairing via 4-digit PIN & QR code</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Seamless Setup</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How GeriCare AI works in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-3 p-6 rounded-2xl bg-[#FAFAF7] border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900">Build the Patient&rsquo;s World</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Caregivers enter biographical milestones, favorite music, daily routines, and invite family members to record warm voice greetings.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-[#FAFAF7] border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900">Pair the Companion App</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect the patient&rsquo;s tablet or phone with a secure 4-digit PIN. The companion greets them with familiar context and reassuring voice.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-2xl bg-[#FAFAF7] border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900">Continuous Peace of Mind</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review daily interaction volume, distress trend trajectory, and receive instant alerts if unusual disorientation is detected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Safety, Privacy & Ethics */}
      <section id="safety" className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-teal-500/10 blur-2xl" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Ethical & Clinical Principles</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dignity, privacy, and safety are non-negotiable.
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs text-slate-300">
              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">Non-Clinical Language</h5>
                <p className="leading-relaxed text-slate-400">
                  Insights reflect conversational comfort and observational indicators, never synthetic diagnostic claims or medical advice.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">Granular Consent & Access</h5>
                <p className="leading-relaxed text-slate-400">
                  Strict caregiver-governed permissions determine which family members can view updates or add memories.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">Zero Hallucination Guardrails</h5>
                <p className="leading-relaxed text-slate-400">
                  The AI companion will never fabricate deceased relatives, validate harmful delusions, or contradict established routines.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-white text-sm">Secure Data Encryption</h5>
                <p className="leading-relaxed text-slate-400">
                  All conversational telemetry, audio recordings, and family memories are encrypted at rest and in transit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-16 bg-white border-t border-slate-200/80 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Ready to enhance daily care for your loved one?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Access the Caregiver Dashboard to configure stage settings, add loved-one memories, or launch the companion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/caregiver"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm"
            >
              <span>Open Caregiver Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/family"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all"
            >
              <span>Family Circle Access</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-slate-200 bg-[#FAFAF7] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Heart className="h-3.5 w-3.5 fill-white/20" />
            </div>
            <span className="font-bold text-slate-800">GeriCare AI</span>
            <span>· Compassionate dementia care companion</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} GeriCare AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
