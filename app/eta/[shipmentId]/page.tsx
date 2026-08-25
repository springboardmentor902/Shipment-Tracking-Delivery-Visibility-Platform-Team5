"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ETAData = {
  id?: number;
  shipmentId?: number;
  predictedDeliveryTime?: string;
  delayRiskScore?: number;
  confidenceScore?: number;
  factors?: string;
  calculatedAt?: string;
};

export default function ETADetailsPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = params.shipmentId as string;

  const [eta, setEta] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchETA = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          `http://localhost:8080/api/eta/${shipmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const text = await response.text();

        if (!response.ok) {
          setError(text || "Unable to load ETA prediction");
          return;
        }

        if (!text) {
          setError("No ETA prediction available");
          return;
        }

        const data = JSON.parse(text);

        setEta(data);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (shipmentId) {
      fetchETA();
    }
  }, [shipmentId, router]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h2>Loading ETA Prediction...</h2>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>ETA Prediction</h1>

          <div style={styles.error}>
            {error}
          </div>

          <button
            onClick={() => router.push("/eta")}
            style={styles.button}
          >
            Try Another Shipment
          </button>

          <button
            onClick={() => router.push("/home")}
            style={styles.backButton}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (!eta) {
    return null;
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>ETA Prediction</h1>
            <p style={styles.subtitle}>
              Shipment #{shipmentId}
            </p>
          </div>

          <div style={styles.badge}>
            Prediction Available
          </div>
        </div>

        <div style={styles.mainETA}>
          <span style={styles.smallLabel}>
            Predicted Delivery Time
          </span>

          <strong style={styles.etaTime}>
            {eta.predictedDeliveryTime
              ? new Date(
                  eta.predictedDeliveryTime
                ).toLocaleString()
              : "Not available"}
          </strong>
        </div>

        <div style={styles.grid}>
          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>
              Delay Risk Score
            </span>

            <strong style={styles.infoValue}>
              {eta.delayRiskScore ?? "N/A"}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>
              Confidence Score
            </span>

            <strong style={styles.infoValue}>
              {eta.confidenceScore ?? "N/A"}%
            </strong>
          </div>
        </div>

        <div style={styles.factors}>
          <h2>Prediction Factors</h2>

          <p>
            {eta.factors || "No prediction factors available."}
          </p>
        </div>

        <div style={styles.calculated}>
          <strong>Calculated At:</strong>{" "}
          {eta.calculatedAt
            ? new Date(eta.calculatedAt).toLocaleString()
            : "N/A"}
        </div>

        <div style={styles.actions}>
          <button
            onClick={() => router.push("/eta")}
            style={styles.button}
          >
            Track Another Shipment
          </button>

          <button
            onClick={() => router.push("/home")}
            style={styles.backButton}
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px 20px",
  },

  container: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.12)",
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.12)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  badge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "10px 16px",
    borderRadius: "20px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  mainETA: {
    background: "#eff6ff",
    padding: "28px",
    borderRadius: "15px",
    marginBottom: "20px",
  },

  smallLabel: {
    display: "block",
    color: "#64748b",
    marginBottom: "10px",
  },

  etaTime: {
    display: "block",
    color: "#1d4ed8",
    fontSize: "25px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },

  infoCard: {
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
  },

  infoLabel: {
    display: "block",
    color: "#64748b",
    marginBottom: "10px",
  },

  infoValue: {
    fontSize: "26px",
    color: "#111827",
  },

  factors: {
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "14px",
    marginBottom: "20px",
  },

  calculated: {
    color: "#64748b",
    marginBottom: "25px",
  },

  actions: {
    display: "flex",
    gap: "12px",
  },

  button: {
    flex: 1,
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  backButton: {
    flex: 1,
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#1f2937",
    fontSize: "16px",
    cursor: "pointer",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px",
    borderRadius: "10px",
    margin: "20px 0",
  },
};