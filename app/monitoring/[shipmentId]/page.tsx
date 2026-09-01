"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RouteData = {
  id?: number;
  shipmentId?: number;
  driverId?: number | null;
  origin?: string | null;
  destination?: string | null;
  waypoints?: string | null;
  distanceKm?: number | null;
  estimatedTimeMinutes?: number | null;
  actualTimeMinutes?: number | null;
  trafficCondition?: string | null;
  createdAt?: string | null;
};

type ShipmentData = {
  id?: number;
  trackingNumber?: string;
  status?: string;
  senderName?: string;
  receiverName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  assignedOperatorId?: number | null;
};

type PodData = {
  id?: number;
  shipmentId?: number;
  verifiedBy?: number;
  signatureUrl?: string;
  photoUrl?: string;
  deliveredTo?: string;
  deliveryNotes?: string;
  verificationStatus?: string;
  deliveredAt?: string;
};

type DistanceData = {
  distanceKm?: number;
  estimatedTimeMinutes?: number;
  distance?: string | number | { text?: string; value?: number };
  duration?: string | number | { text?: string; value?: number };
  rows?: Array<{
    elements?: Array<{
      distance?: {
        text?: string;
        value?: number;
      };
      duration?: {
        text?: string;
        value?: number;
      };
    }>;
  }>;
  routes?: Array<{
    legs?: Array<{
      distance?: {
        text?: string;
        value?: number;
      };
      duration?: {
        text?: string;
        value?: number;
      };
    }>;
  }>;
};

export default function MonitoringDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = params.shipmentId as string;

  const [route, setRoute] = useState<RouteData | null>(null);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [pod, setPod] = useState<PodData | null>(null);

  const [distance, setDistance] = useState("N/A");
  const [estimatedTime, setEstimatedTime] = useState("N/A");

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  const formatMinutes = (minutes: number | null | undefined) => {
    if (
      minutes === null ||
      minutes === undefined ||
      Number.isNaN(Number(minutes))
    ) {
      return "N/A";
    }

    const totalMinutes = Math.round(Number(minutes));

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  const parseDistanceResponse = (rawText: string) => {
    let parsed: DistanceData | string | number | null = null;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }

    let distanceKm: number | null = null;
    let timeMinutes: number | null = null;

    if (typeof parsed === "number") {
      distanceKm = parsed;
    }

    if (typeof parsed === "string") {
      const distanceMatch = parsed.match(
        /([\d,.]+)\s*(?:km|kilometers?)/i
      );

      const timeMatch = parsed.match(
        /(\d+)\s*(?:hr|hrs|hour|hours)\s*(?:(\d+)\s*(?:min|mins|minute|minutes))?/i
      );

      if (distanceMatch) {
        distanceKm = parseFloat(
          distanceMatch[1].replace(/,/g, "")
        );
      }

      if (timeMatch) {
        const hours = Number(timeMatch[1] || 0);
        const minutes = Number(timeMatch[2] || 0);
        timeMinutes = hours * 60 + minutes;
      }

      const minutesOnlyMatch = parsed.match(
        /(\d+)\s*(?:min|mins|minute|minutes)/i
      );

      if (timeMinutes === null && minutesOnlyMatch) {
        timeMinutes = Number(minutesOnlyMatch[1]);
      }
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      const data = parsed as DistanceData;

      if (
        data.distanceKm !== undefined &&
        data.distanceKm !== null
      ) {
        distanceKm = Number(data.distanceKm);
      }

      if (
        data.estimatedTimeMinutes !== undefined &&
        data.estimatedTimeMinutes !== null
      ) {
        timeMinutes = Number(data.estimatedTimeMinutes);
      }

      if (
        typeof data.distance === "object" &&
        data.distance !== null
      ) {
        if (data.distance.value !== undefined) {
          distanceKm = Number(data.distance.value) / 1000;
        }

        if (data.distance.text) {
          const match = data.distance.text.match(
            /([\d,.]+)\s*km/i
          );

          if (match) {
            distanceKm = parseFloat(
              match[1].replace(/,/g, "")
            );
          }
        }
      }

      if (typeof data.distance === "number") {
        distanceKm = Number(data.distance);
      }

      if (typeof data.distance === "string") {
        const match = data.distance.match(
          /([\d,.]+)\s*km/i
        );

        if (match) {
          distanceKm = parseFloat(
            match[1].replace(/,/g, "")
          );
        }
      }

      if (
        typeof data.duration === "object" &&
        data.duration !== null
      ) {
        if (data.duration.value !== undefined) {
          timeMinutes = Math.round(
            Number(data.duration.value) / 60
          );
        }

        if (data.duration.text) {
          const hoursMatch = data.duration.text.match(
            /(\d+)\s*(?:hr|hrs|hour|hours)/i
          );

          const minutesMatch = data.duration.text.match(
            /(\d+)\s*(?:min|mins|minute|minutes)/i
          );

          const hours = hoursMatch
            ? Number(hoursMatch[1])
            : 0;

          const minutes = minutesMatch
            ? Number(minutesMatch[1])
            : 0;

          if (hours > 0 || minutes > 0) {
            timeMinutes = hours * 60 + minutes;
          }
        }
      }

      if (typeof data.duration === "number") {
        timeMinutes = Number(data.duration);
      }

      if (typeof data.duration === "string") {
        const hoursMatch = data.duration.match(
          /(\d+)\s*(?:hr|hrs|hour|hours)/i
        );

        const minutesMatch = data.duration.match(
          /(\d+)\s*(?:min|mins|minute|minutes)/i
        );

        const hours = hoursMatch
          ? Number(hoursMatch[1])
          : 0;

        const minutes = minutesMatch
          ? Number(minutesMatch[1])
          : 0;

        if (hours > 0 || minutes > 0) {
          timeMinutes = hours * 60 + minutes;
        }
      }

      if (data.rows?.[0]?.elements?.[0]) {
        const element = data.rows[0].elements[0];

        if (element.distance?.value !== undefined) {
          distanceKm =
            Number(element.distance.value) / 1000;
        }

        if (element.distance?.text) {
          const match = element.distance.text.match(
            /([\d,.]+)\s*km/i
          );

          if (match) {
            distanceKm = parseFloat(
              match[1].replace(/,/g, "")
            );
          }
        }

        if (element.duration?.value !== undefined) {
          timeMinutes = Math.round(
            Number(element.duration.value) / 60
          );
        }
      }

      if (data.routes?.[0]?.legs?.[0]) {
        const leg = data.routes[0].legs[0];

        if (leg.distance?.value !== undefined) {
          distanceKm =
            Number(leg.distance.value) / 1000;
        }

        if (leg.distance?.text) {
          const match = leg.distance.text.match(
            /([\d,.]+)\s*km/i
          );

          if (match) {
            distanceKm = parseFloat(
              match[1].replace(/,/g, "")
            );
          }
        }

        if (leg.duration?.value !== undefined) {
          timeMinutes = Math.round(
            Number(leg.duration.value) / 60
          );
        }
      }
    }

    return {
      distanceKm,
      timeMinutes,
    };
  };

  const fetchRouteDistance = useCallback(
    async (
      currentRoute: RouteData,
      token: string
    ) => {
      if (
        currentRoute.distanceKm !== null &&
        currentRoute.distanceKm !== undefined
      ) {
        setDistance(
          `${Number(currentRoute.distanceKm).toFixed(1)} km`
        );
      }

      if (
        currentRoute.estimatedTimeMinutes !== null &&
        currentRoute.estimatedTimeMinutes !== undefined
      ) {
        setEstimatedTime(
          formatMinutes(currentRoute.estimatedTimeMinutes)
        );
      }

      if (
        currentRoute.distanceKm !== null &&
        currentRoute.distanceKm !== undefined &&
        currentRoute.estimatedTimeMinutes !== null &&
        currentRoute.estimatedTimeMinutes !== undefined
      ) {
        return;
      }

      if (
        !currentRoute.origin ||
        !currentRoute.destination
      ) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/shipments/distance?origin=${encodeURIComponent(
            currentRoute.origin
          )}&destination=${encodeURIComponent(
            currentRoute.destination
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const text = await response.text();

        if (!text) {
          return;
        }

        const result = parseDistanceResponse(text);

        if (
          result.distanceKm !== null &&
          !Number.isNaN(result.distanceKm)
        ) {
          setDistance(
            `${result.distanceKm.toFixed(1)} km`
          );
        }

        if (
          result.timeMinutes !== null &&
          !Number.isNaN(result.timeMinutes)
        ) {
          setEstimatedTime(
            formatMinutes(result.timeMinutes)
          );
        }
      } catch (err) {
        console.error("Distance error:", err);
      }
    },
    []
  );

  const fetchMonitoringData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      if (!shipmentId) {
        setError("Invalid shipment ID");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const shipmentResponse = await fetch(
        `http://localhost:8080/api/shipments/${shipmentId}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      if (shipmentResponse.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      let shipmentData: ShipmentData | null = null;

      if (shipmentResponse.ok) {
        const shipmentText =
          await shipmentResponse.text();

        if (shipmentText) {
          shipmentData = JSON.parse(shipmentText);
          setShipment(shipmentData);
        }
      }

      const routeResponse = await fetch(
        `http://localhost:8080/api/routes/${shipmentId}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      if (routeResponse.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      const routeText = await routeResponse.text();

      let latestRoute: RouteData | null = null;

      if (routeResponse.ok && routeText) {
        const routeData: RouteData | RouteData[] =
          JSON.parse(routeText);

        if (Array.isArray(routeData)) {
          if (routeData.length > 0) {
            latestRoute = routeData[0];
          }
        } else {
          latestRoute = routeData;
        }

        if (latestRoute) {
          setRoute(latestRoute);
          await fetchRouteDistance(
            latestRoute,
            token
          );
        }
      }

      const podResponse = await fetch(
        `http://localhost:8080/api/pod/${shipmentId}`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      if (podResponse.ok) {
        const podText = await podResponse.text();

        if (podText) {
          const podData: PodData =
            JSON.parse(podText);

          setPod(podData);
        }
      }

      if (
        !routeResponse.ok &&
        !shipmentData
      ) {
        setError("Unable to load shipment data");
      } else {
        setError("");
      }

      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Monitoring error:", err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, [
    shipmentId,
    router,
    fetchRouteDistance,
  ]);

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
  }, [
    shipmentId,
    fetchMonitoringData,
  ]);

  const getProgress = () => {
    const status =
      shipment?.status?.toUpperCase() || "CREATED";

    switch (status) {
      case "CREATED":
        return "10%";

      case "PICKED_UP":
        return "30%";

      case "IN_TRANSIT":
        return "55%";

      case "OUT_FOR_DELIVERY":
        return "80%";

      case "DELIVERED":
        return "100%";

      case "FAILED_DELIVERY":
        return "100%";

      default:
        return "10%";
    }
  };

  const getProgressText = () => {
    const status =
      shipment?.status?.toUpperCase() || "CREATED";

    switch (status) {
      case "CREATED":
        return "Shipment has been created.";

      case "PICKED_UP":
        return "Shipment has been picked up.";

      case "IN_TRANSIT":
        return "Shipment is currently in transit.";

      case "OUT_FOR_DELIVERY":
        return "Shipment is out for delivery.";

      case "DELIVERED":
        return "Shipment delivered successfully.";

      case "FAILED_DELIVERY":
        return "Delivery attempt failed.";

      default:
        return "Shipment route is being monitored.";
    }
  };

  const getStatusClass = (status: string) => {
    const currentStatus =
      shipment?.status?.toUpperCase() || "";

    return currentStatus === status
      ? styles.statusActive
      : styles.statusInactive;
  };

  const formatDeliveredAt = () => {
    if (!pod?.deliveredAt) {
      return null;
    }

    const date = new Date(pod.deliveredAt);

    if (Number.isNaN(date.getTime())) {
      return pod.deliveredAt;
    }

    return date.toLocaleString();
  };

  const getActualTime = () => {
    if (
      route?.actualTimeMinutes !== null &&
      route?.actualTimeMinutes !== undefined
    ) {
      return formatMinutes(
        route.actualTimeMinutes
      );
    }

    return "N/A";
  };

  const getDriverId = () => {
    if (
      route?.driverId !== null &&
      route?.driverId !== undefined
    ) {
      return String(route.driverId);
    }

    return "Not assigned";
  };

  const getTrafficCondition = () => {
    if (route?.trafficCondition) {
      return route.trafficCondition;
    }

    return "Not available";
  };

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

  const currentStatus =
    shipment?.status?.toUpperCase() || "CREATED";

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              style={styles.backButton}
            >
              ← Back
            </button>

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

        {route && (
          <>
            <div style={styles.routeStatusBox}>
              <h2 style={styles.routeStatusTitle}>
                Route Status
              </h2>

              <p style={styles.routeLine}>
                <strong>Origin:</strong>{" "}
                {route.origin || "Not available"}
              </p>

              <p style={styles.routeLine}>
                <strong>Destination:</strong>{" "}
                {route.destination ||
                  "Not available"}
              </p>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Distance
                </span>

                <strong style={styles.infoValue}>
                  {distance}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Estimated Time
                </span>

                <strong style={styles.infoValue}>
                  {estimatedTime}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Traffic Condition
                </span>

                <strong style={styles.infoValue}>
                  {getTrafficCondition()}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Driver ID
                </span>

                <strong style={styles.infoValue}>
                  {getDriverId()}
                </strong>
              </div>

              <div style={styles.infoCard}>
                <span style={styles.infoLabel}>
                  Actual Time
                </span>

                <strong style={styles.infoValue}>
                  {getActualTime()}
                </strong>
              </div>
            </div>

            <div style={styles.statusBox}>
              <h2 style={styles.sectionTitle}>
                Shipment Status
              </h2>

              <div style={styles.statusContainer}>
                <div
                  style={getStatusClass("CREATED")}
                >
                  <span style={styles.statusDot} />
                  <span>Created</span>
                </div>

                <div
                  style={getStatusClass("PICKED_UP")}
                >
                  <span style={styles.statusDot} />
                  <span>Picked Up</span>
                </div>

                <div
                  style={getStatusClass("IN_TRANSIT")}
                >
                  <span style={styles.statusDot} />
                  <span>In Transit</span>
                </div>

                <div
                  style={getStatusClass(
                    "OUT_FOR_DELIVERY"
                  )}
                >
                  <span style={styles.statusDot} />
                  <span>Out for Delivery</span>
                </div>

                <div
                  style={getStatusClass("DELIVERED")}
                >
                  <span style={styles.statusDot} />
                  <span>Delivered</span>
                </div>

                <div
                  style={getStatusClass(
                    "FAILED_DELIVERY"
                  )}
                >
                  <span style={styles.statusDot} />
                  <span>Failed Delivery</span>
                </div>
              </div>
            </div>

            {currentStatus === "DELIVERED" &&
              formatDeliveredAt() && (
                <div style={styles.deliveredBox}>
                  <span
                    style={styles.deliveredLabel}
                  >
                    Delivered At
                  </span>

                  <strong
                    style={styles.deliveredValue}
                  >
                    {formatDeliveredAt()}
                  </strong>
                </div>
              )}

            <div style={styles.progressBox}>
              <h2 style={styles.sectionTitle}>
                Delivery Progress
              </h2>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: getProgress(),
                  }}
                />
              </div>

              <p style={styles.progressText}>
                Current status:{" "}
                <strong>
                  {shipment?.status || "CREATED"}
                </strong>
              </p>

              <p
                style={
                  styles.progressDescription
                }
              >
                {getProgressText()}
              </p>
            </div>

            <div style={styles.updateBox}>
              <strong style={styles.updateLabel}>
                Last updated:
              </strong>{" "}
              <span style={styles.updateValue}>
                {lastUpdated || "Just now"}
              </span>
            </div>
          </>
        )}

        <div style={styles.actions}>
          <button
            type="button"
            onClick={fetchMonitoringData}
            style={styles.primaryButton}
          >
            Refresh Now
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/monitoring")
            }
            style={styles.secondaryButton}
          >
            Track Another Shipment
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/home")
            }
            style={styles.secondaryButton}
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "35px 20px",
    boxSizing: "border-box",
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
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "30px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    marginBottom: "12px",
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
    fontSize: "16px",
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
    display: "block",
    marginBottom: "6px",
  },

  errorText: {
    color: "#991b1b",
    margin: 0,
  },

  routeStatusBox: {
    background: "#eff6ff",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
    color: "#1e3a8a",
  },

  routeStatusTitle: {
    color: "#111827",
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "22px",
  },

  routeLine: {
    color: "#1e3a8a",
    margin: "9px 0",
    fontSize: "15px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  infoCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  infoLabel: {
    color: "#475569",
    fontSize: "15px",
    fontWeight: 500,
  },

  infoValue: {
    color: "#111827",
    fontSize: "22px",
    fontWeight: 700,
  },

  statusBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "24px",
    borderRadius: "15px",
    marginBottom: "20px",
  },

  sectionTitle: {
    color: "#111827",
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "22px",
  },

  statusContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px 25px",
  },

  statusActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#15803d",
    fontWeight: 700,
    fontSize: "15px",
  },

  statusInactive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "15px",
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "currentColor",
    display: "inline-block",
  },

  deliveredBox: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    padding: "20px 24px",
    borderRadius: "14px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  deliveredLabel: {
    color: "#166534",
    fontSize: "15px",
    fontWeight: 600,
  },

  deliveredValue: {
    color: "#14532d",
    fontSize: "20px",
  },

  progressBox: {
    background: "#f8fafc",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
  },

  progressTrack: {
    width: "100%",
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
    transition: "width 0.4s ease",
  },

  progressText: {
    color: "#475569",
    marginBottom: 0,
    marginTop: "12px",
  },

  progressDescription: {
    color: "#475569",
    marginTop: "8px",
    marginBottom: 0,
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

  primaryButton: {
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