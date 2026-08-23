"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
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
  actualTimeMinutes?: number;
  trafficCondition?: string;
  createdAt?: string;
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
  lat: 13.0827,
  lng: 80.2707,
};

export default function TrackingPage() {
  const params = useParams<{ shipmentId: string }>();
  const router = useRouter();

  const shipmentId = params?.shipmentId;

  const [route, setRoute] = useState<RouteInfo | null>(null);

  const [liveLocation, setLiveLocation] =
    useState<LiveLocation | null>(null);

  const [routePath, setRoutePath] =
    useState<RoutePathPoint[]>([]);

  const [mapInstance, setMapInstance] =
    useState<google.maps.Map | null>(null);

  const [connected, setConnected] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

  const googleMapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const {
    isLoaded: mapLoaded,
    loadError: mapLoadError,
  } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey,
    libraries: googleLibraries,
  });

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
        setLoading(true);
        setError("");

        const response = await fetch(
          `${apiBase}/api/routes/${shipmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.replace("/login");
            return;
          }

          if (response.status === 403) {
            throw new Error(
              "You are not authorized to view this shipment route."
            );
          }

          if (response.status === 404) {
            throw new Error(
              "Route not found for this shipment."
            );
          }

          throw new Error(
            `Route could not be loaded (${response.status})`
          );
        }

        const data = await response.json();

        const routeData = Array.isArray(data)
          ? data[0]
          : data;

        if (!routeData) {
          throw new Error(
            "No route found for this shipment."
          );
        }

        if (disposed) {
          return;
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
        if (!disposed) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load route."
          );
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
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
    });

    client.onConnect = () => {
      if (disposed) {
        return;
      }

      setConnected(true);

      subscription = client.subscribe(
        `/topic/shipments/${shipmentId}`,
        (message) => {
          try {
            const update: LiveLocation =
              JSON.parse(message.body);

            if (!disposed) {
              setLiveLocation(update);
            }
          } catch (err) {
            console.error(
              "Invalid live location message:",
              err
            );
          }
        }
      );
    };

    client.onDisconnect = () => {
      if (!disposed) {
        setConnected(false);
      }
    };

    client.onStompError = () => {
      if (!disposed) {
        setConnected(false);
      }
    };

    client.onWebSocketError = () => {
      if (!disposed) {
        setConnected(false);
      }
    };

    client.activate();

    return () => {
      disposed = true;

      subscription?.unsubscribe();

      void client.deactivate();
    };
  }, [shipmentId, router, apiBase]);

  useEffect(() => {
    if (
      !mapLoaded ||
      !route?.origin ||
      !route?.destination
    ) {
      return;
    }

    let cancelled = false;

    const calculateRoute = async () => {
      try {
       const routesLibrary = await google.maps.importLibrary("routes");

const Route = (routesLibrary as any).Route;

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

        const calculatedRoute =
          result.routes?.[0];

        if (!calculatedRoute?.path) {
          setError(
            "Google Maps could not calculate the route."
          );
          return;
        }

        const path =
          calculatedRoute.path.map(
            (point) => ({
              lat:
                typeof point.lat === "function"
                  ? point.lat()
                  : point.lat,

              lng:
                typeof point.lng === "function"
                  ? point.lng()
                  : point.lng,
            })
          );

        if (!cancelled) {
          setRoutePath(path);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Google Routes failed:",
            err
          );

          setError(
            "Google Maps route could not be loaded."
          );
        }
      }
    };

    calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [
    mapLoaded,
    route?.origin,
    route?.destination,
  ]);

  /*
   * Native Google Maps Polyline
   *
   * We are NOT removing the blue route.
   * We are creating the same Polyline directly
   * on the actual Google Maps instance.
   */
  useEffect(() => {
    if (
      !mapInstance ||
      routePath.length === 0
    ) {
      return;
    }

    const polyline =
      new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapInstance,
      });

    return () => {
      polyline.setMap(null);
    };
  }, [mapInstance, routePath]);

  const latitude =
    liveLocation?.latitude ??
    route?.lastLatitude;

  const longitude =
    liveLocation?.longitude ??
    route?.lastLongitude;

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
  }, [
    latitude,
    longitude,
    routePath,
  ]);

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
        <div style={styles.loadingBox}>
          <h2>Loading shipment tracking...</h2>

          <p>
            Please wait while we load the route.
          </p>
        </div>
      </main>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <main style={styles.center}>
        <div style={styles.loadingBox}>
          <h2>Google Maps configuration missing</h2>

          <p>
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not
            configured.
          </p>
        </div>
      </main>
    );
  }

  if (mapLoadError) {
    return (
      <main style={styles.center}>
        <div style={styles.loadingBox}>
          <h2>Google Maps could not be loaded</h2>

          <p>
            Please check your Google Maps API key
            and configuration.
          </p>

          <button
            style={styles.backButton}
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  if (!route) {
    return (
      <main style={styles.center}>
        <div style={styles.loadingBox}>
          <h2>Shipment Tracking</h2>

          <p>
            {error || "Route not found."}
          </p>

          <button
            style={styles.backButton}
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </div>
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

        <div style={styles.routeBox}>

          <div>
            <strong style={styles.routeLabel}>
              Origin
            </strong>

            <p style={styles.routeValue}>
              {route.origin ||
                "Not available"}
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
              {route.distanceKm !== undefined &&
              route.distanceKm !== null
                ? `${route.distanceKm} km`
                : "Not available"}
            </p>
          </div>

          <div>
            <strong style={styles.routeLabel}>
              Estimated Time
            </strong>

            <p style={styles.routeValue}>
              {route.estimatedTimeMinutes !==
                undefined &&
              route.estimatedTimeMinutes !== null
                ? `${route.estimatedTimeMinutes} minutes`
                : "Not available"}
            </p>
          </div>

        </div>

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

        {!mapLoaded ? (
          <div style={styles.mapLoading}>
            Loading Google Maps...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={styles.map}
            center={mapCenter}
            zoom={
              routePath.length > 0
                ? 7
                : 15
            }
            onLoad={(map) =>
              setMapInstance(map)
            }
            onUnmount={() =>
              setMapInstance(null)
            }
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
          </GoogleMap>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          style={styles.link}
        >
          Open planned route in Google Maps
        </a>

        <button
          type="button"
          onClick={() => router.back()}
          style={styles.backButton}
        >
          ← Back
        </button>

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
    background: "#f3f6fb",
  },

  loadingBox: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "16px",
    textAlign: "center" as const,
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.10)",
  },

  card: {
    maxWidth: "1000px",
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
    color: "#111827",
  },

  routeLabel: {
    color: "#111827",
    fontWeight: 700,
  },

  routeValue: {
    color: "#374151",
    marginTop: "6px",
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

  mapLoading: {
    width: "100%",
    height: "420px",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
    background: "#f1f5f9",
    color: "#475569",
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

  backButton: {
    display: "block",
    marginTop: "20px",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },
};