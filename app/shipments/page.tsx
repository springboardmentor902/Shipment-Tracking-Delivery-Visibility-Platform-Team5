"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PackageForm = {
  weight: string;
  dimensions: string;
  quantity: string;
  declaredValue: string;
  fragile: boolean;
  description: string;
};

const createEmptyPackage = (): PackageForm => ({
  weight: "",
  dimensions: "",
  quantity: "1",
  declaredValue: "",
  fragile: false,
  description: "",
});

type Shipment = {
  id: number;
  trackingNumber?: string;
  status?: string;
  origin?: string;
  destination?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  assignedOperatorId?: number | null;
};

export default function ShipmentsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [priority, setPriority] = useState("NORMAL");

  const [packages, setPackages] = useState<PackageForm[]>([
    createEmptyPackage(),
  ]);

  const [successMessage, setSuccessMessage] = useState("");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [updatingShipmentId, setUpdatingShipmentId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});

  const shipmentStatuses = [
    "CREATED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  const loadShipments = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      setLoadingShipments(true);

      const response = await fetch(
        "http://localhost:8080/api/shipments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to load shipments:", await response.text());
        return;
      }

      const data = await response.json();
      const shipmentList: Shipment[] = Array.isArray(data) ? data : [];

      setShipments(shipmentList);

      const initialStatuses: Record<number, string> = {};
      shipmentList.forEach((shipment) => {
        if (shipment.status) {
          initialStatuses[shipment.id] = shipment.status;
        }
      });
      setSelectedStatuses(initialStatuses);
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoadingShipments(false);
    }
  };

  const updateShipmentStatus = async (shipmentId: number) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const newStatus = selectedStatuses[shipmentId];

    if (!newStatus) {
      alert("Please select a shipment status.");
      return;
    }

    try {
      setUpdatingShipmentId(shipmentId);

      const response = await fetch(
        `http://localhost:8080/api/shipments/${shipmentId}/status?status=${encodeURIComponent(newStatus)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        alert(responseText || "Failed to update shipment status.");
        return;
      }

      let updatedShipment: Shipment | null = null;
      try {
        updatedShipment = JSON.parse(responseText);
      } catch {
        // Use selected status when response is not JSON.
      }

      const finalStatus = updatedShipment?.status || newStatus;

      setShipments((current) =>
        current.map((shipment) =>
          shipment.id === shipmentId
            ? { ...shipment, status: finalStatus }
            : shipment
        )
      );

      setSelectedStatuses((current) => ({
        ...current,
        [shipmentId]: finalStatus,
      }));

      alert(`Shipment #${shipmentId} status updated to ${finalStatus}.`);
    } catch (error) {
      console.error("Error updating shipment status:", error);
      alert("Unable to connect to the server.");
    } finally {
      setUpdatingShipmentId(null);
    }
  };

  const canEditStatus = (status?: string) =>
    String(status || "").toUpperCase() !== "DELIVERED";


  const updatePackage = (
    index: number,
    field: keyof PackageForm,
    value: string | boolean
  ) => {
    setPackages((currentPackages) =>
      currentPackages.map((currentPackage, currentIndex) =>
        currentIndex === index
          ? {
              ...currentPackage,
              [field]: value,
            }
          : currentPackage
      )
    );
  };

  const addPackage = () => {
    setPackages((currentPackages) => [
      ...currentPackages,
      createEmptyPackage(),
    ]);
  };

  const removePackage = (index: number) => {
    if (packages.length === 1) {
      return;
    }

    setPackages((currentPackages) =>
      currentPackages.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const resetForm = () => {
    setTrackingNumber("");
    setSenderName("");
    setSenderPhone("");
    setSenderAddress("");
    setReceiverName("");
    setReceiverPhone("");
    setReceiverEmail("");
    setReceiverAddress("");
    setDeliveryAddress("");
    setPriority("NORMAL");
    setPackages([createEmptyPackage()]);
  };

  const handleCreateShipment = async (e: FormEvent) => {
    e.preventDefault();

    setSuccessMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      const shipmentResponse = await fetch(
        "http://localhost:8080/api/shipments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            trackingNumber,
            senderName,
            senderPhone,
            senderAddress,
            pickupAddress: senderAddress,
            receiverName,
            receiverPhone,
            receiverEmail,
            receiverAddress,
            deliveryAddress,
            priority,
          }),
        }
      );

      const shipmentText = await shipmentResponse.text();

      if (!shipmentResponse.ok) {
        alert(shipmentText || "Shipment creation failed");
        return;
      }

      let shipmentData: { id?: number };

      try {
        shipmentData = JSON.parse(shipmentText);
      } catch {
        alert("Invalid shipment response from server");
        return;
      }

      if (!shipmentData.id) {
        alert("Shipment ID was not returned by the server");
        return;
      }

      const packageIds: number[] = [];

      for (let index = 0; index < packages.length; index++) {
        const currentPackage = packages[index];

        const packageResponse = await fetch(
          `http://localhost:8080/api/shipments/${shipmentData.id}/packages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              weight: Number(currentPackage.weight),
              dimensions: currentPackage.dimensions,
              quantity: Number(currentPackage.quantity),
              declaredValue: Number(currentPackage.declaredValue),
              fragile: currentPackage.fragile,
              description: currentPackage.description,
            }),
          }
        );

        const packageText = await packageResponse.text();

        if (!packageResponse.ok) {
          alert(
            `Shipment created, but package ${index + 1} failed.\n${
              packageText || "Package creation failed"
            }`
          );
          return;
        }

        try {
          const packageData = JSON.parse(packageText);

          if (packageData.id) {
            packageIds.push(packageData.id);
          }
        } catch {
          console.log("Package response is not JSON");
        }
      }

      setSuccessMessage(
        `Shipment #${shipmentData.id} and package(s) ${packageIds.join(
          ", "
        )} saved successfully!`
      );

      resetForm();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(
          String(user?.role || user?.userRole || "").toUpperCase()
        );
      } catch (error) {
        console.error("Unable to read logged-in user:", error);
      }
    }

    loadShipments();
  }, []);

  const isAdmin = userRole === "ADMINISTRATOR";
  const isCustomer =
    userRole === "CUSTOMER" || userRole === "BUSINESS_CLIENT";
  const isLogisticsOperator = userRole === "LOGISTICS_OPERATOR";

  const canCreateShipment = isAdmin || isCustomer;
  const canManageShipments = isAdmin;

  return (
    <main className="shipment-container">
      <div className="page-back-row">
        <button
          type="button"
          className="page-back-button"
          onClick={() => router.back()}
        >
          ← Back
        </button>
      </div>

      {canCreateShipment && (
        <div className="shipment-card">
          <h1>Create Shipment</h1>
        <p>Enter shipment, delivery, and package details</p>

        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}

        <form onSubmit={handleCreateShipment}>
          <h2>Shipment Details</h2>

          <div className="form-group">
            <label>Tracking Number</label>
            <input
              type="text"
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <h2>Sender Details</h2>

          <div className="form-group">
            <label>Sender Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Sender Phone</label>
            <input
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Sender Address</label>
            <textarea
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              required
            />
          </div>

          <h2>Receiver Details</h2>

          <div className="form-group">
            <label>Receiver Name</label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Receiver Phone</label>
            <input
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Receiver Email</label>
            <input
              type="email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Receiver Address</label>
            <textarea
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Delivery Address</label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
          </div>

          <h2>Package Details</h2>

          {packages.map((currentPackage, index) => (
            <div className="package-card" key={index}>
              <h3>Package {index + 1}</h3>

              <div className="form-group">
                <label>Weight</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={currentPackage.weight}
                  onChange={(e) =>
                    updatePackage(index, "weight", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Dimensions</label>
                <input
                  type="text"
                  placeholder="30x20x15 cm"
                  value={currentPackage.dimensions}
                  onChange={(e) =>
                    updatePackage(index, "dimensions", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={currentPackage.quantity}
                  onChange={(e) =>
                    updatePackage(index, "quantity", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Declared Value</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentPackage.declaredValue}
                  onChange={(e) =>
                    updatePackage(index, "declaredValue", e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={currentPackage.fragile}
                    onChange={(e) =>
                      updatePackage(index, "fragile", e.target.checked)
                    }
                  />{" "}
                  Fragile package
                </label>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={currentPackage.description}
                  onChange={(e) =>
                    updatePackage(index, "description", e.target.value)
                  }
                  required
                />
              </div>

              {packages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePackage(index)}
                >
                  Remove Package
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addPackage}>
            Add Another Package
          </button>

          <br />
          <br />

          <button type="submit">Create Shipment</button>
          </form>
        </div>
      )}

      {canManageShipments && (
        <div className="shipment-card shipment-management-card">
        <h1>Manage Shipments</h1>
        <p>View existing shipments and update their delivery status.</p>

        {loadingShipments ? (
          <p>Loading shipments...</p>
        ) : shipments.length === 0 ? (
          <p>No shipments found.</p>
        ) : (
          <div className="shipment-list">
            {shipments.map((shipment) => (
              <div className="shipment-management-item" key={shipment.id}>
                <div className="shipment-management-header">
                  <div>
                    <h2>Shipment #{shipment.id}</h2>
                    <p>
                      Tracking: {shipment.trackingNumber || "Not available"}
                    </p>
                  </div>

                  <span className="shipment-status-badge">
                    {shipment.status || "UNKNOWN"}
                  </span>
                </div>

                <div className="shipment-management-details">
                  <p>
                    <strong>From:</strong>{" "}
                    {shipment.origin || shipment.pickupAddress || "N/A"}
                  </p>
                  <p>
                    <strong>To:</strong>{" "}
                    {shipment.destination || shipment.deliveryAddress || "N/A"}
                  </p>
                  <p>
                    <strong>Assigned Operator:</strong>{" "}
                    {shipment.assignedOperatorId ?? "Not assigned"}
                  </p>
                </div>

                <div className="status-update-row">
                  <label>
                    <strong>Update Shipment Status</strong>
                  </label>

                  <div className="status-update-controls">
                    <select
                      value={
                        selectedStatuses[shipment.id] ||
                        shipment.status ||
                        "CREATED"
                      }
                      onChange={(e) =>
                        setSelectedStatuses((current) => ({
                          ...current,
                          [shipment.id]: e.target.value,
                        }))
                      }
                      disabled={!canEditStatus(shipment.status)}
                    >
                      {shipmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => updateShipmentStatus(shipment.id)}
                      disabled={
                        !canEditStatus(shipment.status) ||
                        updatingShipmentId === shipment.id
                      }
                    >
                      {updatingShipmentId === shipment.id
                        ? "Updating..."
                        : "Update Status"}
                    </button>
                  </div>

                  {!canEditStatus(shipment.status) && (
                    <p className="status-locked-message">
                      Delivered shipments cannot be updated.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {!canCreateShipment && !canManageShipments && (
        <div className="shipment-card role-info-card">
          <h1>Shipment Access</h1>
          <p>
            Shipment creation and full shipment management are restricted for
            your role.
          </p>
          {isLogisticsOperator && (
            <p>
              Use <strong>Assigned Shipments</strong> from the dashboard to
              view assigned shipments and update their statuses.
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .page-back-row {
          width: min(900px, 92%);
          margin: 0 auto 20px;
          text-align: left;
        }

        .page-back-button {
          display: inline-flex !important;
          align-items: center;
          justify-content: flex-start;
          width: auto !important;
          min-width: 0 !important;
          height: auto !important;
          margin: 0 !important;
          padding: 4px 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
          color: #2563eb !important;
          box-shadow: none !important;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.5;
          cursor: pointer;
          text-align: left;
        }

        .page-back-button:hover {
          background: transparent !important;
          color: #1d4ed8 !important;
          text-decoration: underline;
        }

        .role-info-card {
          margin-top: 0;
          padding: 32px;
          text-align: center;
        }

        .role-info-card h1 {
          margin: 0 0 10px;
        }

        .role-info-card p {
          margin: 8px 0;
          color: #475569;
        }

        .shipment-management-card {
          margin-top: 24px;
        }

        .shipment-list {
          display: grid;
          gap: 18px;
          margin-top: 20px;
        }

        .shipment-management-item {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: #ffffff;
        }

        .shipment-management-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .shipment-management-header h2 {
          margin: 0 0 6px;
        }

        .shipment-management-header p {
          margin: 0;
        }

        .shipment-status-badge {
          padding: 7px 12px;
          border-radius: 999px;
          background: #e0edff;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 13px;
        }

        .shipment-management-details {
          display: grid;
          gap: 6px;
          margin-bottom: 18px;
        }

        .shipment-management-details p {
          margin: 0;
        }

        .status-update-row {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .status-update-row > label {
          display: block;
          margin-bottom: 10px;
        }

        .status-update-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .status-update-controls select {
          width: 240px;
          min-width: 240px;
          height: 48px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          background: #ffffff;
          cursor: pointer;
        }

        .status-update-controls button {
          flex: 1;
          min-height: 48px;
          padding: 11px 20px;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .status-update-controls button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .status-locked-message {
          margin: 10px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        @media (max-width: 700px) {
          .shipment-management-header,
          .status-update-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .status-update-controls select {
            width: 100%;
            min-width: 100%;
          }
        }
      `}</style>
    </main>
  );
}