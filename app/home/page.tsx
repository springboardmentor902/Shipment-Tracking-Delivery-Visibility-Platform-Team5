"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    router.replace("/");
  };

  return (
    <main className="dashboard-page">

      <nav className="dashboard-nav">
        <div className="dashboard-brand">
          ShipTrack
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </nav>

      <section className="dashboard-content">

        <div className="dashboard-header">
          <h1>Welcome to ShipTrack</h1>

          <p>
            Manage shipments, monitor deliveries and
            track shipments in real time.
          </p>
        </div>

        <div className="dashboard-grid">

          {/* 1. SHIPMENTS */}
          <button
            type="button"
            className="dashboard-card"
            onClick={() => router.push("/shipments")}
          >
            <span>📦</span>

            <h2>Shipments</h2>

            <p>
              Create and manage your shipments.
            </p>
          </button>


          {/* 2. TRACK SHIPMENT */}
          <button
            type="button"
            className="dashboard-card"
            onClick={() => router.push("/tracking")}
          >
            <span>📍</span>

            <h2>Track Shipment</h2>

            <p>
              View live shipment location and route.
            </p>
          </button>


          {/* 3. LIVE MONITORING */}
          <button
            type="button"
            className="dashboard-card"
            onClick={() => router.push("/monitoring")}
          >
            <span>🚚</span>

            <h2>Live Monitoring</h2>

            <p>
              Monitor delivery progress and
              route details in real time.
            </p>
          </button>


          {/* 4. ETA PREDICTION */}
          <button
            type="button"
            className="dashboard-card"
            onClick={() => router.push("/eta")}
          >
            <span>⏱️</span>

            <h2>ETA Prediction</h2>

            <p>
              View predicted delivery time and
              delay risk.
            </p>
          </button>

        </div>

      </section>
    </main>
  );
}