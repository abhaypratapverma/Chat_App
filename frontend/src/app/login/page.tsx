"use client";

import Loading from "../../components/Loading";
import { useAppData } from "@/context/AppContext";

import React, { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";
import { useRouter, redirect } from "next/navigation";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { isAuth, loading: userLoading } = useAppData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post("http://localhost:5000/api/v1/login", {
        email,
      });
      console.log("Response:", data);

      if (data.responseCode === 200) {
        toast.success(data.message);
      
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data?.message || "Something went wrong.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(
        error?.response?.data?.message ||
          "Server error, please try again later."
      );
    } finally {
      setLoading(false);
    }
  };
  if (userLoading) <Loading />;
  if (isAuth) {
    redirect("/chat");
  }
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-lg">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <Mail size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome to ChatApp
            </h1>
            <p className="text-gray-300 text-lg">
              Enter your email to continue your journey.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
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
                  Sending OTP to your email...
                </>
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="inline-block ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
