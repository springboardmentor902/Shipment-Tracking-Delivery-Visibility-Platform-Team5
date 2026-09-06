"use client";

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
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastLocation?: string | null;
  lastLocationAt?: string | null;
  createdAt?: string | null;
  isCurrent?: boolean;
};

interface MonitoringRouteInfoProps {
  route: RouteData;
  routeHistory?: RouteData[];
}

export default function MonitoringRouteInfo({
  route,
  routeHistory = [],
}: MonitoringRouteInfoProps) {
  const formatMinutes = (
    minutes: number | null | undefined
  ) => {
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

  const formatDate = (
    dateValue: string | null | undefined
  ) => {
    if (!dateValue) {
      return "N/A";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString();
  };

  return (
    <div style={styles.wrapper}>
      {/* Current Route */}
      <div style={styles.currentRouteCard}>
        <div style={styles.currentHeader}>
          <div>
            <h2 style={styles.title}>
              Current Route
            </h2>

            <p style={styles.routeText}>
              {route.origin || "Not available"} →{" "}
              {route.destination || "Not available"}
            </p>
          </div>

          <span style={styles.currentBadge}>
            CURRENT
          </span>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span style={styles.label}>
              Distance
            </span>

            <strong style={styles.value}>
              {route.distanceKm !== null &&
              route.distanceKm !== undefined
                ? `${Number(route.distanceKm).toFixed(1)} km`
                : "N/A"}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.label}>
              Estimated Time
            </span>

            <strong style={styles.value}>
              {formatMinutes(
                route.estimatedTimeMinutes
              )}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.label}>
              Actual Time
            </span>

            <strong style={styles.value}>
              {formatMinutes(
                route.actualTimeMinutes
              )}
            </strong>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.label}>
              Driver
            </span>

            <strong style={styles.value}>
              {route.driverId !== null &&
              route.driverId !== undefined
                ? route.driverId
                : "Not assigned"}
            </strong>
          </div>
        </div>

        {route.trafficCondition && (
          <div style={styles.reasonBox}>
            <span style={styles.reasonLabel}>
              Route Selection / Traffic
            </span>

            <p style={styles.reasonText}>
              {route.trafficCondition}
            </p>
          </div>
        )}

        {route.lastLocation && (
          <div style={styles.locationBox}>
            <span style={styles.label}>
              Current Location
            </span>

            <strong style={styles.locationValue}>
              {route.lastLocation}
            </strong>

            {route.lastLocationAt && (
              <span style={styles.locationTime}>
                Updated:{" "}
                {formatDate(route.lastLocationAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Route History */}
      <div style={styles.historyCard}>
        <div style={styles.historyHeader}>
          <div>
            <h2 style={styles.title}>
              Route History
            </h2>

            <p style={styles.historySubtitle}>
              Previous and current routes for this
              shipment
            </p>
          </div>

          <span style={styles.countBadge}>
            {routeHistory.length}{" "}
            {routeHistory.length === 1
              ? "Route"
              : "Routes"}
          </span>
        </div>

        {routeHistory.length === 0 ? (
          <div style={styles.emptyHistory}>
            <p>
              No route history available yet.
            </p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {routeHistory.map(
              (historyRoute, index) => {
                const current =
                  historyRoute.isCurrent === true ||
                  historyRoute.id === route.id;

                return (
                  <div
                    key={
                      historyRoute.id ??
                      `${historyRoute.shipmentId}-${index}`
                    }
                    style={{
                      ...styles.historyItem,
                      ...(current
                        ? styles.currentHistoryItem
                        : {}),
                    }}
                  >
                    <div style={styles.historyTop}>
                      <div>
                        <strong
                          style={styles.historyRouteTitle}
                        >
                          {historyRoute.origin ||
                            "Not available"}{" "}
                          →{" "}
                          {historyRoute.destination ||
                            "Not available"}
                        </strong>

                        <p
                          style={
                            styles.historyDate
                          }
                        >
                          Created:{" "}
                          {formatDate(
                            historyRoute.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        style={
                          current
                            ? styles.currentHistoryBadge
                            : styles.previousBadge
                        }
                      >
                        {current
                          ? "CURRENT"
                          : "PREVIOUS"}
                      </span>
                    </div>

                    <div
                      style={styles.historyInfoGrid}
                    >
                      <div>
                        <span
                          style={styles.smallLabel}
                        >
                          Distance
                        </span>

                        <strong
                          style={
                            styles.smallValue
                          }
                        >
                          {historyRoute.distanceKm !==
                            null &&
                          historyRoute.distanceKm !==
                            undefined
                            ? `${Number(
                                historyRoute.distanceKm
                              ).toFixed(1)} km`
                            : "N/A"}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={styles.smallLabel}
                        >
                          Estimated Time
                        </span>

                        <strong
                          style={
                            styles.smallValue
                          }
                        >
                          {formatMinutes(
                            historyRoute.estimatedTimeMinutes
                          )}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={styles.smallLabel}
                        >
                          Actual Time
                        </span>

                        <strong
                          style={
                            styles.smallValue
                          }
                        >
                          {formatMinutes(
                            historyRoute.actualTimeMinutes
                          )}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={styles.smallLabel}
                        >
                          Route ID
                        </span>

                        <strong
                          style={
                            styles.smallValue
                          }
                        >
                          #{historyRoute.id ??
                            "N/A"}
                        </strong>
                      </div>
                    </div>

                    {historyRoute.trafficCondition && (
                      <div
                        style={
                          styles.historyReason
                        }
                      >
                        {historyRoute.trafficCondition}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "20px",
  },

  currentRouteCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "16px",
    padding: "25px",
  },

  currentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "22px",
    fontWeight: 700,
  },

  routeText: {
    margin: "8px 0 0",
    color: "#1e3a8a",
    fontSize: "15px",
  },

  currentBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    color: "#475569",
    fontSize: "13px",
    fontWeight: 500,
  },

  value: {
    color: "#111827",
    fontSize: "18px",
    fontWeight: 700,
  },

  reasonBox: {
    marginTop: "15px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "15px",
    border: "1px solid #dbeafe",
  },

  reasonLabel: {
    color: "#1e3a8a",
    fontSize: "13px",
    fontWeight: 700,
  },

  reasonText: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: "7px 0 0",
  },

  locationBox: {
    marginTop: "15px",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "15px",
    border: "1px solid #dbeafe",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  locationValue: {
    color: "#111827",
    fontSize: "17px",
  },

  locationTime: {
    color: "#64748b",
    fontSize: "12px",
  },

  historyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "25px",
  },

  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "20px",
  },

  historySubtitle: {
    color: "#64748b",
    fontSize: "14px",
    margin: "7px 0 0",
  },

  countBadge: {
    background: "#f1f5f9",
    color: "#334155",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  emptyHistory: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "25px",
    textAlign: "center",
    color: "#64748b",
  },

  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  historyItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
    background: "#ffffff",
  },

  currentHistoryItem: {
    border: "2px solid #22c55e",
    background: "#f0fdf4",
  },

  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "15px",
  },

  historyRouteTitle: {
    color: "#111827",
    fontSize: "16px",
  },

  historyDate: {
    color: "#64748b",
    fontSize: "12px",
    margin: "6px 0 0",
  },

  currentHistoryBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    borderRadius: "15px",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  previousBadge: {
    background: "#f1f5f9",
    color: "#64748b",
    padding: "6px 10px",
    borderRadius: "15px",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  historyInfoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },

  smallLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "4px",
  },

  smallValue: {
    color: "#111827",
    fontSize: "14px",
  },

  historyReason: {
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};