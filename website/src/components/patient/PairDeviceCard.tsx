"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { pairingService } from "@/services/pairing.service";
import { Button } from "@/components/ui/button";
import { Smartphone, KeyRound, Hash, Copy, Check, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(null);
      return;
    }
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.round((target - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PairDeviceCard({ patientId }: { patientId: string }) {
  const [mode, setMode] = React.useState<"code" | "pin">("code");
  const [copied, setCopied] = React.useState(false);

  const codeMutation = useMutation({
    mutationFn: () => pairingService.createPairingCode(patientId),
  });
  const pinMutation = useMutation({
    mutationFn: () => pairingService.createPairingPin(patientId),
  });

  const activeMutation = mode === "code" ? codeMutation : pinMutation;
  const value =
    mode === "code" ? codeMutation.data?.pairing_code : pinMutation.data?.pin;
  const expiresAt =
    mode === "code" ? codeMutation.data?.expires_at : pinMutation.data?.expires_at;

  const secondsLeft = useCountdown(expiresAt ?? null);
  const isExpired = secondsLeft === 0;

  const handleGenerate = () => {
    setCopied(false);
    activeMutation.mutate();
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable - nothing to do, the code is visible on screen.
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Smartphone className="h-4 w-4 text-teal-700" />
        <h3 className="text-sm font-bold text-slate-900">Pair Patient Device</h3>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Generate a short-lived code so the patient app can connect to this profile.
        Enter it on the device&apos;s onboarding screen within the time shown.
      </p>

      {/* Mode Selector */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("code")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors",
            mode === "code" ? "bg-white text-teal-800 shadow-2xs" : "text-slate-500"
          )}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Pairing Code
        </button>
        <button
          type="button"
          onClick={() => setMode("pin")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors",
            mode === "pin" ? "bg-white text-teal-800 shadow-2xs" : "text-slate-500"
          )}
        >
          <Hash className="h-3.5 w-3.5" />
          4-Digit PIN
        </button>
      </div>

      {activeMutation.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Unable to generate a code right now. Please try again.</span>
        </div>
      )}

      {value && !isExpired ? (
        <div className="rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/40 p-5 text-center space-y-2">
          <span className="text-3xl font-bold tracking-[0.2em] text-teal-900">
            {value}
          </span>
          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="text-slate-500">
              Expires in <span className="font-semibold text-slate-700">{formatCountdown(secondsLeft)}</span>
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : value && isExpired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-800">
          This {mode === "code" ? "code" : "PIN"} has expired. Generate a new one below.
        </div>
      ) : null}

      <Button
        type="button"
        variant={value && !isExpired ? "outline" : "teal"}
        size="sm"
        className="w-full gap-2"
        onClick={handleGenerate}
        isLoading={activeMutation.isPending}
      >
        <RefreshCw className="h-4 w-4" />
        <span>
          {value ? `Generate New ${mode === "code" ? "Code" : "PIN"}` : `Generate ${mode === "code" ? "Pairing Code" : "PIN"}`}
        </span>
      </Button>
    </div>
  );
}
