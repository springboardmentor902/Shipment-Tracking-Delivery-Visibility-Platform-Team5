"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RouteData = {
  id?: number;
  shipmentId?: number;
  driverId?: number;
  origin?: string;
  destination?: string;
  waypoints?: string;
  distanceKm?: number;
  estimatedTimeMinutes?: number;
  actualTimeMinutes?: number;
  trafficCondition?: string;
  createdAt?: string;
};

export default function MonitoringDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = params.shipmentId as string;

  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  const fetchMonitoringData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/routes/${shipmentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const text = await response.text();

      if (!response.ok) {
        setError(
          text ||
            `Unable to load monitoring data (${response.status})`
        );
        return;
      }

      if (!text) {
        setError("No monitoring data available");
        return;
      }

      const data: RouteData = JSON.parse(text);

      setRoute(data);
      setLastUpdated(new Date().toLocaleString());
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, [shipmentId, router]);

  useEffect(() => {
    if (!shipmentId) {
      return;
    }

    fetchMonitoringData();

    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [shipmentId, fetchMonitoringData]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.loadingText}>
            Loading Live Monitoring...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Live Shipment Monitoring
            </h1>

            <p style={styles.subtitle}>
              Shipment #{shipmentId}
            </p>
          </div>

          <div style={styles.liveBadge}>
            ● Live Monitoring
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={styles.error}>
            <strong style={styles.errorTitle}>
              Unable to load monitoring data
            </strong>

            <p style={styles.errorText}>
              {error}
            </p>
          </div>
        )}

        {/* DATA */}
        {route && (
          <>
            {/* ROUTE STATUS */}
            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>
                Route Status
              </h2>

              <p style={styles.statusText}>
                <strong>Origin:</strong>{" "}
                {route.origin || "N/A"}
              </p>

              <p style={styles.statusText}>
                <strong>Destination:</strong>{" "}
                {route.destination || "N/A"}
              </p>

              <p style={styles.statusText}>
                <strong>Traffic Condition:</strong>{" "}
                {route.trafficCondition || "N/A"}
              </p>
            </div>

            {/* INFORMATION CARDS */}
            <div style={styles.grid}>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Distance
                </span>

                <strong style={styles.infoValue}>
                  {route.distanceKm != null
                    ? `${route.distanceKm} km`
                    : "N/A"}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Estimated Time
                </span>

                <strong style={styles.infoValue}>
                  {route.estimatedTimeMinutes != null
                    ? `${route.estimatedTimeMinutes} minutes`
                    : "N/A"}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Actual Time
                </span>

                <strong style={styles.infoValue}>
                  {route.actualTimeMinutes != null
                    ? `${route.actualTimeMinutes} minutes`
                    : "N/A"}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Driver ID
                </span>

                <strong style={styles.infoValue}>
                  {route.driverId ?? "N/A"}
                </strong>
              </div>

            </div>

            {/* DELIVERY PROGRESS */}
            <div style={styles.progressBox}>
              <h2 style={styles.sectionTitle}>
                Delivery Progress
              </h2>

              <div style={styles.progressTrack}>
                <div style={styles.progressFill} />
              </div>

              <p style={styles.progressText}>
                Shipment route is being monitored.
              </p>
            </div>

            {/* LAST CHECKED */}
            <div style={styles.updateBox}>
              <strong style={styles.updateLabel}>
                Last Checked:
              </strong>{" "}
              <span style={styles.updateValue}>
                {lastUpdated || "N/A"}
              </span>
            </div>
          </>
        )}

        {/* BUTTONS */}
        <div style={styles.actions}>

          <button
            type="button"
            onClick={fetchMonitoringData}
            style={styles.button}
          >
            Refresh Now
          </button>

          <button
            type="button"
            onClick={() => router.push("/monitoring")}
            style={styles.secondaryButton}
          >
            Track Another Shipment
          </button>

          <button
            type="button"
            onClick={() => router.push("/home")}
            style={styles.secondaryButton}
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
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.12)",
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.12)",
    boxSizing: "border-box",
  },

  loadingText: {
    color: "#111827",
    margin: 0,
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
    fontWeight: 700,
  },

  subtitle: {
    color: "#475569",
    marginTop: "8px",
    marginBottom: 0,
  },

  liveBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "10px 16px",
    borderRadius: "20px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  errorTitle: {
    color: "#991b1b",
  },

  errorText: {
    color: "#991b1b",
    marginBottom: 0,
  },

  statusBox: {
    background: "#eff6ff",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
    color: "#1e3a8a",
  },

  sectionTitle: {
    color: "#111827",
    marginTop: 0,
    marginBottom: "18px",
  },

  statusText: {
    color: "#1e3a8a",
    margin: "10px 0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },

  infoCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "24px",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  infoLabel: {
    display: "block",
    color: "#475569",
    fontSize: "15px",
    fontWeight: 500,
  },

  infoValue: {
    display: "block",
    color: "#111827",
    fontSize: "22px",
    fontWeight: 700,
  },

  progressBox: {
    background: "#f8fafc",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
  },

  progressTrack: {
    width: "100%",
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressFill: {
    width: "55%",
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
  },

  progressText: {
    color: "#475569",
    marginBottom: 0,
    marginTop: "12px",
  },

  updateBox: {
    color: "#475569",
    marginBottom: "25px",
  },

  updateLabel: {
    color: "#111827",
  },

  updateValue: {
    color: "#475569",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  button: {
    flex: 1,
    minWidth: "180px",
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
    flex: 1,
    minWidth: "180px",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#1f2937",
    fontSize: "16px",
    cursor: "pointer",
  },
};