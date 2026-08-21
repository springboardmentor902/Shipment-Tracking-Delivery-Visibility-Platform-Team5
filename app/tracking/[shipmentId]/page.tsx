"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useParams, useRouter } from "next/navigation";

type RouteInfo = {
  id: number;
  shipmentId: number;
  driverId?: number;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  estimatedTimeMinutes?: number;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocation?: string;
  lastLocationAt?: string;
};

type LiveLocation = {
  routeId: number;
  shipmentId: number;
  driverId?: number;
  latitude: number;
  longitude: number;
  location?: string;
  updatedAt: string;
};

type RoutePathPoint = {
  lat: number;
  lng: number;
};

const googleLibraries: ("routes")[] = ["routes"];

const defaultCenter = {
  lat: 13.1001,
  lng: 80.2901,
};

export default function TrackingPage() {
  const params = useParams<{ shipmentId: string }>();
  const router = useRouter();
  const shipmentId = params?.shipmentId;

  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [liveLocation, setLiveLocation] =
    useState<LiveLocation | null>(null);
  const [routePath, setRoutePath] = useState<RoutePathPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const googleMapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    if (!shipmentId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    let subscription: StompSubscription | undefined;
    let disposed = false;

    const loadRoute = async () => {
      try {
        const response = await fetch(
          `${apiBase}/api/routes/${shipmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Route could not be loaded");
        }

        const data = await response.json();
        const routeData = Array.isArray(data) ? data[0] : data;

        if (!routeData) {
          throw new Error("No route found for this shipment");
        }

        setRoute(routeData);

        if (
          routeData.lastLatitude !== null &&
          routeData.lastLatitude !== undefined &&
          routeData.lastLongitude !== null &&
          routeData.lastLongitude !== undefined
        ) {
          setLiveLocation({
            routeId: routeData.id,
            shipmentId: routeData.shipmentId,
            driverId: routeData.driverId,
            latitude: routeData.lastLatitude,
            longitude: routeData.lastLongitude,
            location: routeData.lastLocation,
            updatedAt:
              routeData.lastLocationAt ||
              new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load route"
        );
      } finally {
        setLoading(false);
      }
    };

    loadRoute();

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${apiBase}/ws/tracking`),

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,

      onWebSocketError: () => {
        setConnected(false);
        setError("WebSocket connection failed");
      },
    });

    client.onConnect = () => {
      if (disposed) {
        return;
      }

      setConnected(true);
      setError("");

      subscription = client.subscribe(
        `/topic/shipments/${shipmentId}`,
        (message) => {
          const update: LiveLocation = JSON.parse(message.body);
          setLiveLocation(update);
        }
      );
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.onStompError = () => {
      setConnected(false);
      setError("Live tracking connection failed");
    };

    client.activate();

    return () => {
      disposed = true;
      subscription?.unsubscribe();
      void client.deactivate();
    };
  }, [shipmentId, router, apiBase]);

  useEffect(() => {
    if (!mapLoaded || !route?.origin || !route?.destination) {
      return;
    }

    let cancelled = false;

    const calculateRoute = async () => {
      try {
const { Route } = await google.maps.importLibrary("routes") as any;        
const result = await Route.computeRoutes({
          origin: route.origin,
          destination: route.destination,
          travelMode: "DRIVING",
          fields: [
            "path",
            "distanceMeters",
            "durationMillis",
            "viewport",
          ],
        });

        if (cancelled) {
          return;
        }

        const calculatedRoute = result.routes?.[0];

        if (!calculatedRoute?.path) {
          setError("Google Maps could not calculate the route");
          return;
        }

      const path = calculatedRoute.path.map((point: any) => ({
  lat:
    typeof point.lat === "function"
      ? point.lat()
      : point.lat,
  lng:
    typeof point.lng === "function"
      ? point.lng()
      : point.lng,
}));

        setRoutePath(path);
      } catch (err) {
        if (!cancelled) {
          console.error("Google Routes failed:", err);
          setError(
            "Google Maps route could not be loaded"
          );
        }
      }
    };

    calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [mapLoaded, route]);

  const latitude =
    liveLocation?.latitude ?? route?.lastLatitude;

  const longitude =
    liveLocation?.longitude ?? route?.lastLongitude;

  const mapCenter = useMemo(() => {
    if (
      latitude !== undefined &&
      longitude !== undefined
    ) {
      return {
        lat: latitude,
        lng: longitude,
      };
    }

    if (routePath.length > 0) {
      return routePath[0];
    }

    return defaultCenter;
  }, [latitude, longitude, routePath]);

  const directionsUrl = route
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
        route.origin || ""
      )}&destination=${encodeURIComponent(
        route.destination || ""
      )}`
    : "#";

  if (loading) {
    return (
      <main style={styles.center}>
        Loading tracking details...
      </main>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <main style={styles.center}>
        Google Maps API key is missing.
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Live Shipment Tracking
            </h1>

            <p style={styles.subtitle}>
              Shipment #{shipmentId}
            </p>
          </div>

          <span
            style={{
              ...styles.status,
              backgroundColor: connected
                ? "#dcfce7"
                : "#fee2e2",
              color: connected
                ? "#166534"
                : "#991b1b",
            }}
          >
            {connected
              ? "Live Connected"
              : "Disconnected"}
          </span>
        </div>

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        {route && (
          <div style={styles.routeBox}>
            <div>
              <strong>Origin</strong>
              <p>
                {route.origin || "Not available"}
              </p>
            </div>

            <div>
              <strong>Destination</strong>
              <p>
                {route.destination ||
                  "Not available"}
              </p>
            </div>

            <div>
              <strong>Distance</strong>
              <p>
                {route.distanceKm
                  ? `${route.distanceKm} km`
                  : "Not available"}
              </p>
            </div>

            <div>
              <strong>Estimated Time</strong>
              <p>
                {route.estimatedTimeMinutes
                  ? `${route.estimatedTimeMinutes} minutes`
                  : "Not available"}
              </p>
            </div>
          </div>
        )}

        <div style={styles.locationBox}>
          <h2 style={styles.sectionTitle}>
            Current Location
          </h2>

          {liveLocation ? (
            <>
              <p>
                <strong>Place:</strong>{" "}
                {liveLocation.location ||
                  "GPS location received"}
              </p>

              <p>
                <strong>Latitude:</strong>{" "}
                {liveLocation.latitude}
              </p>

              <p>
                <strong>Longitude:</strong>{" "}
                {liveLocation.longitude}
              </p>

              <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(
                  liveLocation.updatedAt
                ).toLocaleString()}
              </p>
            </>
          ) : (
            <p>
              Driver location is not available yet.
            </p>
          )}
        </div>

        <LoadScript
          googleMapsApiKey={googleMapsApiKey}
          libraries={googleLibraries}
          onLoad={() => setMapLoaded(true)}
        >
          <GoogleMap
            mapContainerStyle={styles.map}
            center={mapCenter}
            zoom={routePath.length > 0 ? 7 : 15}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {latitude !== undefined &&
              longitude !== undefined && (
                <Marker
                  position={{
                    lat: latitude,
                    lng: longitude,
                  }}
                  title="Current driver location"
                />
              )}

            {routePath.length > 0 && (
              <Polyline
                path={routePath}
                options={{
                  strokeColor: "#2563eb",
                  strokeOpacity: 0.9,
                  strokeWeight: 5,
                  geodesic: true,
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {route && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            style={styles.link}
          >
            Open planned route in Google Maps
          </a>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "#f3f6fb",
  },

  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
  },

  card: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "28px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.12)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
  },

  title: {
    margin: 0,
    color: "#0f172a",
  },

  subtitle: {
    color: "#64748b",
  },

  status: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 700,
  },

  error: {
    padding: "12px",
    color: "#991b1b",
    background: "#fee2e2",
    borderRadius: "8px",
  },

  routeBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    margin: "24px 0",
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
  },

  locationBox: {
    marginBottom: "20px",
    padding: "18px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#1e3a8a",
  },

  sectionTitle: {
    marginTop: 0,
  },

  map: {
    width: "100%",
    height: "420px",
    borderRadius: "14px",
  },

  link: {
    display: "inline-block",
    marginTop: "18px",
    color: "#1d4ed8",
    fontWeight: 700,
  },
};