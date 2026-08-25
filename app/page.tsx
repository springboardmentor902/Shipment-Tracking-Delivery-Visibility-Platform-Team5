"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      alert("Please enter a tracking number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/shipments/track?trackingNumber=${encodeURIComponent(
          trackingNumber.trim()
        )}`
      );

      const text = await response.text();

      if (!response.ok) {
        alert(text || "Shipment not found");
        return;
      }

      const shipment = JSON.parse(text);

      if (!shipment.id) {
        alert("Invalid shipment response");
        return;
      }

      router.push(`/tracking/${shipment.id}`);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <div className="brand">
          ShipTrack
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-login"
            onClick={() => router.push("/login")}
          >
            Login
          </button>

          <button
            type="button"
            className="nav-register"
            onClick={() => router.push("/register")}
          >
            Register
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">
            Live Delivery Monitoring
          </span>

          <h1>
            Track Your Shipment
            <br />
            <span>Anywhere, Anytime</span>
          </h1>

          <p>
            Enter your tracking number to view shipment status,
            live location, route information and delivery updates.
          </p>

          <form
            className="tracking-form"
            onSubmit={handleTrack}
          >
            <input
              type="text"
              placeholder="Enter your tracking number"
              value={trackingNumber}
              onChange={(e) =>
                setTrackingNumber(e.target.value)
              }
            />

            <button type="submit" disabled={loading}>
              {loading ? "Tracking..." : "Track Shipment"}
            </button>
          </form>

          <div className="auth-message">
            <span>Have an account?</span>

            <button
              type="button"
              onClick={() => router.push("/login")}
            >
              Login
            </button>

            <span>or</span>

            <button
              type="button"
              onClick={() => router.push("/register")}
            >
              create an account
            </button>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>Shipment Tracking</h3>
          <p>
            Check your shipment status and delivery information
            using your tracking number.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Live Tracking</h3>
          <p>
            View the current shipment location and planned route
            on the map.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⏱️</div>
          <h3>ETA Prediction</h3>
          <p>
            View estimated delivery time and delay-risk
            information.
          </p>
        </div>
      </section>
    </main>
  );
}