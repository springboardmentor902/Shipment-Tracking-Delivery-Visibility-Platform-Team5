"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const text = await response.text();

      console.log("Status:", response.status);
      console.log("Response:", text);

      if (!response.ok) {
        alert(text || "Login failed");
        return;
      }

      if (!text) {
        alert("Login response is empty");
        return;
      }

      const data = JSON.parse(text);

      console.log("Login data:", data);

      if (!data.token) {
        alert("Token not received");
        return;
      }

      if (!data.user || !data.user.id) {
        alert("User details not received");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // IMPORTANT:
      // Save logged-in user details because HomePage
      // needs the user ID to load notifications.
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      console.log("Logged-in user:", data.user);
      console.log("User ID:", data.user.id);

      alert("Login successful!");

      router.push("/home");

    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to server");
    }
  };

  return (
    <main className="login-container">
      <div className="login-card">

        <h1>Welcome Back</h1>

        <p>
          Login to your ShipTrack account
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          <button type="submit">
            Login
          </button>

        </form>

        <p className="register-link">
          Don&apos;t have an account?{" "}
          <a href="/register">
            Register
          </a>
        </p>

      </div>
    </main>
  );
}