"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RouteData = {
  id: number;
  shipmentId: number;
  driverId: number | null;
  origin: string | null;
  destination: string | null;
  waypoints: string | null;
  distanceKm: number | null;
  estimatedTimeMinutes: number | null;
  actualTimeMinutes: number | null;
  trafficCondition: string | null;
  createdAt: string | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastLocation: string | null;
  lastLocationAt: string | null;
};

type ShipmentData = {
  id: number;
  trackingNumber?: string;
  status?: string;
  senderName?: string;
  receiverName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  assignedOperatorId?: number | null;
};

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = params.shipmentId as string;

  const [route, setRoute] = useState<RouteData | null>(null);
  const [shipment, setShipment] =
    useState<ShipmentData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  const fetchTrackingData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUserId(
            user?.id !== undefined && user?.id !== null
              ? Number(user.id)
              : null
          );
          setCurrentUserRole(
            String(user?.role || "").toUpperCase()
          );
        } catch {
          setCurrentUserId(null);
          setCurrentUserRole("");
        }
      }

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

      if (shipmentResponse.ok) {
        const shipmentText =
          await shipmentResponse.text();

        if (shipmentText) {
          const shipmentData: ShipmentData =
            JSON.parse(shipmentText);

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

      if (!routeResponse.ok) {
        setRoute(null);
        setError(
          routeText ||
            `Unable to load route (${routeResponse.status})`
        );
        return;
      }

      if (!routeText) {
        setRoute(null);
        setError("No route found for this shipment");
        return;
      }

      const routeData: RouteData | RouteData[] =
        JSON.parse(routeText);

      let latestRoute: RouteData | null = null;

      if (Array.isArray(routeData)) {
        if (routeData.length > 0) {
          latestRoute = routeData[0];
        }
      } else if (
        routeData &&
        typeof routeData === "object"
      ) {
        latestRoute = routeData;
      }

      if (!latestRoute) {
        setRoute(null);
        setError("No route found for this shipment");
        return;
      }

      setRoute(latestRoute);
      setError("");
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Tracking error:", err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, [shipmentId, router]);

  useEffect(() => {
    if (!shipmentId) {
      return;
    }

    fetchTrackingData();

    const interval = setInterval(() => {
      fetchTrackingData();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [shipmentId, fetchTrackingData]);

  const useMyCurrentLocation = () => {
    setLocationMessage("");
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setLocationMessage(
          "Current GPS coordinates loaded. Add a location name if needed."
        );
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setLocationError(
          "Unable to get your current location. Please allow location access."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const updateDriverLocation = async () => {
    setLocationMessage("");
    setLocationError("");

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!route) {
      setLocationError("Route information is not available.");
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setLocationError("Latitude and longitude are required.");
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setLocationError("Please enter valid latitude and longitude values.");
      return;
    }

    try {
      setUpdatingLocation(true);

      const query = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
      });

      if (location.trim()) {
        query.set("location", location.trim());
      }

      const response = await fetch(
        `http://localhost:8080/api/routes/${route.id}/location?${query.toString()}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setLocationError(
          responseText || "Failed to update driver location."
        );
        return;
      }

      const updatedRoute: RouteData = JSON.parse(responseText);

      setRoute(updatedRoute);
      setLastUpdated(new Date().toLocaleString());
      setLocationMessage("Driver location updated successfully.");
    } catch (err) {
      console.error("Location update error:", err);
      setLocationError("Unable to connect to server.");
    } finally {
      setUpdatingLocation(false);
    }
  };

  const isAssignedLogisticsOperator =
    currentUserRole === "LOGISTICS_OPERATOR" &&
    currentUserId !== null &&
    shipment?.assignedOperatorId !== null &&
    shipment?.assignedOperatorId !== undefined &&
    Number(shipment.assignedOperatorId) === currentUserId;

  const getStatusClass = (status: string) => {
    const currentStatus =
      shipment?.status?.toUpperCase() || "";

    const targetStatus = status.toUpperCase();

    if (currentStatus === targetStatus) {
      return styles.statusActive;
    }

    return styles.statusInactive;
  };

  const formatDistance = () => {
    if (
      route?.distanceKm !== null &&
      route?.distanceKm !== undefined
    ) {
      return `${route.distanceKm.toFixed(1)} km`;
    }

    return "Not available";
  };

  const formatTime = () => {
    if (
      route?.estimatedTimeMinutes !== null &&
      route?.estimatedTimeMinutes !== undefined
    ) {
      const minutes = route.estimatedTimeMinutes;

      if (minutes < 60) {
        return `${minutes} min`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} hr`;
      }

      return `${hours} hr ${remainingMinutes} min`;
    }

    return "Not available";
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <h2 style={styles.loadingText}>
            Loading Live Shipment Tracking...
          </h2>
        </div>
      </main>
    );
  }

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
              Live Shipment Tracking
            </h1>

            <p style={styles.subtitle}>
              Shipment #{shipmentId}
            </p>
          </div>

          <div style={styles.liveBadge}>
            ● Live Connected
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <strong style={styles.errorTitle}>
              Unable to load tracking data
            </strong>

            <p style={styles.errorText}>
              {error}
            </p>
          </div>
        )}

        {route && (
          <>
            <div style={styles.routeSummary}>
              <div>
                <strong style={styles.routeLabel}>
                  Origin
                </strong>

                <p style={styles.routeValue}>
                  {route.origin || "Not available"}
                </p>
              </div>

              <div>
                <strong style={styles.routeLabel}>
                  Destination
                </strong>

                <p style={styles.routeValue}>
                  {route.destination ||
                    "Not available"}
                </p>
              </div>

              <div>
                <strong style={styles.routeLabel}>
                  Distance
                </strong>

                <p style={styles.routeValue}>
                  {formatDistance()}
                </p>
              </div>

              <div>
                <strong style={styles.routeLabel}>
                  Estimated Time
                </strong>

                <p style={styles.routeValue}>
                  {formatTime()}
                </p>
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

            <div style={styles.locationBox}>
              <h2 style={styles.sectionTitle}>
                Current Driver Location
              </h2>

              <div style={styles.locationDetails}>
                <p style={styles.locationText}>
                  <strong>Location:</strong>{" "}
                  {route.lastLocation ||
                    "Driver location is not available yet."}
                </p>

                <p style={styles.locationText}>
                  <strong>Latitude:</strong>{" "}
                  {route.lastLatitude !== null &&
                  route.lastLatitude !== undefined
                    ? route.lastLatitude
                    : "Not available"}
                </p>

                <p style={styles.locationText}>
                  <strong>Longitude:</strong>{" "}
                  {route.lastLongitude !== null &&
                  route.lastLongitude !== undefined
                    ? route.lastLongitude
                    : "Not available"}
                </p>

                <p style={styles.locationText}>
                  <strong>Assigned Driver ID:</strong>{" "}
                  {route.driverId ?? shipment?.assignedOperatorId ?? "Not assigned"}
                </p>

                <p style={styles.locationText}>
                  <strong>Location Updated:</strong>{" "}
                  {route.lastLocationAt
                    ? new Date(route.lastLocationAt).toLocaleString()
                    : "Not available yet"}
                </p>
              </div>

              {isAssignedLogisticsOperator && (
                <div style={styles.locationUpdatePanel}>
                  <h3 style={styles.locationUpdateTitle}>
                    Update Driver Location
                  </h3>

                  <p style={styles.locationHelp}>
                    Only the logistics operator assigned to this shipment can
                    update its live location.
                  </p>

                  <div style={styles.locationForm}>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Current location (optional)"
                      style={styles.locationInput}
                    />

                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      placeholder="Latitude"
                      style={styles.locationInput}
                    />

                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      placeholder="Longitude"
                      style={styles.locationInput}
                    />
                  </div>

                  <div style={styles.locationActions}>
                    <button
                      type="button"
                      onClick={useMyCurrentLocation}
                      style={styles.secondaryButton}
                      disabled={updatingLocation}
                    >
                      Use My Current Location
                    </button>

                    <button
                      type="button"
                      onClick={updateDriverLocation}
                      style={styles.primaryButton}
                      disabled={updatingLocation}
                    >
                      {updatingLocation
                        ? "Updating Location..."
                        : "Update Driver Location"}
                    </button>
                  </div>

                  {locationMessage && (
                    <p style={styles.successText}>
                      {locationMessage}
                    </p>
                  )}

                  {locationError && (
                    <p style={styles.locationErrorText}>
                      {locationError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div style={styles.mapSection}>
              <div style={styles.mapHeader}>
                <div>
                  <h2 style={styles.mapTitle}>
                    Shipment Route Map
                  </h2>

                  <p style={styles.mapSubtitle}>
                    Route overview from origin to destination
                  </p>
                </div>

                <div style={styles.mapRouteBadge}>
                  {route.origin || "Origin"} → {route.destination || "Destination"}
                </div>
              </div>

              <div style={styles.mapBox}>
                <iframe
                  title="Shipment Route Map"
                  width="100%"
                  height="400"
                  style={styles.map}
                  loading="lazy"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    route.origin ||
                      "Hyderabad, Telangana"
                  )}+to+${encodeURIComponent(
                    route.destination ||
                      "Pune, Maharashtra"
                  )}&output=embed`}
                />
              </div>
            </div>

            {route.lastLatitude !== null &&
              route.lastLatitude !== undefined &&
              route.lastLongitude !== null &&
              route.lastLongitude !== undefined && (
                <div style={styles.liveMapBox}>
                  <div style={styles.liveMapHeader}>
                    <div>
                      <h2 style={styles.mapTitle}>
                        Live Driver Location
                      </h2>
                      <p style={styles.liveMapText}>
                        📍 Current driver position is shown below.
                      </p>
                    </div>

                    <span style={styles.liveLocationBadge}>
                      ● Live
                    </span>
                  </div>

                  <iframe
                    title="Live Driver Location Map"
                    width="100%"
                    height="400"
                    style={styles.map}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${route.lastLatitude},${route.lastLongitude}&z=15&output=embed`}
                  />

                  <div style={styles.coordinatesBox}>
                    <span>
                      Latitude: {route.lastLatitude}
                    </span>
                    <span>
                      Longitude: {route.lastLongitude}
                    </span>
                    <span>
                      Location: {route.lastLocation || "Not specified"}
                    </span>
                  </div>
                </div>
              )}

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
            onClick={fetchTrackingData}
            style={styles.primaryButton}
          >
            Refresh Now
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/tracking")
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
    maxWidth: "1000px",
    margin: "0 auto",
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

  errorBox: {
    background: "#fee2e2",
    borderRadius: "10px",
    padding: "18px",
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

  routeSummary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "20px",
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "14px",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
  },

  routeLabel: {
    display: "block",
    color: "#111827",
    fontSize: "15px",
    marginBottom: "7px",
  },

  routeValue: {
    color: "#334155",
    margin: 0,
    lineHeight: 1.5,
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

  locationBox: {
    background: "#eff6ff",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
    border: "1px solid #dbeafe",
  },

  locationText: {
    color: "#1e3a8a",
    margin: 0,
    fontSize: "16px",
  },

  locationDetails: {
    display: "grid",
    gap: "8px",
    marginBottom: "20px",
  },

  locationUpdatePanel: {
    background: "#ffffff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "18px",
  },

  locationUpdateTitle: {
    color: "#111827",
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "19px",
  },

  locationHelp: {
    color: "#475569",
    marginTop: 0,
    marginBottom: "16px",
    lineHeight: 1.5,
  },

  locationForm: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },

  locationInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },

  locationActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  successText: {
    color: "#166534",
    marginBottom: 0,
    marginTop: "14px",
    fontWeight: 600,
  },

  locationErrorText: {
    color: "#b91c1c",
    marginBottom: 0,
    marginTop: "14px",
    fontWeight: 600,
  },

  mapSection: {
    marginBottom: "20px",
  },

  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "18px",
    marginBottom: "14px",
    flexWrap: "wrap",
    padding: "0 2px",
  },

  mapTitle: {
    color: "#111827",
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.3,
  },

  mapSubtitle: {
    color: "#64748b",
    margin: "5px 0 0",
    fontSize: "14px",
    lineHeight: 1.4,
  },

  mapRouteBadge: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 600,
    maxWidth: "100%",
  },

  mapBox: {
    width: "100%",
    overflow: "hidden",
    borderRadius: "12px",
    marginBottom: "0",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },

  liveMapBox: {
    width: "100%",
    overflow: "hidden",
    borderRadius: "15px",
    marginBottom: "20px",
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
  },

  liveMapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    padding: "18px 20px",
  },

  mapTitle: {
    color: "#111827",
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },

  liveMapText: {
    color: "#475569",
    margin: "6px 0 0",
    fontSize: "14px",
  },

  liveLocationBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "15px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  coordinatesBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px 20px",
    padding: "14px 20px",
    background: "#ffffff",
    borderTop: "1px solid #bbf7d0",
    color: "#334155",
    fontSize: "14px",
  },

  map: {
    display: "block",
    width: "100%",
    border: 0,
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