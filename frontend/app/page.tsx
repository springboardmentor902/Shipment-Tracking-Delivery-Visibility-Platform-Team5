"use client";

import { useState } from "react";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CUSTOMER");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // =========================================================
  // SWITCH TO REGISTER
  // =========================================================

  const handleRegisterTab = () => {
    setIsLogin(false);
    setMessage("");
    setError("");
  };

  // =========================================================
  // SWITCH TO LOGIN
  // =========================================================

  const handleLoginTab = () => {
    setIsLogin(true);
    setMessage("");
    setError("");
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password,
            role: role,
          }),
        }
      );

      /*
       * Read as text first.
       * This prevents:
       * "Unexpected end of JSON input"
       */
      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            message: text,
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            `Registration failed (${response.status})`
        );
      }

      // Registration successful
      setMessage(
        "Registration successful! Please login with your account."
      );

      // Clear registration fields
      setFullName("");
      setPhone("");
      setPassword("");
      setRole("CUSTOMER");

      // Switch to login
      setTimeout(() => {
        setIsLogin(true);
      }, 800);

    } catch (err: any) {
      console.error("Registration error:", err);

      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError")
      ) {
        setError(
          "Cannot connect to the backend. Make sure Spring Boot is running on port 8080."
        );
      } else {
        setError(
          err.message || "Registration failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            message: text,
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            `Login failed (${response.status})`
        );
      }

      // Save JWT token
      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      if (data.accessToken) {
        localStorage.setItem(
          "token",
          data.accessToken
        );
      }

      if (data.jwt) {
        localStorage.setItem(
          "token",
          data.jwt
        );
      }

      // Save user information
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      localStorage.setItem(
        "userEmail",
        email.trim()
      );

      setMessage(
        "Login successful! Opening your dashboard..."
      );

      // Open shipments/dashboard page
      setTimeout(() => {
        window.location.href = "/shipments";
      }, 700);

    } catch (err: any) {
      console.error("Login error:", err);

      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError")
      ) {
        setError(
          "Cannot connect to the backend. Make sure Spring Boot is running on port 8080."
        );
      } else {
        setError(
          err.message || "Invalid email or password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(
        "Enter your email first, then click Send Reset."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/forgot-password",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const text = await response.text();

      let data: any = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            message: text,
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            text ||
            `Request failed (${response.status})`
        );
      }

      setMessage(
        data.message ||
          "Password reset request submitted."
      );

      setShowForgot(false);

    } catch (err: any) {
      console.error("Forgot password error:", err);

      if (err.message?.includes("404")) {
        setError(
          "Forgot password is not implemented in the backend yet."
        );
      } else if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError")
      ) {
        setError(
          "Cannot connect to the backend."
        );
      } else {
        setError(
          err.message ||
            "Unable to process password reset."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#06111f] text-white overflow-hidden relative">

      {/* Background */}

      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl" />

      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" />

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">

        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <section className="hidden lg:block">

            <div className="flex items-center gap-4 mb-10">

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">

                <span className="text-2xl font-black">
                  S
                </span>

              </div>

              <div>

                <h1 className="text-3xl font-bold">
                  ShipTrack{" "}
                  <span className="text-cyan-400">
                    Pro
                  </span>
                </h1>

                <p className="text-xs tracking-[0.35em] text-slate-400 mt-1">
                  LOGISTICS INTELLIGENCE
                </p>

              </div>

            </div>


            <p className="text-cyan-400 tracking-[0.35em] text-sm font-semibold mb-5">
              ONE PLATFORM. EVERY MOVEMENT.
            </p>


            <h2 className="text-6xl font-black leading-[1.05]">

              Move smarter.
              <br />

              Deliver{" "}

              <span className="text-cyan-400">
                better.
              </span>

            </h2>


            <p className="mt-7 max-w-xl text-slate-400 text-lg leading-8">

              A centralized workspace for creating,
              managing and monitoring every shipment
              across your logistics network.

            </p>


            {/* Creative feature cards */}

            <div className="grid grid-cols-2 gap-4 max-w-xl mt-10">

              <FeatureCard
                icon="◈"
                title="Live Tracking"
                description="Monitor shipment movement."
              />

              <FeatureCard
                icon="↗"
                title="Smart Operations"
                description="Simplify logistics workflows."
              />

              <FeatureCard
                icon="◎"
                title="Secure Access"
                description="JWT protected workspace."
              />

              <FeatureCard
                icon="✓"
                title="Faster Delivery"
                description="Keep deliveries organized."
              />

            </div>

          </section>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <section className="w-full max-w-xl mx-auto">

            <div className="rounded-[30px] border border-white/10 bg-white/[0.07] backdrop-blur-2xl shadow-2xl overflow-hidden">

              <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

              <div className="p-7 sm:p-10">

                {/* Mobile logo */}

                <div className="lg:hidden flex items-center gap-3 mb-8">

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">

                    <span className="font-black text-xl">
                      S
                    </span>

                  </div>

                  <h1 className="text-xl font-bold">
                    ShipTrack{" "}
                    <span className="text-cyan-400">
                      Pro
                    </span>
                  </h1>

                </div>


                {/* Heading */}

                <div className="mb-7">

                  <p className="text-cyan-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">

                    {isLogin
                      ? "Welcome Back"
                      : "Get Started"}

                  </p>

                  <h2 className="text-3xl font-bold">

                    {isLogin
                      ? "Sign in to continue."
                      : "Create your account."}

                  </h2>

                  <p className="text-slate-400 mt-2">

                    {isLogin
                      ? "Access your shipment command center."
                      : "Join ShipTrack Pro and manage shipments with ease."}

                  </p>

                </div>


                {/* Tabs */}

                <div className="grid grid-cols-2 p-1 bg-black/20 rounded-xl mb-7">

                  <button
                    type="button"
                    onClick={handleLoginTab}
                    className={`py-3 rounded-lg font-semibold transition ${
                      isLogin
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sign In
                  </button>


                  <button
                    type="button"
                    onClick={handleRegisterTab}
                    className={`py-3 rounded-lg font-semibold transition ${
                      !isLogin
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Register
                  </button>

                </div>


                {/* Success message */}

                {message && (

                  <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">

                    {message}

                  </div>

                )}


                {/* Error */}

                {error && (

                  <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">

                    {error}

                  </div>

                )}


                {/* =================================================
                    LOGIN
                ================================================= */}

                {isLogin ? (

                  <form
                    onSubmit={handleLogin}
                    className="space-y-5"
                  >

                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="Enter your email"
                        required
                        className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                      />

                    </div>


                    <div>

                      <div className="flex justify-between items-center mb-2">

                        <label className="text-sm font-medium text-slate-300">
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            setShowForgot(true)
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          Forgot password?
                        </button>

                      </div>


                      <div className="relative">

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Enter your password"
                          required
                          className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 pr-16 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                    </div>


                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
                    >

                      {loading
                        ? "Signing in..."
                        : "Sign In →"}

                    </button>

                  </form>

                ) : (

                  /* =================================================
                     REGISTER
                  ================================================= */

                  <form
                    onSubmit={handleRegister}
                    className="space-y-5"
                  >

                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) =>
                          setFullName(e.target.value)
                        }
                        placeholder="Enter your full name"
                        required
                        className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                      />

                    </div>


                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="Enter your email"
                        required
                        className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                      />

                    </div>


                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Phone
                      </label>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value)
                        }
                        placeholder="Enter your phone number"
                        required
                        className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                      />

                    </div>


                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Role
                      </label>

                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className="w-full h-14 rounded-xl border border-white/10 bg-[#0c1a2b] px-4 text-white outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                        <option value="LOGISTICS_OPERATOR">
                          Logistics Operator
                        </option>
                      </select>

                    </div>


                    <div>

                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Password
                      </label>

                      <div className="relative">

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Create a password"
                          required
                          className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 pr-16 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 transition"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword
                            ? "Hide"
                            : "Show"}
                        </button>

                      </div>

                    </div>


                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
                    >

                      {loading
                        ? "Creating account..."
                        : "Create Account →"}

                    </button>

                  </form>

                )}


                <div className="mt-7 text-center text-xs text-slate-500">

                  ShipTrack Pro
                  <span className="mx-2">
                    •
                  </span>
                  Secure Logistics Workspace

                </div>

              </div>

            </div>

          </section>

        </div>

      </div>


      {/* =================================================
          FORGOT PASSWORD MODAL
      ================================================= */}

      {showForgot && (

        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1a2b] p-7 shadow-2xl">

            <div className="flex justify-between items-center mb-5">

              <div>

                <h3 className="text-2xl font-bold">
                  Reset password
                </h3>

                <p className="text-sm text-slate-400 mt-1">
                  Enter your registered email.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForgot(false)
                }
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>

            </div>


            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              className="w-full h-14 rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/70"
            />


            <div className="grid grid-cols-2 gap-3 mt-5">

              <button
                type="button"
                onClick={() =>
                  setShowForgot(false)
                }
                className="h-12 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 font-semibold disabled:opacity-50"
              >
                {loading
                  ? "Sending..."
                  : "Send Reset"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}


/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5 hover:bg-white/[0.07] transition">

      <div className="text-cyan-400 text-2xl mb-3">
        {icon}
      </div>

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>

    </div>
  );
}