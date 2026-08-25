"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            email,
            password,
            phone,
            role,
          }),
        }
      );

      const text = await response.text();

      console.log("Status:", response.status);
      console.log("Response:", text);

      if (!response.ok) {
        alert(text || "Registration failed");
        return;
      }

      alert("Registration successful! Please login.");

      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-container">
      <div className="register-card">
        <h1>Create Account</h1>

        <p>
          Register for your ShipTrack account
        </p>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="fullName">
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              required
            />
          </div>

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
            <label htmlFor="phone">
              Phone
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
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
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              Role
            </label>

            <select
              id="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              required
            >
              <option value="CUSTOMER">
                Customer
              </option>

              <option value="BUSINESS_CLIENT">
                Business Client
              </option>

              <option value="LOGISTICS_OPERATOR">
                Logistics Operator
              </option>

              <option value="SUPPORT_AGENT">
                Support Agent
              </option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Register"}
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <a href="/login">
            Login
          </a>
        </p>

        <button
          type="button"
          className="back-home-button"
          onClick={() => router.push("/")}
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}