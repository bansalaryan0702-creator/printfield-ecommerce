import { apiFetch } from "../lib/api";
import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { AppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import { signInWithGoogle, getGoogleAccessToken } from "../lib/firebase";

import { SEO } from "../components/SEO";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setToken, setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handlePostAuthRedirect = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get("redirect");
    const safeRedirects = ["/", "/checkout", "/orders", "/profile", "/categories"];
    if (redirect && safeRedirects.includes(redirect)) {
      navigate(redirect);
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin ? "/api/users/login" : "/api/users/register";
    const body = isLogin ? { email, password } : { email, password, name, phone, companyName };

    try {
      const res = await apiFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setToken(data.token);
      setUser(data.user);
      handlePostAuthRedirect();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      const idToken = result.idToken || (await result.getIdToken());
      const googleAccessToken = result.googleAccessToken || (await getGoogleAccessToken());

      const res = await apiFetch("/api/users/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, googleAccessToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      setToken(data.token);
      setUser(data.user);
      handlePostAuthRedirect();
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login | Printfield" description="Login or create an account at Printfield." canonicalUrl="/login" robots="noindex, nofollow" />
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <img referrerPolicy="no-referrer"
            src="/logo.png"
            alt="Printfield"
            className="mx-auto h-12 w-auto object-contain"
            loading="lazy"
            width="48"
            height="48"
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? "Sign in to your account" : "Create an account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Printfield Inc."
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                {isLogin && (
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-purple-600 hover:text-purple-500">
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 font-medium py-2.5"
              >
                {loading ? "Please wait..." : (isLogin ? "Sign in" : "Create Account")}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                disabled={loading || googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 border-gray-300 hover:bg-gray-50 transition-colors shadow-xs text-gray-700 font-medium"
              >
                {googleLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? "New to Printfield?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
              >
                {isLogin ? "Create Account" : "Sign in instead"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
