"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type POD = {
  id?: number;
  shipmentId: number;
  deliveredToName?: string;
  deliveryNotes?: string;
  signatureUrl?: string;
  photoUrl?: string;
  verificationStatus?: string;
  deliveredAt?: string;
  verifiedBy?: number;
};

export default function PODVerificationPage() {
  const router = useRouter();

  const [pods, setPods] = useState<POD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPod, setSelectedPod] = useState<POD | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingPODs();
  }, []);

  const loadPendingPODs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:8080/api/pod/verification/pending",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        setError(
          text || "Unable to load pending proofs"
        );
        return;
      }

      const data = text ? JSON.parse(text) : [];

      setPods(data);
    } catch (error) {
      console.error(error);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const verifyPOD = async () => {
    if (!selectedPod) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to APPROVE proof of delivery for Shipment #${selectedPod.shipmentId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/pod/${selectedPod.shipmentId}/verify`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        alert(
          text || "Unable to approve proof of delivery"
        );
        return;
      }

      alert(
        "Proof of delivery approved successfully."
      );

      setSelectedPod(null);

      await loadPendingPODs();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPOD = async () => {
    if (!selectedPod) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to REJECT proof of delivery for Shipment #${selectedPod.shipmentId}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/pod/${selectedPod.shipmentId}/reject`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        alert(
          text || "Unable to reject proof of delivery"
        );
        return;
      }

      alert(
        "Proof of delivery rejected successfully."
      );

      setSelectedPod(null);

      await loadPendingPODs();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setActionLoading(false);
    }
  };

  const getFileUrl = (url?: string) => {
    if (!url) {
      return "";
    }

    if (url.startsWith("http")) {
      return url;
    }

    if (url.startsWith("/")) {
      return `http://localhost:8080${url}`;
    }

    return `http://localhost:8080/${url}`;
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.loadingTitle}>
            Loading Verification Queue...
          </h2>

          <p style={styles.subtitle}>
            Please wait while pending proofs are loaded.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Proof of Delivery Verification
            </h1>

            <p style={styles.subtitle}>
              Review and verify pending delivery proofs.
            </p>
          </div>

          <button
            onClick={() => router.push("/home")}
            style={styles.backButton}
          >
            Back to Home
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {!error && pods.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              ✓
            </div>

            <h2>No Pending Proofs</h2>

            <p>
              There are currently no proof of delivery
              submissions waiting for verification.
            </p>

            <button
              onClick={loadPendingPODs}
              style={styles.refreshButton}
            >
              Refresh
            </button>
          </div>
        )}

        {pods.length > 0 && (
          <div style={styles.queue}>

            <div style={styles.queueHeader}>
              <strong>
                Pending Verification
              </strong>

              <span style={styles.countBadge}>
                {pods.length}
              </span>
            </div>

            {pods.map((pod) => (
              <div
                key={pod.id ?? pod.shipmentId}
                style={styles.podCard}
              >
                <div style={styles.podInfo}>

                  <div style={styles.shipmentNumber}>
                    Shipment #{pod.shipmentId}
                  </div>

                  <div style={styles.detail}>
                    <span style={styles.label}>
                      Delivered To
                    </span>

                    <span>
                      {pod.deliveredToName || "N/A"}
                    </span>
                  </div>

                  <div style={styles.detail}>
                    <span style={styles.label}>
                      Delivered At
                    </span>

                    <span>
                      {pod.deliveredAt
                        ? new Date(
                            pod.deliveredAt
                          ).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>

                  <div style={styles.status}>
                    {pod.verificationStatus || "PENDING"}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPod(pod)}
                  style={styles.viewButton}
                >
                  Review Proof
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {selectedPod && (
        <div style={styles.overlay}>
          <div style={styles.modal}>

            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  Shipment #{selectedPod.shipmentId}
                </h2>

                <p style={styles.modalSubtitle}>
                  Proof of Delivery Details
                </p>
              </div>

              <button
                onClick={() => setSelectedPod(null)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.recipientBox}>
              <span style={styles.modalLabel}>
                Delivered To
              </span>

              <strong style={styles.modalValue}>
                {selectedPod.deliveredToName || "N/A"}
              </strong>

              <span style={styles.modalLabel}>
                Delivered At
              </span>

              <span style={styles.modalValue}>
                {selectedPod.deliveredAt
                  ? new Date(
                      selectedPod.deliveredAt
                    ).toLocaleString()
                  : "N/A"}
              </span>

              {selectedPod.deliveryNotes && (
                <>
                  <span style={styles.modalLabel}>
                    Delivery Notes
                  </span>

                  <span style={styles.modalValue}>
                    {selectedPod.deliveryNotes}
                  </span>
                </>
              )}
            </div>

            <div style={styles.mediaGrid}>

              <div style={styles.mediaCard}>
                <h3>
                  Recipient Signature
                </h3>

                {selectedPod.signatureUrl ? (
                  <img
                    src={getFileUrl(
                      selectedPod.signatureUrl
                    )}
                    alt="Recipient signature"
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.noImage}>
                    Signature not available
                  </div>
                )}
              </div>

              <div style={styles.mediaCard}>
                <h3>
                  Delivery Photo
                </h3>

                {selectedPod.photoUrl ? (
                  <img
                    src={getFileUrl(
                      selectedPod.photoUrl
                    )}
                    alt="Delivery proof"
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.noImage}>
                    Delivery photo not available
                  </div>
                )}
              </div>

            </div>

            <div style={styles.actions}>

              <button
                onClick={rejectPOD}
                disabled={actionLoading}
                style={styles.rejectButton}
              >
                {actionLoading
                  ? "Processing..."
                  : "Reject"}
              </button>

              <button
                onClick={verifyPOD}
                disabled={actionLoading}
                style={styles.approveButton}
              >
                {actionLoading
                  ? "Processing..."
                  : "Approve"}
              </button>

            </div>

          </div>
        </div>
      )}
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
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "1050px",
    margin: "0 auto",
  },

  card: {
    maxWidth: "550px",
    margin: "100px auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.12)",
    textAlign: "center",
  },

  loadingTitle: {
    color: "#111827",
    marginBottom: "10px",
  },

  header: {
    background: "#ffffff",
    padding: "28px 32px",
    borderRadius: "18px",
    boxShadow:
      "0 8px 25px rgba(15, 23, 42, 0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
  },

  subtitle: {
    marginTop: "8px",
    color: "#64748b",
  },

  backButton: {
    padding: "11px 18px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#1f2937",
    cursor: "pointer",
    fontWeight: 600,
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "15px 18px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  empty: {
    background: "#ffffff",
    padding: "70px 30px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow:
      "0 8px 25px rgba(15, 23, 42, 0.08)",
    color: "#475569",
  },

  emptyIcon: {
    width: "60px",
    height: "60px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#15803d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: 700,
  },

  refreshButton: {
    marginTop: "15px",
    padding: "12px 22px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },

  queue: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "25px",
    boxShadow:
      "0 8px 25px rgba(15, 23, 42, 0.08)",
  },

  queueHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    fontSize: "18px",
    color: "#111827",
  },

  countBadge: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "13px",
    fontWeight: 700,
  },

  podCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "15px",
  },

  podInfo: {
    flex: 1,
  },

  shipmentNumber: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "12px",
  },

  detail: {
    display: "flex",
    gap: "10px",
    marginBottom: "7px",
    color: "#475569",
  },

  label: {
    color: "#64748b",
    minWidth: "100px",
  },

  status: {
    display: "inline-block",
    marginTop: "8px",
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: 700,
  },

  viewButton: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "950px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "30px",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: 0,
    color: "#111827",
  },

  modalSubtitle: {
    marginTop: "6px",
    color: "#64748b",
  },

  closeButton: {
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "24px",
    cursor: "pointer",
  },

  recipientBox: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: "10px",
    padding: "18px",
    background: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "25px",
  },

  modalLabel: {
    color: "#334155",
    fontWeight: 700,
    fontSize: "15px",
  },

  modalValue: {
    color: "#111827",
    fontWeight: 600,
    fontSize: "15px",
  },

  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  mediaCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
  },

  image: {
    width: "100%",
    height: "300px",
    objectFit: "contain",
    background: "#f8fafc",
    borderRadius: "10px",
    marginTop: "10px",
  },

  noImage: {
    height: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    color: "#64748b",
    borderRadius: "10px",
    marginTop: "10px",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "25px",
  },

  rejectButton: {
    padding: "13px 28px",
    border: "1px solid #dc2626",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 700,
  },

  approveButton: {
    padding: "13px 28px",
    border: "none",
    borderRadius: "9px",
    background: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 700,
  },
};