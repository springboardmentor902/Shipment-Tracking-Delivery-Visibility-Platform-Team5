"use client";

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

  lastLatitude?: number;
  lastLongitude?: number;
  lastLocation?: string;
  lastLocationAt?: string;
};

interface MonitoringRouteInfoProps {
  route: RouteData;
}

export default function MonitoringRouteInfo({
  route,
}: MonitoringRouteInfoProps) {
  return (
    <>
      {/* ROUTE STATUS */}
      <div style={styles.statusBox}>
        <h2 style={styles.sectionTitle}>Route Status</h2>

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

      {/* LIVE LOCATION */}
      <div style={styles.locationBox}>
        <h2 style={styles.sectionTitle}>
          Current Location
        </h2>

        <p style={styles.statusText}>
          <strong>Location:</strong>{" "}
          {route.lastLocation || "Driver location not available yet."}
        </p>

        {route.lastLatitude != null &&
          route.lastLongitude != null && (
            <p style={styles.statusText}>
              <strong>Coordinates:</strong>{" "}
              {route.lastLatitude}, {route.lastLongitude}
            </p>
          )}

        {route.lastLocationAt && (
          <p style={styles.statusText}>
            <strong>Last Updated:</strong>{" "}
            {new Date(route.lastLocationAt).toLocaleString()}
          </p>
        )}
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
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
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

  locationBox: {
    background: "#f0fdf4",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
    border: "1px solid #bbf7d0",
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
};