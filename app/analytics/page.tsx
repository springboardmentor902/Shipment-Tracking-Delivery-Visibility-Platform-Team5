"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CustomerAnalytics {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  averageDeliveryTimeDays: number;
  statusBreakdown: Record<string, number>;
  shipmentHistory: ShipmentHistory[];
  trackingInsights: TrackingInsight[];
}

interface BusinessAnalytics {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  delayedShipments: number;
  customerCount: number;
  deliverySuccessRate: number;
  averageDeliveryTimeDays: number;
  statusBreakdown: Record<string, number>;
  shipmentAnalytics: ShipmentSummary[];
  routePerformance: RoutePerformance[];
}

interface AdminAnalytics {
  totalUsers: number;
  totalCustomers: number;
  totalBusinessClients: number;
  totalLogisticsOperators: number;
  totalSupportAgents: number;

  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  delayedShipments: number;

  deliverySuccessRate: number;
  averageDeliveryTimeDays: number;

  shipmentStatusBreakdown: Record<string, number>;
  routePerformance: RoutePerformance[];

  systemMonitoring: SystemMonitoring;
  reports: ReportsSummary;
}

interface ShipmentHistory {
  shipmentId: number;
  trackingNumber: string;
  status: string;
  priority: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
}

interface TrackingInsight {
  shipmentId: number;
  trackingNumber: string;
  currentStatus: string;
  latestLocation: string | null;
  latestEventTime: string | null;
  trackingEventCount: number;
}

interface ShipmentSummary {
  shipmentId?: number;
  trackingNumber?: string;
  status?: string;
  priority?: string;
  customerName?: string;
  customerEmail?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  estimatedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
}

interface RoutePerformance {
  routeId: number;
  shipmentId: number;
  origin: string;
  destination: string;
  distanceKm: number | null;
  estimatedTimeMinutes: number | null;
  actualTimeMinutes: number | null;
  trafficCondition: string | null;
  performanceStatus: string;
}

interface SystemMonitoring {
  backendStatus: string;
  mapsStatus: string;
  notificationStatus: string;
  websocketStatus: string;
  notificationsSent: number;
  notificationsFailed: number;
  notificationSuccessRate: number;
}

interface ReportsSummary {
  status: string;
  message: string;
}

type Role =
  | "CUSTOMER"
  | "BUSINESS_CLIENT"
  | "ADMINISTRATOR";

export default function AnalyticsPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [analytics, setAnalytics] = useState<
    CustomerAnalytics | BusinessAnalytics | AdminAnalytics | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      const userRole = String(user.role || "").toUpperCase() as Role;

      if (
        userRole !== "CUSTOMER" &&
        userRole !== "BUSINESS_CLIENT" &&
        userRole !== "ADMINISTRATOR"
      ) {
        setError("Analytics is not available for this role.");
        setLoading(false);
        return;
      }

      setRole(userRole);

      let endpoint = "";

      if (userRole === "CUSTOMER") {
        endpoint = "http://localhost:8080/api/analytics/customer";
      } else if (userRole === "BUSINESS_CLIENT") {
        endpoint = "http://localhost:8080/api/analytics/business";
      } else if (userRole === "ADMINISTRATOR") {
        endpoint = "http://localhost:8080/api/analytics/admin";
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError("You are not authorized to view this analytics dashboard.");
        } else {
          setError(`Failed to load analytics. Status: ${response.status}`);
        }

        setLoading(false);
        return;
      }

      const data = await response.json();

      setAnalytics(data);
    } catch (err) {
      console.error("Analytics loading error:", err);
      setError("Unable to connect to the analytics service.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString();
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString();
  };

  const getStatusClass = (status: string) => {
    const value = status.toUpperCase();

    if (value === "DELIVERED" || value === "VERIFIED" || value === "UP") {
      return "status success";
    }

    if (
      value === "CANCELLED" ||
      value === "FAILED" ||
      value === "REJECTED" ||
      value === "DOWN"
    ) {
      return "status danger";
    }

    if (
      value === "IN_TRANSIT" ||
      value === "OUT_FOR_DELIVERY" ||
      value === "PENDING" ||
      value === "HEAVY"
    ) {
      return "status warning";
    }

    return "status neutral";
  };

  if (loading) {
    return (
      <>
        <style jsx>{styles}</style>

        <main className="analytics-page">
          <div className="loading-container">
            <div className="spinner" />
            <h2>Loading Analytics...</h2>
            <p>Preparing your dashboard data.</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style jsx>{styles}</style>

        <main className="analytics-page">
          <div className="error-container">
            <div className="error-icon">⚠️</div>

            <h2>Analytics Unavailable</h2>

            <p>{error}</p>

            <button
              className="back-button"
              onClick={() => router.push("/home")}
            >
              ← Back to Home
            </button>
          </div>
        </main>
      </>
    ); 
  }

  if (!analytics || !role) {
    return null;
  }

  return (
    <>
      <style jsx>{styles}</style>

      <main className="analytics-page">

        {/* =============================== */}
        {/* HEADER */}
        {/* =============================== */}

        <header className="analytics-header">

          <div>
            <button
              className="back-button"
              onClick={() => router.push("/home")}
            >
              ← Back to Home
            </button>

            <h1>Analytics Dashboard</h1>

            <p>
              Aggregated shipment and delivery insights
              for your ShipTrack operations.
            </p>
          </div>

          <div className="role-badge">
            {role.replace("_", " ")}
          </div>

        </header>


        {/* =============================== */}
        {/* CUSTOMER */}
        {/* =============================== */}

        {role === "CUSTOMER" && (
          <CustomerDashboard
            data={analytics as CustomerAnalytics}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusClass={getStatusClass}
          />
        )}


        {/* =============================== */}
        {/* BUSINESS CLIENT */}
        {/* =============================== */}

        {role === "BUSINESS_CLIENT" && (
          <BusinessDashboard
            data={analytics as BusinessAnalytics}
            formatDate={formatDate}
            getStatusClass={getStatusClass}
          />
        )}


        {/* =============================== */}
        {/* ADMIN */}
        {/* =============================== */}

        {role === "ADMINISTRATOR" && (
          <AdminDashboard
            data={analytics as AdminAnalytics}
            getStatusClass={getStatusClass}
          />
        )}

      </main>
    </>
  );
}


/* ========================================================= */
/* CUSTOMER DASHBOARD */
/* ========================================================= */

function CustomerDashboard({
  data,
  formatDate,
  formatDateTime,
  getStatusClass,
}: {
  data: CustomerAnalytics;
  formatDate: (value: string | null | undefined) => string;
  formatDateTime: (value: string | null | undefined) => string;
  getStatusClass: (status: string) => string;
}) {
  return (
    <section>

      <div className="section-title">
        <h2>My Shipment Analytics</h2>
        <p>Your personal shipment and tracking overview.</p>
      </div>


      {/* KPI CARDS */}

      <div className="stats-grid">

        <StatCard
          icon="📦"
          title="Total Shipments"
          value={data.totalShipments}
        />

        <StatCard
          icon="🚚"
          title="Active Shipments"
          value={data.activeShipments}
        />

        <StatCard
          icon="✅"
          title="Delivered"
          value={data.deliveredShipments}
        />

        <StatCard
          icon="⏳"
          title="Pending"
          value={data.pendingShipments}
        />

        <StatCard
          icon="⏱️"
          title="Avg Delivery"
          value={`${data.averageDeliveryTimeDays.toFixed(1)} days`}
        />

      </div>


      {/* STATUS BREAKDOWN */}

      <div className="dashboard-section">

        <div className="card">

          <h3>Status Breakdown</h3>

          {Object.keys(data.statusBreakdown).length === 0 ? (
            <div className="empty-state">
              No status data available.
            </div>
          ) : (
            <div className="status-list">

              {Object.entries(data.statusBreakdown).map(
                ([status, count]) => (
                  <div
                    className="status-row"
                    key={status}
                  >

                    <span className={getStatusClass(status)}>
                      {status}
                    </span>

                    <strong>{count}</strong>

                  </div>
                )
              )}

            </div>
          )}

        </div>


        {/* TRACKING SUMMARY */}

        <div className="card">

          <h3>Tracking Insights</h3>

          {data.trackingInsights.length === 0 ? (
            <div className="empty-state">
              No tracking information available.
            </div>
          ) : (
            <div className="tracking-list">

              {data.trackingInsights.map((item) => (
                <div
                  className="tracking-item"
                  key={item.shipmentId}
                >

                  <div>
                    <strong>
                      {item.trackingNumber}
                    </strong>

                    <p>
                      Latest location:{" "}
                      {item.latestLocation || "Not available"}
                    </p>

                    <small>
                      Events: {item.trackingEventCount}
                    </small>
                  </div>

                  <div className="tracking-right">

                    <span
                      className={getStatusClass(
                        item.currentStatus
                      )}
                    >
                      {item.currentStatus}
                    </span>

                    <small>
                      {formatDateTime(
                        item.latestEventTime
                      )}
                    </small>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>


      {/* SHIPMENT HISTORY */}

      <div className="card full-width">

        <h3>Shipment History</h3>

        {data.shipmentHistory.length === 0 ? (
          <div className="empty-state">
            No shipment history available.
          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Tracking Number</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Estimated</th>
                  <th>Delivered</th>
                </tr>
              </thead>

              <tbody>

                {data.shipmentHistory.map(
                  (shipment) => (
                    <tr key={shipment.shipmentId}>

                      <td>
                        <strong>
                          {shipment.trackingNumber}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            shipment.status
                          )}
                        >
                          {shipment.status}
                        </span>
                      </td>

                      <td>{shipment.priority}</td>

                      <td>{shipment.pickupAddress}</td>

                      <td>{shipment.deliveryAddress}</td>

                      <td>
                        {formatDate(
                          shipment.estimatedDeliveryDate
                        )}
                      </td>

                      <td>
                        {formatDate(
                          shipment.actualDeliveryDate
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </section>
  );
}


/* ========================================================= */
/* BUSINESS DASHBOARD */
/* ========================================================= */

function BusinessDashboard({
  data,
  formatDate,
  getStatusClass,
}: {
  data: BusinessAnalytics;
  formatDate: (value: string | null | undefined) => string;
  getStatusClass: (status: string) => string;
}) {
  return (
    <section>

      <div className="section-title">
        <h2>Business Analytics</h2>
        <p>
          Shipment pipeline and delivery performance
          for your business.
        </p>
      </div>


      {/* KPI */}

      <div className="stats-grid">

        <StatCard
          icon="📦"
          title="Total Shipments"
          value={data.totalShipments}
        />

        <StatCard
          icon="🚚"
          title="Active Shipments"
          value={data.activeShipments}
        />

        <StatCard
          icon="✅"
          title="Delivered"
          value={data.deliveredShipments}
        />

        <StatCard
          icon="⚠️"
          title="Delayed"
          value={data.delayedShipments}
        />

        <StatCard
          icon="👥"
          title="Customers"
          value={data.customerCount}
        />

        <StatCard
          icon="📈"
          title="Success Rate"
          value={`${data.deliverySuccessRate.toFixed(1)}%`}
        />

      </div>


      {/* PERFORMANCE */}

      <div className="dashboard-section">

        <div className="card">

          <h3>Delivery Performance</h3>

          <div className="performance-box">

            <div className="performance-number">
              {data.deliverySuccessRate.toFixed(1)}%
            </div>

            <p>Delivery Success Rate</p>

          </div>

          <div className="mini-metrics">

            <div>
              <span>Average Delivery</span>
              <strong>
                {data.averageDeliveryTimeDays.toFixed(1)} days
              </strong>
            </div>

            <div>
              <span>Active</span>
              <strong>{data.activeShipments}</strong>
            </div>

            <div>
              <span>Delayed</span>
              <strong>{data.delayedShipments}</strong>
            </div>

          </div>

        </div>


        {/* STATUS */}

        <div className="card">

          <h3>Shipment Pipeline</h3>

          {Object.entries(data.statusBreakdown).map(
            ([status, count]) => (
              <div
                className="pipeline-row"
                key={status}
              >

                <div>
                  <span
                    className={getStatusClass(status)}
                  >
                    {status}
                  </span>
                </div>

                <strong>{count}</strong>

              </div>
            )
          )}

        </div>

      </div>


      {/* SHIPMENT ANALYTICS */}

      <div className="card full-width">

        <h3>Shipment Analytics</h3>

        {!data.shipmentAnalytics ||
        data.shipmentAnalytics.length === 0 ? (
          <div className="empty-state">
            No business shipment data available.
          </div>
        ) : (
          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Customer</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Delivered</th>
                </tr>
              </thead>

              <tbody>

                {data.shipmentAnalytics.map(
                  (shipment, index) => (
                    <tr
                      key={
                        shipment.shipmentId ||
                        shipment.trackingNumber ||
                        index
                      }
                    >

                      <td>
                        {shipment.trackingNumber || "—"}
                      </td>

                      <td>
                        {shipment.status ? (
                          <span
                            className={getStatusClass(
                              shipment.status
                            )}
                          >
                            {shipment.status}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {shipment.priority || "—"}
                      </td>

                      <td>
                        {shipment.customerName || "—"}
                      </td>

                      <td>
                        {shipment.pickupAddress || "—"}
                      </td>

                      <td>
                        {shipment.deliveryAddress || "—"}
                      </td>

                      <td>
                        {formatDate(
                          shipment.actualDeliveryDate
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* ROUTES */}

      <RouteTable
        routes={data.routePerformance}
        getStatusClass={getStatusClass}
      />

    </section>
  );
}


/* ========================================================= */
/* ADMIN DASHBOARD */
/* ========================================================= */

function AdminDashboard({
  data,
  getStatusClass,
}: {
  data: AdminAnalytics;
  getStatusClass: (status: string) => string;
}) {
  return (
    <section>

      <div className="section-title">
        <h2>Platform Analytics</h2>
        <p>
          Complete ShipTrack platform-wide monitoring
          and operational insights.
        </p>
      </div>


      {/* USERS */}

      <h3 className="group-heading">
        User Overview
      </h3>

      <div className="stats-grid">

        <StatCard
          icon="👥"
          title="Total Users"
          value={data.totalUsers}
        />

        <StatCard
          icon="🙋"
          title="Customers"
          value={data.totalCustomers}
        />

        <StatCard
          icon="🏢"
          title="Business Clients"
          value={data.totalBusinessClients}
        />

        <StatCard
          icon="🚚"
          title="Operators"
          value={data.totalLogisticsOperators}
        />

        <StatCard
          icon="🎧"
          title="Support Agents"
          value={data.totalSupportAgents}
        />

      </div>


      {/* SHIPMENTS */}

      <h3 className="group-heading">
        Shipment Overview
      </h3>

      <div className="stats-grid">

        <StatCard
          icon="📦"
          title="Total Shipments"
          value={data.totalShipments}
        />

        <StatCard
          icon="🚛"
          title="Active Shipments"
          value={data.activeShipments}
        />

        <StatCard
          icon="✅"
          title="Delivered"
          value={data.deliveredShipments}
        />

        <StatCard
          icon="⚠️"
          title="Delayed"
          value={data.delayedShipments}
        />

        <StatCard
          icon="📈"
          title="Success Rate"
          value={`${data.deliverySuccessRate.toFixed(1)}%`}
        />

        <StatCard
          icon="⏱️"
          title="Avg Delivery"
          value={`${data.averageDeliveryTimeDays.toFixed(
            1
          )} days`}
        />

      </div>


      {/* STATUS + SYSTEM */}

      <div className="dashboard-section">

        <div className="card">

          <h3>Shipment Status Breakdown</h3>

          {Object.entries(
            data.shipmentStatusBreakdown
          ).map(([status, count]) => (
            <div
              className="pipeline-row"
              key={status}
            >

              <span
                className={getStatusClass(status)}
              >
                {status}
              </span>

              <strong>{count}</strong>

            </div>
          ))}

        </div>


        <div className="card">

          <h3>System Monitoring</h3>

          <SystemRow
            label="Backend"
            value={data.systemMonitoring.backendStatus}
            getStatusClass={getStatusClass}
          />

          <SystemRow
            label="Maps"
            value={data.systemMonitoring.mapsStatus}
            getStatusClass={getStatusClass}
          />

          <SystemRow
            label="Notifications"
            value={data.systemMonitoring.notificationStatus}
            getStatusClass={getStatusClass}
          />

          <SystemRow
            label="WebSocket"
            value={data.systemMonitoring.websocketStatus}
            getStatusClass={getStatusClass}
          />

          <div className="notification-stats">

            <div>
              <span>Notifications Sent</span>
              <strong>
                {data.systemMonitoring.notificationsSent}
              </strong>
            </div>

            <div>
              <span>Notifications Failed</span>
              <strong>
                {data.systemMonitoring.notificationsFailed}
              </strong>
            </div>

            <div>
              <span>Success Rate</span>
              <strong>
                {data.systemMonitoring.notificationSuccessRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>

          </div>

        </div>

      </div>


      {/* ROUTE PERFORMANCE */}

      <RouteTable
        routes={data.routePerformance}
        getStatusClass={getStatusClass}
      />


      {/* REPORTS */}

      <div className="card full-width">

        <h3>Reports Management</h3>

        <div className="report-box">

          <div className="report-icon">
            📊
          </div>

          <div>
            <strong>
              {data.reports.status}
            </strong>

            <p>
              {data.reports.message}
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}


/* ========================================================= */
/* REUSABLE COMPONENTS */
/* ========================================================= */

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string | number;
}) {
  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <p>{title}</p>

        <h2>{value}</h2>

      </div>

    </div>
  );
}


function SystemRow({
  label,
  value,
  getStatusClass,
}: {
  label: string;
  value: string;
  getStatusClass: (status: string) => string;
}) {
  return (
    <div className="system-row">

      <span>{label}</span>

      <span className={getStatusClass(value)}>
        {value}
      </span>

    </div>
  );
}


function RouteTable({
  routes,
  getStatusClass,
}: {
  routes: RoutePerformance[];
  getStatusClass: (status: string) => string;
}) {
  return (
    <div className="card full-width">

      <h3>Route Performance</h3>

      {!routes || routes.length === 0 ? (
        <div className="empty-state">
          No route performance data available.
        </div>
      ) : (
        <div className="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>Route</th>
                <th>Shipment</th>
                <th>Distance</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Traffic</th>
                <th>Performance</th>
              </tr>
            </thead>

            <tbody>

              {routes.map((route) => (
                <tr key={route.routeId}>

                  <td>
                    <strong>
                      {route.origin}
                    </strong>
                    <br />
                    <span className="route-arrow">
                      ↓
                    </span>
                    <br />
                    {route.destination}
                  </td>

                  <td>
                    #{route.shipmentId}
                  </td>

                  <td>
                    {route.distanceKm !== null
                      ? `${route.distanceKm.toFixed(2)} km`
                      : "—"}
                  </td>

                  <td>
                    {route.estimatedTimeMinutes !== null
                      ? `${route.estimatedTimeMinutes} min`
                      : "—"}
                  </td>

                  <td>
                    {route.actualTimeMinutes !== null
                      ? `${route.actualTimeMinutes} min`
                      : "—"}
                  </td>

                  <td>
                    {route.trafficCondition || "—"}
                  </td>

                  <td>
                    <span
                      className={getStatusClass(
                        route.performanceStatus
                      )}
                    >
                      {route.performanceStatus}
                    </span>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}


/* ========================================================= */
/* STYLES */
/* ========================================================= */

const styles = `
.analytics-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 30px 45px 60px;
  color: #111827;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;
}

.analytics-header h1 {
  margin: 12px 0 6px;
  font-size: 32px;
  font-weight: 800;
}

.analytics-header p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.back-button {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 0;
}

.role-badge {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 700;
}

.section-title {
  margin-bottom: 20px;
}

.section-title h2 {
  margin: 0 0 5px;
  font-size: 23px;
}

.section-title p {
  margin: 0;
  color: #64748b;
}

.group-heading {
  margin: 28px 0 15px;
  font-size: 19px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  flex-shrink: 0;
}

.stat-card p {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 13px;
}

.stat-card h2 {
  margin: 0;
  font-size: 25px;
  font-weight: 800;
}

.dashboard-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
}

.card h3 {
  margin: 0 0 18px;
  font-size: 18px;
}

.full-width {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.status-list,
.tracking-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.status-row,
.pipeline-row,
.system-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid #f1f5f9;
}

.status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.status.success {
  background: #dcfce7;
  color: #166534;
}

.status.danger {
  background: #fee2e2;
  color: #991b1b;
}

.status.warning {
  background: #fef3c7;
  color: #92400e;
}

.status.neutral {
  background: #e2e8f0;
  color: #334155;
}

.tracking-item {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 0;
  border-bottom: 1px solid #f1f5f9;
}

.tracking-item strong {
  font-size: 14px;
}

.tracking-item p {
  margin: 5px 0;
  color: #64748b;
  font-size: 13px;
}

.tracking-item small {
  color: #64748b;
  font-size: 11px;
}

.tracking-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

th {
  text-align: left;
  padding: 12px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

td {
  padding: 13px 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  vertical-align: top;
}

tr:hover td {
  background: #fafafa;
}

.route-arrow {
  color: #94a3b8;
}

.performance-box {
  text-align: center;
  padding: 10px 0 20px;
}

.performance-number {
  font-size: 42px;
  font-weight: 800;
  color: #2563eb;
}

.performance-box p {
  margin: 4px 0 0;
  color: #64748b;
}

.mini-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.mini-metrics div,
.notification-stats div {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
}

.mini-metrics span,
.notification-stats span {
  display: block;
  color: #64748b;
  font-size: 11px;
  margin-bottom: 5px;
}

.mini-metrics strong,
.notification-stats strong {
  font-size: 15px;
}

.system-row {
  padding: 13px 0;
}

.notification-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.report-box {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 10px;
}

.report-icon {
  font-size: 30px;
}

.report-box strong {
  display: block;
  margin-bottom: 4px;
}

.report-box p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.empty-state {
  padding: 25px;
  text-align: center;
  color: #64748b;
  background: #f8fafc;
  border-radius: 10px;
}

.loading-container,
.error-container {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.loading-container h2,
.error-container h2 {
  margin: 15px 0 5px;
}

.loading-container p,
.error-container p {
  color: #64748b;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.error-icon {
  font-size: 42px;
}

.primary-button {
  margin-top: 15px;
  border: none;
  background: #2563eb;
  color: white;
  padding: 11px 18px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 700;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .analytics-page {
    padding: 25px 20px 50px;
  }

  .dashboard-section {
    grid-template-columns: 1fr;
  }

  .analytics-header {
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .mini-metrics,
  .notification-stats {
    grid-template-columns: 1fr;
  }
}
`;