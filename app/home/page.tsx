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

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    loadProfile();
    loadNotifications();
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
      console.error("Error loading profile:", error);
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
    profile?.email || "Email not available";

  const displayRole =
    profile?.role || "Role not available";

  /*
   * POD verification is available only for:
   * SUPPORT_AGENT
   * ADMINISTRATOR
   */
  const canVerifyPOD =
    displayRole.toUpperCase() === "SUPPORT_AGENT" ||
    displayRole.toUpperCase() === "ADMINISTRATOR";

  return (
    <main className="dashboard-page">

      {/* ========================= */}
      {/* Navigation */}
      {/* ========================= */}

      <nav className="dashboard-nav">

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

            {/* ========================= */}
            {/* Notification Dropdown */}
            {/* ========================= */}

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

            {/* ========================= */}
            {/* Profile Dropdown */}
            {/* ========================= */}

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

                {/* Profile Header */}

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

                {/* Profile Details */}

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

                {/* Logout */}

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

          {/* ========================= */}
          {/* 1. SHIPMENTS */}
          {/* ========================= */}

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
              Create and manage your shipments.
            </p>
          </button>

          {/* ========================= */}
          {/* 2. TRACK SHIPMENT */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* 3. LIVE MONITORING */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* 4. ETA PREDICTION */}
          {/* ========================= */}

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

          {/* ========================= */}
          {/* 5. ANALYTICS DASHBOARD */}
          {/* CUSTOMER / BUSINESS / ADMIN */}
          {/* ========================= */}

          {(
            displayRole.toUpperCase() === "CUSTOMER" ||
            displayRole.toUpperCase() === "BUSINESS_CLIENT" ||
            displayRole.toUpperCase() === "ADMINISTRATOR"
          ) && (
            <button
              type="button"
              className="dashboard-card"
              onClick={() => router.push("/analytics")}
            >
              <span>📊</span>

              <h2>Analytics Dashboard</h2>

              <p>
                View shipment, delivery and operational
                insights for your role.
              </p>
            </button>
          )}

          {/* Reports & Export */}
          {(
            displayRole.toUpperCase() === "CUSTOMER" ||
            displayRole.toUpperCase() === "BUSINESS_CLIENT" ||
            displayRole.toUpperCase() === "ADMINISTRATOR"
          ) && (
            <button
              type="button"
              className="dashboard-card"
              onClick={() => router.push("/reports")}
            >
              <span>📄</span>

              <h2>Reports & Export</h2>

              <p>
                Generate and download shipment, delivery,
                route and delay reports.
              </p>
            </button>
          )}

          {/* Complete Delivery */}
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

          {/* ========================= */}
          {/* 6. POD VERIFICATION */}
          {/* SUPPORT AGENT / ADMIN ONLY */}
          {/* ========================= */}

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

      </section>

    </main>
  );
}