"use client";
import React, { useState, useRef, useEffect } from "react";
import { Lock, Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import { useSearchParams, useRouter, redirect } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { useAppData, user_service } from "@/context/AppContext";
// import { chat_service } from "@/context/AppContext";
import Loading from "./Loading";
import toast from "react-hot-toast";

const VerifyOtp = () => {
  const {
    isAuth,
    setIsAuth,
    setUser,
    loading: userLoading,
    fetchChats,
    fetchUsers,
  } = useAppData();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(59);

  // ✅ Correct TypeScript syntax for input refs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [email, setEmail] = useState<string>(
    () => searchParams?.get("email") || ""
  );

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Handle OTP input typing
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Move to next input automatically
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste event (auto-fill OTP)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("Text").slice(0, 6).split("");
    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length && i < 6; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${user_service}/api/v1/verify-otp`, {
        email,
        otp: otpValue,
      });

  const { responseCode, token, user } = res.data;

      if (responseCode === 200) {
        toast.success("OTP Verified!");

        Cookies.set("token", token, {
          expires: 7,
          secure: false,
          path: "/",
        });

        setUser(user);
        setIsAuth(true);
        fetchChats?.();
        fetchUsers?.();

        // router.push("/chat");
        redirect("/chat");
      } else {
        toast.error("Verification Failed");
      }

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error("Verification failed. Try again.");
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Verification failed. Try again."
        );
      } else {
        setError(String(err) || "Verification failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    try {
      const res = await axios.post(`${user_service}/api/v1/login`, {
        email,
      });
      console.log("Response:", res.data);
      toast.success(res.data.message);
      setTimer(59);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to resend OTP. Try again."
        );
      } else {
        setError(String(err) || "Failed to resend OTP. Try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };
   
  if (userLoading) return <Loading />;
  if (isAuth) redirect("/chat");

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-lg">
          {/* Header Section */}
          <div className="text-center mb-8 relative">
            <button
              className="absolute top-0 left-0 p-2 text-gray-300 hover:text-white"
              onClick={() => router.push("/login")}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-300 text-lg">
              We have sent a 6-digit verification code to
            </p>
            <p className="text-blue-400 font-medium text-sm">{email}</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                Enter your 6-digit code below
              </label>

              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    className="w-10 h-12 text-center text-2xl rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-center mt-3 text-sm">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-semibold rounded-lg transition duration-300 flex items-center justify-center ${
                loading
                  ? "bg-blue-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin inline-block mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify
                  <ArrowRight className="inline-block ml-2" />
                </>
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-4">Didn&apos;t receive the code?</p>
            {timer > 0 ? (
              <p className="text-gray-500 text-sm">
                Resend code in 00:{timer < 10 ? `0${timer}` : timer} sec
              </p>
            ) : (
              <button
                onClick={async () => {
                  // Prevent double clicks while loading
                  if (resendLoading) return;
                  setTimer(59);
                  await handleResendOtp();
                }}
                disabled={resendLoading}
                className={`text-sm font-medium ${
                  resendLoading
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-blue-400 hover:underline"
                }`}
              >
                {resendLoading ? "Resending..." : "Resend Code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
