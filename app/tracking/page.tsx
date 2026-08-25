"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackingSearchPage() {
  const router = useRouter();
  const [shipmentId, setShipmentId] = useState("");

  const handleTrack = (e: FormEvent) => {
    e.preventDefault();

    const id = shipmentId.trim();

    if (!id) {
      return;
    }

    router.push(`/tracking/${id}`);
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>

        <div style={styles.icon}>📍</div>

        <h1 style={styles.title}>
          Track Your Shipment
        </h1>

        <p style={styles.description}>
          Enter your shipment ID to view live location,
          route and delivery information.
        </p>

        <form onSubmit={handleTrack} style={styles.form}>

          <label
            htmlFor="shipmentId"
            style={styles.label}
          >
            Shipment ID
          </label>

          <input
            id="shipmentId"
            type="number"
            placeholder="Enter shipment ID"
            value={shipmentId}
            onChange={(e) =>
              setShipmentId(e.target.value)
            }
            style={styles.input}
            required
          />

          <button
            type="submit"
            style={styles.button}
          >
            Track Shipment
          </button>

        </form>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => router.push("/home")}
        >
          Back to Home
        </button>

      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f3f6fb",
    padding: "20px",
    boxSizing: "border-box" as const,
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.12)",
    boxSizing: "border-box" as const,
  },

  icon: {
    fontSize: "45px",
    marginBottom: "15px",
  },

  title: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "30px",
    fontWeight: 700,
  },

  description: {
    color: "#475569",
    lineHeight: 1.6,
    margin: "0 0 25px",
    fontSize: "16px",
  },

  form: {
    width: "100%",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    color: "#374151",
    fontSize: "15px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "16px",
    marginBottom: "15px",
    color: "#111827",
    background: "#ffffff",
    outline: "none",
  },

  button: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  backButton: {
    width: "100%",
    marginTop: "12px",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#374151",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
  },
};