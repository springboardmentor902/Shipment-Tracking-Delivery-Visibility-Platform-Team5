"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";

interface Shipment {
  id: number;
  trackingNumber: string;
  status: string;
  receiverName: string;
  deliveryAddress: string;
}

interface ProofOfDelivery {
  id: number;
  shipmentId: number;
  verifiedBy: number | null;
  signatureUrl: string;
  photoUrl: string;
  deliveredToName: string;
  deliveryNotes: string | null;
  verificationStatus: string;
  deliveredAt: string;
}

export default function CompleteDeliveryPage() {
  const params = useParams();
  const router = useRouter();

  const shipmentId = params.shipmentId as string;

  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [deliveredToName, setDeliveredToName] =
    useState("");

  const [deliveryNotes, setDeliveryNotes] =
    useState("");

  const [signature, setSignature] =
    useState<File | null>(null);

  const [photo, setPhoto] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    loadShipment();
  }, []);

  const loadShipment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/shipments/${shipmentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        alert("Shipment not found");
        router.push("/pod");
        return;
      }

      const data = await response.json();

      setShipment(data);

      if (data.receiverName) {
        setDeliveredToName(data.receiverName);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to load shipment");
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setSignature(file);
  };

  const handlePhotoChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    if (!deliveredToName.trim()) {
      alert("Please enter recipient name");
      return;
    }

    if (!signature) {
      alert("Please upload signature");
      return;
    }

    if (!photo) {
      alert("Please upload delivery photo");
      return;
    }

    const formData = new FormData();

    formData.append(
      "deliveredToName",
      deliveredToName.trim()
    );

    formData.append(
      "deliveryNotes",
      deliveryNotes.trim()
    );

    formData.append("signature", signature);
    formData.append("photo", photo);

    try {
      setSubmitting(true);

      const response = await fetch(
        `http://localhost:8080/api/pod/${shipmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        alert(
          responseText ||
            "Proof of delivery submission failed"
        );
        return;
      }

      let pod: ProofOfDelivery;

      try {
        pod = JSON.parse(responseText);
      } catch {
        alert("Invalid response from server");
        return;
      }

      console.log("POD submitted:", pod);

      setMessage(
        "Proof of Delivery submitted successfully!"
      );

      setTimeout(() => {
        router.push("/home");
      }, 1500);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <p style={styles.loading}>
            Loading shipment...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>

        <button
          type="button"
          onClick={() => router.push("/pod")}
          style={styles.backButton}
        >
          ← Back
        </button>

        <div style={styles.header}>
          <div style={styles.icon}>📦</div>

          <div>
            <h1 style={styles.title}>
              Complete Delivery
            </h1>

            <p style={styles.subtitle}>
              Submit Proof of Delivery
            </p>
          </div>
        </div>

        {shipment && (
          <div style={styles.shipmentBox}>
            <h2 style={styles.sectionTitle}>
              Shipment Information
            </h2>

            <div style={styles.infoGrid}>
              <div>
                <strong style={styles.infoLabel}>Shipment ID</strong>
                <p style={styles.infoValue}>#{shipment.id}</p>
              </div>

              <div>
                <strong style={styles.infoLabel}>Tracking Number</strong>
                <p style={styles.infoValue}>{shipment.trackingNumber}</p>
              </div>

              <div>
                <strong style={styles.infoLabel}>Receiver</strong>
                <p style={styles.infoValue}>{shipment.receiverName}</p>
              </div>

              <div>
                <strong style={styles.infoLabel}>Status</strong>
                <p style={styles.infoValue}>{shipment.status}</p>
              </div>
            </div>

            <div style={styles.address}>
              <strong style={styles.infoLabel}>Delivery Address</strong>
              <p style={styles.infoValue}>{shipment.deliveryAddress}</p>
            </div>
          </div>
        )}

        {message && (
          <div style={styles.success}>
            ✅ {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <h2 style={styles.sectionTitle}>
            Delivery Details
          </h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Delivered To
            </label>

            <input
              type="text"
              value={deliveredToName}
              onChange={(e) =>
                setDeliveredToName(e.target.value)
              }
              placeholder="Enter recipient name"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Delivery Notes
            </label>

            <textarea
              value={deliveryNotes}
              onChange={(e) =>
                setDeliveryNotes(e.target.value)
              }
              placeholder="Enter delivery notes"
              rows={4}
              style={styles.textarea}
            />
          </div>

          <div style={styles.uploadSection}>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Recipient Signature
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleSignatureChange}
                style={styles.fileInput}
                required
              />

              {signature && (
                <p style={styles.fileName}>
                  ✓ {signature.name}
                </p>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Delivery Photo
              </label>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={styles.fileInput}
                required
              />

              {photo && (
                <p style={styles.fileName}>
                  ✓ {photo.name}
                </p>
              )}
            </div>

          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitButton,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting
                ? "not-allowed"
                : "pointer",
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit Proof of Delivery"}
          </button>

        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "40px 20px",
  },

  card: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "40px",
    borderRadius: "20px",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.12)",
    boxSizing: "border-box",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    fontSize: "16px",
    cursor: "pointer",
    padding: "0",
    marginBottom: "25px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "30px",
  },

  icon: {
    fontSize: "45px",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
  },

  shipmentBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "30px",
  },

  sectionTitle: {
    margin: "0 0 20px",
    color: "#111827",
    fontSize: "22px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
  },

  infoLabel: {
    display: "block",
    color: "#1f2937",
    fontSize: "15px",
    fontWeight: 700,
    marginBottom: "7px",
  },

  infoValue: {
    margin: 0,
    color: "#475569",
    fontSize: "16px",
    lineHeight: 1.5,
  },

  address: {
    marginTop: "20px",
  },

  formGroup: {
    marginBottom: "22px",
  },

  label: {
    display: "block",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "16px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "16px",
    resize: "vertical",
  },

  uploadSection: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "10px",
  },

  fileInput: {
    width: "100%",
    padding: "12px",
    border: "1px dashed #94a3b8",
    borderRadius: "10px",
    boxSizing: "border-box",
    background: "#f8fafc",
  },

  fileName: {
    color: "#16a34a",
    fontSize: "14px",
    marginTop: "8px",
  },

  submitButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "17px",
    fontWeight: 600,
    marginTop: "10px",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "25px",
    fontWeight: 600,
  },

  loading: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "18px",
  },
};