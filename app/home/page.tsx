"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  userId: number;
  shipmentId: number;
  title: string;
  message: string;
  type: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

interface UserProfile {
  id?: number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Shipment {
  id: number;
  trackingNumber?: string;
  status?: string;
  origin?: string;
  destination?: string;
  assignedOperatorId?: number | null;
}

export default function HomePage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [assignedShipments, setAssignedShipments] =
    useState<Shipment[]>([]);

  const [adminShipments, setAdminShipments] =
    useState<Shipment[]>([]);

  const [loadingAdminShipments, setLoadingAdminShipments] =
    useState(false);

  const [loadingShipments, setLoadingShipments] =
    useState(false);

  const [updatingShipmentId, setUpdatingShipmentId] =
    useState<number | null>(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<number, string>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadProfile();
    loadNotifications();

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        const role = user.role?.toUpperCase();

        if (role === "LOGISTICS_OPERATOR") {
          loadAssignedShipments();
        }

        if (role === "ADMINISTRATOR") {
          loadAdminShipments();
        }
      } catch (error) {
        console.error(
          "Error checking user role:",
          error
        );
      }
    }
  }, [router]);

  const loadProfile = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setProfile(user);
    } catch (error) {
      console.error(
        "Error loading profile:",
        error
      );
    }
  };

  const loadNotifications = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (!user.id) {
        console.error("User ID not found");
        return;
      }

      setLoadingNotifications(true);

      const response = await fetch(
        `http://localhost:8080/api/notifications?userId=${user.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch notifications:",
          response.status
        );
        return;
      }

      const data = await response.json();

      setNotifications(data);
    } catch (error) {
      console.error(
        "Error loading notifications:",
        error
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadAdminShipments = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      setLoadingAdminShipments(true);

      const response = await fetch(
        "http://localhost:8080/api/shipments",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch admin shipments:",
          response.status
        );
        return;
      }

      const data = await response.json();

      const shipments = Array.isArray(data) ? data : [];

      const shipmentsWithRoutes = await Promise.all(
        shipments.map(async (shipment: Shipment) => {
          try {
            const routeResponse = await fetch(
              `http://localhost:8080/api/routes/${shipment.id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              }
            );

            if (!routeResponse.ok) {
              return shipment;
            }

            const routeText = await routeResponse.text();

            if (!routeText) {
              return shipment;
            }

            const routeData = JSON.parse(routeText);
            const route = Array.isArray(routeData)
              ? routeData[0]
              : routeData;

            return {
              ...shipment,
              origin: route?.origin || shipment.origin,
              destination: route?.destination || shipment.destination,
            };
          } catch (routeError) {
            console.error(
              `Error loading route for shipment ${shipment.id}:`,
              routeError
            );
            return shipment;
          }
        })
      );

      setAdminShipments(shipmentsWithRoutes);
    } catch (error) {
      console.error(
        "Error loading admin shipments:",
        error
      );
    } finally {
      setLoadingAdminShipments(false);
    }
  };

  const loadAssignedShipments = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      setLoadingShipments(true);

      const response = await fetch(
        "http://localhost:8080/api/shipments",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to fetch assigned shipments:",
          response.status
        );
        return;
      }

      const data = await response.json();

      const shipments = Array.isArray(data) ? data : [];

      const shipmentsWithRoutes = await Promise.all(
        shipments.map(async (shipment: Shipment) => {
          try {
            const routeResponse = await fetch(
              `http://localhost:8080/api/routes/${shipment.id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              }
            );

            if (!routeResponse.ok) {
              return shipment;
            }

            const routeText = await routeResponse.text();

            if (!routeText) {
              return shipment;
            }

            const routeData = JSON.parse(routeText);
            const route = Array.isArray(routeData)
              ? routeData[0]
              : routeData;

            return {
              ...shipment,
              origin: route?.origin || shipment.origin,
              destination: route?.destination || shipment.destination,
            };
          } catch (routeError) {
            console.error(
              `Error loading route for shipment ${shipment.id}:`,
              routeError
            );
            return shipment;
          }
        })
      );

      setAssignedShipments(shipmentsWithRoutes);
    } catch (error) {
      console.error(
        "Error loading assigned shipments:",
        error
      );
    } finally {
      setLoadingShipments(false);
    }
  };

  const updateShipmentStatus = async (
    shipmentId: number
  ) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert(
        "Session expired. Please login again."
      );
      router.replace("/login");
      return;
    }

    const newStatus =
      selectedStatuses[shipmentId];

    if (!newStatus) {
      alert(
        "Please select a shipment status."
      );
      return;
    }

    try {
      setUpdatingShipmentId(shipmentId);

      const response = await fetch(
        `http://localhost:8080/api/shipments/${shipmentId}/status?status=${encodeURIComponent(
          newStatus
        )}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        console.error(
          "Status update failed:",
          response.status,
          responseText
        );

        alert(
          responseText ||
            "Failed to update shipment status."
        );

        return;
      }

      const updatedShipment =
        JSON.parse(responseText);

      setAssignedShipments(
        (currentShipments) =>
          currentShipments.map(
            (shipment) =>
              shipment.id === shipmentId
                ? {
                    ...shipment,
                    status:
                      updatedShipment.status ||
                      newStatus,
                  }
                : shipment
          )
      );

      setSelectedStatuses(
        (currentStatuses) => ({
          ...currentStatuses,
          [shipmentId]:
            updatedShipment.status ||
            newStatus,
        })
      );

      alert(
        `Shipment #${shipmentId} status updated to ${newStatus}.`
      );
    } catch (error) {
      console.error(
        "Error updating shipment status:",
        error
      );

      alert(
        "Unable to connect to the server."
      );
    } finally {
      setUpdatingShipmentId(null);
    }
  };

  const markAsRead = async (
    notificationId: number
  ) => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      const response = await fetch(
        `http://localhost:8080/api/notifications/${notificationId}/read?userId=${user.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to mark notification as read:",
          response.status
        );
        return;
      }

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    readAt:
                      new Date().toISOString(),
                  }
                : notification
          )
      );
    } catch (error) {
      console.error(
        "Error marking notification as read:",
        error
      );
    }
  };

  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt
  ).length;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  const displayName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    "User";

  const displayEmail =
    profile?.email ||
    "Email not available";

  const displayRole =
    profile?.role ||
    "Role not available";

  /*
   * =====================================================
   * ROLE BASED ACCESS
   * =====================================================
   */

  const normalizedRole =
    displayRole.toUpperCase();

  const isAdmin =
    normalizedRole === "ADMINISTRATOR";

  const isCustomer =
    normalizedRole === "CUSTOMER";

  const isBusinessClient =
    normalizedRole === "BUSINESS_CLIENT";

  const isLogisticsOperator =
    normalizedRole === "LOGISTICS_OPERATOR";

  const isSupportAgent =
    normalizedRole === "SUPPORT_AGENT";

  /*
   * Customer + Business Client + Admin
   * can create/manage shipments.
   *
   * Logistics Operator must NOT get
   * shipment creation access.
   */

  const canCreateShipment =
    isAdmin ||
    isCustomer ||
    isBusinessClient;

  /*
   * Shipment tracking.
   */

  const canTrackShipment =
    isAdmin ||
    isCustomer ||
    isBusinessClient ||
    isLogisticsOperator ||
    isSupportAgent;

  /*
   * Live monitoring.
   */

  const canLiveMonitor =
    isAdmin ||
    isCustomer ||
    isBusinessClient ||
    isLogisticsOperator;

  /*
   * ETA prediction.
   */

  const canViewETA =
    isAdmin ||
    isCustomer ||
    isBusinessClient ||
    isLogisticsOperator;

  /*
   * POD submission.
   *
   * Logistics Operator and Admin only.
   */

  const canSubmitPOD =
    isAdmin ||
    isLogisticsOperator;

  /*
   * POD verification.
   *
   * Support Agent and Admin only.
   */

  const canVerifyPOD =
    isSupportAgent ||
    isAdmin;

  const navigateFromSidebar = (path: string) => {
    setShowNotifications(false);
    setShowProfile(false);
    router.push(path);
  };

  return (
    <main
      className="dashboard-page"
      style={{
        minHeight: "100vh",
        paddingLeft: "235px",
        boxSizing: "border-box",
      }}
    >
      {/* ========================= */}
      {/* ROLE-BASED SIDE NAVIGATION */}
      {/* ========================= */}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "235px",
          background: "#0b1220",
          color: "#ffffff",
          padding: "22px 14px",
          boxSizing: "border-box",
          zIndex: 1200,
          overflowY: "auto",
          boxShadow: "4px 0 22px rgba(15, 23, 42, 0.14)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "4px 10px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "19px",
              boxShadow: "0 6px 14px rgba(37, 99, 235, 0.28)",
            }}
          >
            S
          </div>

          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              ShipTrack
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              Delivery Visibility
            </div>
          </div>
        </div>

        {isAdmin ? (
          <>
            <div
              style={{
                padding: "0 10px 9px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Operations
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[
                ["▦", "Dashboard", "#"],
                ["📦", "Shipments", "/shipments"],
                ["📍", "Track Shipment", "/tracking"],
                ["🚚", "Live Monitoring", "/monitoring"],
                ["⏱", "ETA Prediction", "/eta"],
              ].map(([icon, label, path], index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (path === "#") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      return;
                    }
                    navigateFromSidebar(path);
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "9px",
                    background: index === 0
                      ? "linear-gradient(90deg, #1d4ed8, #2563eb)"
                      : "transparent",
                    color: index === 0 ? "#ffffff" : "#cbd5e1",
                    padding: "11px 12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: index === 0
                      ? "0 6px 14px rgba(37, 99, 235, 0.22)"
                      : "none",
                  }}
                >
                  <span>{icon}</span>
                  <span style={{ marginLeft: "8px" }}>{label}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                padding: "22px 10px 9px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Insights & Administration
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[
                ["📊", "Analytics Dashboard", "/analytics"],
                ["📄", "Reports & Export", "/reports"],
                                ["🔍", "POD Verification", "/pod/verification"],
              ].map(([icon, label, path]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigateFromSidebar(path)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "9px",
                    background: "transparent",
                    color: "#cbd5e1",
                    padding: "11px 12px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <span>{icon}</span>
                  <span style={{ marginLeft: "8px" }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
        <>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "0 10px 9px",
          }}
        >
          Dashboard
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {canCreateShipment && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/shipments")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "#1e3a8a",
                color: "#ffffff",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📦 <span style={{ marginLeft: "7px" }}>Shipments</span>
            </button>
          )}

          {isLogisticsOperator && (
            <button
              type="button"
              onClick={() => {
                setShowNotifications(false);
                setShowProfile(false);
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🚚 <span style={{ marginLeft: "7px" }}>Assigned Shipments</span>
            </button>
          )}

          {canTrackShipment && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/tracking")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📍 <span style={{ marginLeft: "7px" }}>Track Shipment</span>
            </button>
          )}

          {canLiveMonitor && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/monitoring")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🚚 <span style={{ marginLeft: "7px" }}>Live Monitoring</span>
            </button>
          )}

          {canViewETA && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/eta")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ⏱️ <span style={{ marginLeft: "7px" }}>ETA Prediction</span>
            </button>
          )}

          {(isCustomer || isBusinessClient || isAdmin) && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/analytics")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📊 <span style={{ marginLeft: "7px" }}>Analytics Dashboard</span>
            </button>
          )}

          {(isCustomer || isBusinessClient || isAdmin) && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/reports")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📄 <span style={{ marginLeft: "7px" }}>Reports & Export</span>
            </button>
          )}

          {canSubmitPOD && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/pod")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✅ <span style={{ marginLeft: "7px" }}>Complete Delivery</span>
            </button>
          )}

          {canVerifyPOD && (
            <button
              type="button"
              onClick={() => navigateFromSidebar("/pod/verification")}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "9px",
                background: "transparent",
                color: "#cbd5e1",
                padding: "11px 12px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔍 <span style={{ marginLeft: "7px" }}>POD Verification</span>
            </button>
          )}
        </div>
        </>
        )}        <div
          style={{
            position: "absolute",
            left: "14px",
            right: "14px",
            bottom: "18px",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "10px",
            padding: "10px 12px",
            background: "rgba(255,255,255,0.035)",
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          Role: {displayRole}
        </div>
      </aside>

      {/* ========================= */}
      {/* TOP NAVIGATION */}
      {/* ========================= */}


      {/* ========================= */}
      {/* Navigation */}
      {/* ========================= */}

      <nav
        className="dashboard-nav"
        style={{
          marginLeft: "0",
          width: "100%",
          boxSizing: "border-box",
          paddingLeft: "105px",
          paddingRight: "32px",
        }}
      >

        <div className="dashboard-brand">
          ShipTrack
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >

          {/* ========================= */}
          {/* Notification Bell */}
          {/* ========================= */}

          <div
            style={{
              position: "relative",
            }}
          >

            <button
              type="button"
              onClick={() => {
                setShowNotifications(
                  !showNotifications
                );

                setShowProfile(false);

                if (!showNotifications) {
                  loadNotifications();
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "25px",
                padding: "6px",
                position: "relative",
              }}
              aria-label="Notifications"
            >
              🔔

              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "19px",
                    height: "19px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "45px",
                  right: "0",
                  width: "360px",
                  maxHeight: "450px",
                  overflowY: "auto",
                  background: "white",
                  borderRadius: "10px",
                  boxShadow:
                    "0 8px 25px rgba(0, 0, 0, 0.2)",
                  zIndex: 1000,
                  color: "#222",
                }}
              >

                <div
                  style={{
                    padding: "15px",
                    borderBottom:
                      "1px solid #ddd",
                    fontWeight: "bold",
                    fontSize: "17px",
                  }}
                >
                  Notifications
                </div>

                {loadingNotifications ? (
                  <div
                    style={{
                      padding: "25px",
                      textAlign: "center",
                    }}
                  >
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "30px 15px",
                      textAlign: "center",
                      color: "#777",
                    }}
                  >
                    No notifications
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <div
                        key={notification.id}
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                        style={{
                          padding: "14px 15px",
                          borderBottom:
                            "1px solid #eeeeee",
                          cursor: "pointer",
                          backgroundColor:
                            notification.readAt
                              ? "white"
                              : "#eef5ff",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: "10px",
                          }}
                        >

                          <strong>
                            {notification.title}
                          </strong>

                          {!notification.readAt && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "red",
                                flexShrink: 0,
                                marginTop: "6px",
                              }}
                            />
                          )}

                        </div>

                        <p
                          style={{
                            margin: "7px 0",
                            fontSize: "14px",
                            lineHeight: "1.4",
                          }}
                        >
                          {notification.message}
                        </p>

                        <small
                          style={{
                            color: "#777",
                          }}
                        >
                          {new Date(
                            notification.createdAt
                          ).toLocaleString()}
                        </small>

                      </div>
                    )
                  )
                )}

              </div>
            )}

          </div>

          {/* ========================= */}
          {/* Profile */}
          {/* ========================= */}

          <div
            style={{
              position: "relative",
            }}
          >

            <button
              type="button"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
                loadProfile();
              }}
              aria-label="Profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: "22px",
                padding: "7px 12px",
                cursor: "pointer",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >

              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <span>Profile</span>

              <span
                style={{
                  fontSize: "11px",
                  marginLeft: "2px",
                }}
              >
                ▼
              </span>

            </button>

            {/* Profile Dropdown */}

            {showProfile && (
              <div
                style={{
                  position: "absolute",
                  top: "48px",
                  right: "0",
                  width: "290px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  boxShadow:
                    "0 10px 30px rgba(15, 23, 42, 0.18)",
                  border:
                    "1px solid #e5e7eb",
                  zIndex: 1100,
                  overflow: "hidden",
                  color: "#111827",
                }}
              >

                <div
                  style={{
                    padding: "20px",
                    background: "#f8fafc",
                    borderBottom:
                      "1px solid #e5e7eb",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >

                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {displayName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "17px",
                          marginBottom: "4px",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {displayName}
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          color: "#64748b",
                          overflow:
                            "hidden",
                          textOverflow:
                            "ellipsis",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {displayEmail}
                      </div>

                    </div>

                  </div>

                </div>

                <div
                  style={{
                    padding: "16px 20px",
                  }}
                >

                  <div
                    style={{
                      marginBottom: "14px",
                    }}
                  >

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginBottom: "4px",
                      }}
                    >
                      Role
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {displayRole}
                    </div>

                  </div>

                  {profile?.phone && (
                    <div
                      style={{
                        marginBottom: "4px",
                      }}
                    >

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Phone
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {profile.phone}
                      </div>

                    </div>
                  )}

                </div>

                <div
                  style={{
                    borderTop:
                      "1px solid #e5e7eb",
                    padding: "10px",
                  }}
                >

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      width: "100%",
                      padding: "11px 12px",
                      border: "none",
                      borderRadius: "9px",
                      background: "#fff1f2",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    🚪 Logout
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>

      </nav>

      {/* ========================= */}
      {/* Dashboard Content */}
      {/* ========================= */}

      <section className="dashboard-content">

        {isAdmin ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "26px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "12px",
                  }}
                >
                  <span>●</span>
                  ADMINISTRATOR CONSOLE
                </div>

                <h1
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "32px",
                    lineHeight: 1.15,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Operations Overview
                </h1>

                <p
                  style={{
                    margin: "9px 0 0",
                    color: "#64748b",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    maxWidth: "650px",
                  }}
                >
                  Monitor the shipment network, review delivery activity,
                  and access operational controls from one place.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAdminShipments}
                disabled={loadingAdminShipments}
                style={{
                  border: "1px solid #dbe3ef",
                  background: "#ffffff",
                  color: "#1e293b",
                  borderRadius: "10px",
                  padding: "10px 15px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: loadingAdminShipments
                    ? "not-allowed"
                    : "pointer",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                }}
              >
                {loadingAdminShipments ? "Refreshing..." : "↻ Refresh Overview"}
              </button>
            </div>

            {(() => {
              const total = adminShipments.length;
              const delivered = adminShipments.filter(
                (shipment) =>
                  shipment.status?.toUpperCase() === "DELIVERED"
              ).length;
              const inTransit = adminShipments.filter((shipment) =>
                ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(
                  shipment.status?.toUpperCase() || ""
                )
              ).length;
              const pending = Math.max(total - delivered - inTransit, 0);

              const stats = [
                {
                  label: "Total Shipments",
                  value: total,
                  note: "Across the platform",
                  icon: "📦",
                },
                {
                  label: "In Transit",
                  value: inTransit,
                  note: "Currently moving",
                  icon: "🚚",
                },
                {
                  label: "Delivered",
                  value: delivered,
                  note: "Successfully completed",
                  icon: "✓",
                },
                {
                  label: "Pending",
                  value: pending,
                  note: "Awaiting movement",
                  icon: "◷",
                },
              ];

              return (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(210px, 1fr))",
                      gap: "16px",
                      marginBottom: "28px",
                    }}
                  >
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e6ebf2",
                          borderRadius: "16px",
                          padding: "20px",
                          boxShadow:
                            "0 8px 24px rgba(15, 23, 42, 0.055)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "18px",
                          }}
                        >
                          <span
                            style={{
                              width: "40px",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "11px",
                              background: "#f1f5f9",
                              fontSize: "19px",
                            }}
                          >
                            {stat.icon}
                          </span>
                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: "11px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Live
                          </span>
                        </div>

                        <div
                          style={{
                            color: "#0f172a",
                            fontSize: "30px",
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {stat.value}
                        </div>

                        <div
                          style={{
                            marginTop: "8px",
                            color: "#334155",
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          {stat.label}
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            color: "#94a3b8",
                            fontSize: "12px",
                          }}
                        >
                          {stat.note}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1.55fr) minmax(300px, 0.85fr)",
                      gap: "20px",
                      alignItems: "start",
                    }}
                  >
                    <section
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e6ebf2",
                        borderRadius: "16px",
                        padding: "22px",
                        boxShadow:
                          "0 8px 24px rgba(15, 23, 42, 0.055)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          marginBottom: "18px",
                        }}
                      >
                        <div>
                          <h2
                            style={{
                              margin: 0,
                              color: "#0f172a",
                              fontSize: "19px",
                              fontWeight: 800,
                            }}
                          >
                            Recent Shipments
                          </h2>
                          <p
                            style={{
                              margin: "5px 0 0",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            Latest shipment activity across the system.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push("/shipments")}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#2563eb",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          View all →
                        </button>
                      </div>

                      {loadingAdminShipments ? (
                        <div
                          style={{
                            padding: "35px 15px",
                            textAlign: "center",
                            color: "#64748b",
                            background: "#f8fafc",
                            borderRadius: "12px",
                          }}
                        >
                          Loading shipment activity...
                        </div>
                      ) : adminShipments.length === 0 ? (
                        <div
                          style={{
                            padding: "35px 15px",
                            textAlign: "center",
                            color: "#64748b",
                            background: "#f8fafc",
                            borderRadius: "12px",
                          }}
                        >
                          No shipment activity available.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              minWidth: "650px",
                            }}
                          >
                            <thead>
                              <tr>
                                {[
                                  "Shipment",
                                  "Route",
                                  "Status",
                                  "Operator",
                                ].map((heading) => (
                                  <th
                                    key={heading}
                                    style={{
                                      padding: "10px 12px",
                                      textAlign: "left",
                                      color: "#94a3b8",
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                      borderBottom:
                                        "1px solid #eef2f7",
                                    }}
                                  >
                                    {heading}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {adminShipments
                                .slice()
                                .reverse()
                                .slice(0, 6)
                                .map((shipment) => {
                                  const status =
                                    shipment.status?.toUpperCase() ||
                                    "UNKNOWN";

                                  const statusBackground =
                                    status === "DELIVERED"
                                      ? "#ecfdf3"
                                      : status === "IN_TRANSIT" ||
                                        status === "OUT_FOR_DELIVERY"
                                      ? "#eff6ff"
                                      : "#f8fafc";

                                  const statusColor =
                                    status === "DELIVERED"
                                      ? "#15803d"
                                      : status === "IN_TRANSIT" ||
                                        status === "OUT_FOR_DELIVERY"
                                      ? "#1d4ed8"
                                      : "#475569";

                                  return (
                                    <tr key={shipment.id}>
                                      <td
                                        style={{
                                          padding: "14px 12px",
                                          borderBottom:
                                            "1px solid #f1f5f9",
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            router.push(
                                              `/tracking/${shipment.id}`
                                            )
                                          }
                                          style={{
                                            border: "none",
                                            background: "transparent",
                                            padding: 0,
                                            color: "#0f172a",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            textAlign: "left",
                                          }}
                                        >
                                          #{shipment.id}
                                          <span
                                            style={{
                                              display: "block",
                                              marginTop: "3px",
                                              color: "#64748b",
                                              fontSize: "11px",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {shipment.trackingNumber ||
                                              "No tracking number"}
                                          </span>
                                        </button>
                                      </td>

                                      <td
                                        style={{
                                          padding: "14px 12px",
                                          borderBottom:
                                            "1px solid #f1f5f9",
                                          color: "#475569",
                                          fontSize: "12px",
                                          lineHeight: 1.45,
                                        }}
                                      >
                                        <div>
                                          {shipment.origin || "N/A"}
                                        </div>
                                        <div style={{ color: "#94a3b8" }}>
                                          ↓ {shipment.destination || "N/A"}
                                        </div>
                                      </td>

                                      <td
                                        style={{
                                          padding: "14px 12px",
                                          borderBottom:
                                            "1px solid #f1f5f9",
                                        }}
                                      >
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            padding: "5px 9px",
                                            borderRadius: "999px",
                                            background:
                                              statusBackground,
                                            color: statusColor,
                                            fontSize: "11px",
                                            fontWeight: 800,
                                          }}
                                        >
                                          {status.replaceAll("_", " ")}
                                        </span>
                                      </td>

                                      <td
                                        style={{
                                          padding: "14px 12px",
                                          borderBottom:
                                            "1px solid #f1f5f9",
                                          color: "#64748b",
                                          fontSize: "12px",
                                        }}
                                      >
                                        {shipment.assignedOperatorId
                                          ? `Operator #${shipment.assignedOperatorId}`
                                          : "Unassigned"}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section
                      style={{
                        background: "#0f172a",
                        borderRadius: "16px",
                        padding: "22px",
                        color: "#ffffff",
                        boxShadow:
                          "0 10px 28px rgba(15, 23, 42, 0.14)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#93c5fd",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Control Center
                      </div>

                      <h2
                        style={{
                          margin: "8px 0 7px",
                          fontSize: "20px",
                          fontWeight: 800,
                        }}
                      >
                        Quick Actions
                      </h2>

                      <p
                        style={{
                          margin: "0 0 18px",
                          color: "#94a3b8",
                          fontSize: "13px",
                          lineHeight: 1.55,
                        }}
                      >
                        Access the tools most frequently used for platform
                        operations and oversight.
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "9px",
                        }}
                      >
                        {[
                          ["📦", "Shipments", "/shipments"],
                          ["📍", "Tracking", "/tracking"],
                          ["🚚", "Monitoring", "/monitoring"],
                          ["⏱", "ETA", "/eta"],
                          ["📊", "Analytics", "/analytics"],
                          ["📄", "Reports", "/reports"],
                                                    ["🔍", "POD Review", "/pod/verification"],
                        ].map(([icon, label, path]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => router.push(path)}
                            style={{
                              border: "1px solid rgba(255,255,255,0.09)",
                              background: "rgba(255,255,255,0.055)",
                              color: "#e2e8f0",
                              borderRadius: "10px",
                              padding: "12px 10px",
                              cursor: "pointer",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ marginRight: "6px" }}>{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <>
            <div className="dashboard-header">

              <h1>
                Welcome to ShipTrack
              </h1>

              <p>
                Manage shipments, monitor deliveries and
                track shipments in real time.
              </p>

            </div>

            <div className="dashboard-grid">

              {/* 1. SHIPMENTS */}

              {canCreateShipment && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/shipments")
                  }
                >
                  <span>📦</span>

                  <h2>Shipments</h2>

                  <p>
                    Create and track your shipments.
                  </p>
                </button>
              )}

              {/* 2. TRACK SHIPMENT */}

              {canTrackShipment && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/tracking")
                  }
                >
                  <span>📍</span>

                  <h2>Track Shipment</h2>

                  <p>
                    View live shipment location and route.
                  </p>
                </button>
              )}

              {/* 3. LIVE MONITORING */}

              {canLiveMonitor && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/monitoring")
                  }
                >
                  <span>🚚</span>

                  <h2>Live Monitoring</h2>

                  <p>
                    Monitor delivery progress and route
                    details in real time.
                  </p>
                </button>
              )}

              {/* 4. ETA PREDICTION */}

              {canViewETA && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/eta")
                  }
                >
                  <span>⏱️</span>

                  <h2>ETA Prediction</h2>

                  <p>
                    View predicted delivery time and delay
                    risk.
                  </p>
                </button>
              )}

              {/* 5. ANALYTICS */}

              {(
                isCustomer ||
                isBusinessClient ||
                isAdmin
              ) && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/analytics")
                  }
                >
                  <span>📊</span>

                  <h2>Analytics Dashboard</h2>

                  <p>
                    View shipment, delivery and operational
                    insights for your role.
                  </p>
                </button>
              )}

              {/* 6. REPORTS */}

              {(
                isCustomer ||
                isBusinessClient ||
                isAdmin
              ) && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/reports")
                  }
                >
                  <span>📄</span>

                  <h2>Reports & Export</h2>

                  <p>
                    Generate and download shipment, delivery,
                    route and delay reports.
                  </p>
                </button>
              )}

              {/* 7. COMPLETE DELIVERY */}

              {canSubmitPOD && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/pod")
                  }
                >
                  <span>✅</span>

                  <h2>Complete Delivery</h2>

                  <p>
                    Submit proof of delivery with recipient
                    name, signature, photo and delivery notes.
                  </p>
                </button>
              )}

              {/* 8. POD VERIFICATION */}

              {canVerifyPOD && (
                <button
                  type="button"
                  className="dashboard-card"
                  onClick={() =>
                    router.push("/pod/verification")
                  }
                >
                  <span>🔍</span>

                  <h2>POD Verification</h2>

                  <p>
                    Review and verify pending proof of
                    delivery submissions.
                  </p>
                </button>
              )}

            </div>
          </>
        )}

        {/* ================================================= */}
        {/* LOGISTICS OPERATOR - ASSIGNED SHIPMENTS */}
        {/* ================================================= */}

        {isLogisticsOperator && (
          <section
            style={{
              marginTop: "30px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "25px",
              boxShadow:
                "0 8px 25px rgba(15, 23, 42, 0.08)",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#111827",
                    fontSize: "22px",
                  }}
                >
                  Assigned Shipments
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Shipments currently assigned to you.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAssignedShipments}
                disabled={loadingShipments}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  borderRadius: "8px",
                  padding: "9px 14px",
                  cursor: loadingShipments
                    ? "not-allowed"
                    : "pointer",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                {loadingShipments
                  ? "Refreshing..."
                  : "↻ Refresh"}
              </button>

            </div>

            {loadingShipments ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Loading assigned shipments...
              </div>
            ) : assignedShipments.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#64748b",
                  background: "#f8fafc",
                  borderRadius: "10px",
                }}
              >
                No shipments are currently assigned
                to you.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >

                {assignedShipments.map(
                  (shipment) => {
                    const isDelivered =
                      shipment.status?.toUpperCase() === "DELIVERED";

                    return (
                      <div
                        key={shipment.id}
                        style={{
                          border:
                            "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "18px",
                          background: "#f8fafc",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                            marginBottom: "14px",
                          }}
                        >

                          <strong
                            style={{
                              color: "#111827",
                              fontSize: "16px",
                            }}
                          >
                            Shipment #{shipment.id}
                          </strong>

                          <span
                            style={{
                              background: "#e0ecff",
                              color: "#1d4ed8",
                              padding: "5px 9px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {shipment.status ||
                              "UNKNOWN"}
                          </span>

                        </div>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "#475569",
                            fontSize: "14px",
                          }}
                        >
                          <strong>
                            Tracking:
                          </strong>{" "}
                          {shipment.trackingNumber ||
                            "N/A"}
                        </p>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "#475569",
                            fontSize: "14px",
                          }}
                        >
                          <strong>
                            From:
                          </strong>{" "}
                          {shipment.origin ||
                            "N/A"}
                        </p>

                        <p
                          style={{
                            margin: "7px 0",
                            color: "#475569",
                            fontSize: "14px",
                          }}
                        >
                          <strong>
                            To:
                          </strong>{" "}
                          {shipment.destination ||
                            "N/A"}
                        </p>

                        <div
                          style={{
                            marginTop: "16px",
                          }}
                        >

                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#374151",
                              marginBottom: "7px",
                            }}
                          >
                            Update Shipment Status
                          </label>

                          <select
                            value={
                              selectedStatuses[
                                shipment.id
                              ] ||
                              shipment.status ||
                              "CREATED"
                            }
                            disabled={isDelivered}
                            onChange={(e) =>
                              setSelectedStatuses(
                                (current) => ({
                                  ...current,
                                  [shipment.id]:
                                    e.target.value,
                                })
                              )
                            }
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px 12px",
                              border:
                                "1px solid #d1d5db",
                              borderRadius: "9px",
                              background:
                                "#ffffff",
                              color: "#111827",
                              fontSize: "14px",
                              cursor: "pointer",
                            }}
                          >

                            <option value="CREATED">
                              CREATED
                            </option>

                            <option value="PICKED_UP">
                              PICKED_UP
                            </option>

                            <option value="IN_TRANSIT">
                              IN_TRANSIT
                            </option>

                            <option value="OUT_FOR_DELIVERY">
                              OUT_FOR_DELIVERY
                            </option>

                            <option value="DELIVERED">
                              DELIVERED
                            </option>

                          </select>

                          <button
                            type="button"
                            disabled={
                              isDelivered ||
                              updatingShipmentId === shipment.id
                            }
                            onClick={() =>
                              updateShipmentStatus(
                                shipment.id
                              )
                            }
                            style={{
                              width: "100%",
                              marginTop: "9px",
                              padding: "11px",
                              border: "none",
                              borderRadius: "9px",
                              background:
                                isDelivered
                                  ? "#94a3b8"
                                  : updatingShipmentId === shipment.id
                                  ? "#93c5fd"
                                  : "#2563eb",
                              color: "#ffffff",
                              fontSize: "14px",
                              fontWeight: 600,
                              cursor:
                                isDelivered || updatingShipmentId === shipment.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {isDelivered
                              ? "Status Locked"
                              : updatingShipmentId === shipment.id
                              ? "Updating..."
                              : "Update Status"}
                          </button>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/tracking/${shipment.id}`
                            )
                          }
                          style={{
                            width: "100%",
                            marginTop: "9px",
                            padding: "11px",
                            border:
                              "1px solid #2563eb",
                            borderRadius: "9px",
                            background:
                              "#ffffff",
                            color: "#2563eb",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View Shipment
                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>
        )}

      </section>

    </main>
  );
}