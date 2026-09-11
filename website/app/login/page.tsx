"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, loginWithGoogle, isLoading, error, forgotPassword } =
    useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotSubmitted, setForgotSubmitted] = React.useState(false);
  const [forgotError, setForgotError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === "family" ? "/family" : "/caregiver");
    }
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Error handled by useAuth state
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError(null);
    try {
      await forgotPassword({ email: forgotEmail });
      setForgotSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || "Unable to process request.";
      setForgotError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Healthcare Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-soft mb-4">
            <Heart className="h-7 w-7 fill-white/20" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            GeriCare <span className="text-teal-600">AI</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            Caregiver & Family Portal
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Compassionate, intelligent care support for dementia families
          </p>
        </div>

        {/* Authentication Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Access real-time companion signals, memory management, and caregiver alerts.
            </p>
          </div>

          {/* Service unavailable / login error banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to sign in right now.</p>
                  <p className="mt-0.5 text-red-700">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="self-end inline-flex items-center gap-1 font-semibold text-red-800 hover:text-red-950 underline"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="caregiver@gericare.ai"
                autoComplete="email"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-teal-700 hover:text-teal-800 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  {...register("rememberMe")}
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="teal"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Sign in to Portal
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 uppercase tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Continue with Google */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={loginWithGoogle}
            disabled={isLoading}
          >
            <svg
              className="mr-2.5 h-4 w-4"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Link to Sign Up */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
              Sign up
            </Link>
          </p>

          {/* Healthcare Safety Notice */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            <span>HIPAA-aligned encrypted healthcare access</span>
          </div>
        </div>

        {/* Forgot Password Modal */}
        <Modal
          isOpen={isForgotModalOpen}
          onClose={() => {
            setIsForgotModalOpen(false);
            setForgotSubmitted(false);
            setForgotError(null);
          }}
          title="Reset your password"
          description="Enter your registered caregiver or family email to receive reset instructions."
          maxWidth="sm"
        >
          {forgotSubmitted ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                Reset Link Sent
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                If an account exists for {forgotEmail}, password reset instructions have been dispatched.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-5 w-full"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-2">
              {forgotError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  {forgotError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="caregiver@gericare.ai"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  size="sm"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
}
