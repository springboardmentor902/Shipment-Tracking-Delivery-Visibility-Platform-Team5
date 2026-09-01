"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PodPage() {
  const router = useRouter();
  const [shipmentId, setShipmentId] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const id = shipmentId.trim();

    if (!id) {
      alert("Please enter Shipment ID");
      return;
    }

    if (!/^\d+$/.test(id)) {
      alert("Shipment ID must be a number");
      return;
    }

    router.push(`/pod/${id}`);
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>📦</div>

        <h1 style={styles.title}>Complete Delivery</h1>

        <p style={styles.description}>
          Submit proof of delivery for a completed shipment.
          Enter the shipment ID to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>
            Shipment ID
          </label>

          <input
            type="text"
            placeholder="Enter shipment ID"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            style={styles.input}
          />

          <button type="submit" style={styles.primaryButton}>
            Continue
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/home")}
          style={styles.secondaryButton}
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
  },

  card: {
    width: "100%",
    maxWidth: "500px",
    background: "#ffffff",
    padding: "42px",
    borderRadius: "20px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.12)",
  },

  icon: {
    fontSize: "45px",
    marginBottom: "18px",
  },

  title: {
    margin: "0 0 10px",
    color: "#111827",
    fontSize: "32px",
  },

  description: {
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "30px",
  },

  label: {
    display: "block",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "16px",
    outline: "none",
    marginBottom: "16px",
  },

  primaryButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    width: "100%",
    padding: "13px",
    marginTop: "15px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#1f2937",
    fontSize: "16px",
    cursor: "pointer",
  },
};