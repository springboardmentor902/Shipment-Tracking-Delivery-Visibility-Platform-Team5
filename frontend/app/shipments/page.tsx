"use client";

import { useEffect, useState } from "react";

type PackageForm = {
  packageDescription: string;
  weight: string;
  dimensions: string;
  quantity: string;
  declaredValue: string;
  fragile: boolean;
};

type Shipment = {
  id: number;
  trackingNumber: string;

  senderName: string;
  senderPhone: string;
  senderAddress: string;

  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  receiverAddress: string;

  pickupAddress: string;
  deliveryAddress: string;

  status: string;
  priority: string;

  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;

  cancellationReason?: string;

  packages?: any[];

  createdAt?: string;
  updatedAt?: string;
};

export default function ShipmentsPage() {
  // =========================================================
  // UI STATE
  // =========================================================

  // IMPORTANT:
  // false means the form is hidden when page opens
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // SHIPMENTS
  // =========================================================

  const [shipments, setShipments] = useState<Shipment[]>([]);

  // =========================================================
  // FORM
  // =========================================================

  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",

    receiverName: "",
    receiverPhone: "",
    receiverEmail: "",
    receiverAddress: "",

    pickupAddress: "",
    deliveryAddress: "",

    priority: "STANDARD",
  });

  // Package details
  const [packageForm, setPackageForm] = useState<PackageForm>({
    packageDescription: "",
    weight: "",
    dimensions: "",
    quantity: "",
    declaredValue: "",
    fragile: false,
  });

  // =========================================================
  // GET TOKEN
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt")
    );
  };

  // =========================================================
  // FETCH ALL SHIPMENTS
  // =========================================================

  const fetchShipments = async () => {
    try {
      setShipmentsLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        "http://localhost:8080/api/shipments",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log("Fetched shipments:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to fetch shipments: ${response.status}`
        );
      }

      // Handle all common backend response formats
      let shipmentList: Shipment[] = [];

      if (Array.isArray(data)) {
        // Backend returns: [ ... ]
        shipmentList = data;
      } else if (Array.isArray(data.data)) {
        // Backend returns: { data: [ ... ] }
        shipmentList = data.data;
      } else if (Array.isArray(data.shipments)) {
        // Backend returns: { shipments: [ ... ] }
        shipmentList = data.shipments;
      } else if (Array.isArray(data.content)) {
        // Backend returns paginated data: { content: [ ... ] }
        shipmentList = data.content;
      }

      console.log("Shipment list used by UI:", shipmentList);
      setShipments(shipmentList);
    } catch (err) {
      console.error("Fetch shipments error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch shipments"
      );
    } finally {
      setShipmentsLoading(false);
    }
  };

  // =========================================================
  // LOAD SHIPMENTS WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    fetchShipments();
  }, []);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // PACKAGE FORM CHANGE
  // =========================================================

  const handlePackageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setPackageForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setForm({
      senderName: "",
      senderPhone: "",
      senderAddress: "",

      receiverName: "",
      receiverPhone: "",
      receiverEmail: "",
      receiverAddress: "",

      pickupAddress: "",
      deliveryAddress: "",

      priority: "STANDARD",
    });

    setPackageForm({
      packageDescription: "",
      weight: "",
      dimensions: "",
      quantity: "",
      declaredValue: "",
      fragile: false,
    });
  };

  // =========================================================
  // CREATE SHIPMENT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      // =====================================================
      // DATA SENT TO SPRING BOOT
      // =====================================================

      const shipmentData = {
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        senderAddress: form.senderAddress,

        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        receiverEmail: form.receiverEmail,
        receiverAddress: form.receiverAddress,

        pickupAddress: form.pickupAddress,
        deliveryAddress: form.deliveryAddress,

        priority: form.priority,

        packages: [
          {
            packageDescription:
              packageForm.packageDescription,

            weight: Number(packageForm.weight),

            dimensions:
              packageForm.dimensions,

            quantity:
              Number(packageForm.quantity),

            declaredValue:
              Number(packageForm.declaredValue),

            fragile:
              packageForm.fragile,
          },
        ],
      };

      console.log(
        "Creating shipment:",
        shipmentData
      );

      // =====================================================
      // POST
      // =====================================================

      const response = await fetch(
        "http://localhost:8080/api/shipments",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(shipmentData),
        }
      );

      const data = await response.json();

      console.log(
        "Create shipment response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Request failed with status ${response.status}`
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setMessage(
        `Shipment created successfully! Tracking Number: ${
          data.trackingNumber || "Generated"
        }`
      );

      // Hide form after successful creation
      setShowForm(false);

      // Clear form
      resetForm();

      // Refresh shipment list
      await fetchShipments();

    } catch (err) {
      console.error(
        "Create shipment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create shipment"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UPDATE SHIPMENT STATUS
  // =========================================================

  const updateShipmentStatus = async (
    id: number,
    status: string
  ) => {
    try {
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        `http://localhost:8080/api/shipments/${id}/status?status=${encodeURIComponent(
          status
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to update status: ${response.status}`
        );
      }

      setMessage(
        "Shipment status updated successfully!"
      );

      // Refresh list
      await fetchShipments();

    } catch (err) {
      console.error(
        "Update status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update shipment status"
      );
    }
  };

  // =========================================================
  // DELETE / CANCEL SHIPMENT
  // =========================================================

  const cancelShipment = async (
    id: number,
    trackingNumber: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel shipment ${trackingNumber}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Login token not found. Please login again."
        );
      }

      const response = await fetch(
        `http://localhost:8080/api/shipments/${id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let data: any = {};

        try {
          data = await response.json();
        } catch {
          // Response may have no body
        }

        throw new Error(
          data.message ||
            `Failed to cancel shipment: ${response.status}`
        );
      }

      setMessage(
        "Shipment cancelled successfully!"
      );

      // Refresh list
      await fetchShipments();

    } catch (err) {
      console.error(
        "Cancel shipment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel shipment"
      );
    }
  };

  // =========================================================
  // COUNTERS
  // =========================================================

  const totalShipments =
    shipments.length;

  const inTransit =
    shipments.filter(
      (shipment) =>
        shipment.status === "IN_TRANSIT"
    ).length;

  const delivered =
    shipments.filter(
      (shipment) =>
        shipment.status === "DELIVERED"
    ).length;

  const cancelled =
    shipments.filter(
      (shipment) =>
        shipment.status === "CANCELLED"
    ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Shipments
            </h1>

            <p className="text-slate-500 mt-1">
              Manage and track your shipments
            </p>
          </div>

          {/* CREATE SHIPMENT BUTTON */}

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setMessage("");
              setError("");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            + Create Shipment
          </button>

        </div>


        {/* ===================================================
            SUCCESS MESSAGE
        =================================================== */}

        {message && (
          <div className="bg-green-100 text-green-800 p-4 rounded-xl mb-6">
            {message}
          </div>
        )}


        {/* ===================================================
            ERROR MESSAGE
        =================================================== */}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}


        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

          {/* TOTAL */}

          <div className="bg-white rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Shipments
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {totalShipments}
            </h2>

          </div>


          {/* IN TRANSIT */}

          <div className="bg-white rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              In Transit
            </p>

            <h2 className="text-3xl font-bold text-blue-600 mt-2">
              {inTransit}
            </h2>

          </div>


          {/* DELIVERED */}

          <div className="bg-white rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Delivered
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {delivered}
            </h2>

          </div>


          {/* CANCELLED */}

          <div className="bg-white rounded-2xl p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Cancelled
            </p>

            <h2 className="text-3xl font-bold text-red-600 mt-2">
              {cancelled}
            </h2>

          </div>

        </div>


        {/* ===================================================
            CREATE SHIPMENT FORM

            ONLY APPEARS AFTER CLICKING CREATE SHIPMENT
        =================================================== */}

        {showForm && (

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          >

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-bold">
                Create New Shipment
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                  setMessage("");
                }}
                className="text-slate-500 hover:text-red-600 font-semibold"
              >
                ✕ Close
              </button>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* SENDER NAME */}

              <input
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                type="text"
                placeholder="Sender Name"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* SENDER PHONE */}

              <input
                name="senderPhone"
                value={form.senderPhone}
                onChange={handleChange}
                type="text"
                placeholder="Sender Phone"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* SENDER ADDRESS */}

              <input
                name="senderAddress"
                value={form.senderAddress}
                onChange={handleChange}
                type="text"
                placeholder="Sender Address"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* RECEIVER NAME */}

              <input
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                type="text"
                placeholder="Receiver Name"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* RECEIVER PHONE */}

              <input
                name="receiverPhone"
                value={form.receiverPhone}
                onChange={handleChange}
                type="text"
                placeholder="Receiver Phone"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* RECEIVER EMAIL */}

              <input
                name="receiverEmail"
                value={form.receiverEmail}
                onChange={handleChange}
                type="email"
                placeholder="Receiver Email"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* RECEIVER ADDRESS */}

              <input
                name="receiverAddress"
                value={form.receiverAddress}
                onChange={handleChange}
                type="text"
                placeholder="Receiver Address"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* PICKUP ADDRESS */}

              <input
                name="pickupAddress"
                value={form.pickupAddress}
                onChange={handleChange}
                type="text"
                placeholder="Pickup Address"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* DELIVERY ADDRESS */}

              <input
                name="deliveryAddress"
                value={form.deliveryAddress}
                onChange={handleChange}
                type="text"
                placeholder="Delivery Address"
                required
                className="border rounded-xl px-4 py-3"
              />


              {/* PRIORITY */}

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="border rounded-xl px-4 py-3"
              >
                <option value="STANDARD">
                  Standard
                </option>

                <option value="HIGH">
                  High
                </option>

                <option value="EXPRESS">
                  Express
                </option>
              </select>

            </div>


            {/* =================================================
                PACKAGE SECTION
            ================================================= */}

            <div className="mt-8">

              <h3 className="text-lg font-semibold mb-4">
                Package Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* DESCRIPTION */}

                <input
                  name="packageDescription"
                  value={
                    packageForm.packageDescription
                  }
                  onChange={
                    handlePackageChange
                  }
                  type="text"
                  placeholder="Package Description"
                  required
                  className="border rounded-xl px-4 py-3"
                />


                {/* WEIGHT */}

                <input
                  name="weight"
                  value={packageForm.weight}
                  onChange={
                    handlePackageChange
                  }
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Weight (kg)"
                  required
                  className="border rounded-xl px-4 py-3"
                />


                {/* DIMENSIONS */}

                <input
                  name="dimensions"
                  value={packageForm.dimensions}
                  onChange={
                    handlePackageChange
                  }
                  type="text"
                  placeholder="Dimensions (e.g. 30x20x10 cm)"
                  required
                  className="border rounded-xl px-4 py-3"
                />


                {/* QUANTITY */}

                <input
                  name="quantity"
                  value={packageForm.quantity}
                  onChange={
                    handlePackageChange
                  }
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  required
                  className="border rounded-xl px-4 py-3"
                />


                {/* DECLARED VALUE */}

                <input
                  name="declaredValue"
                  value={
                    packageForm.declaredValue
                  }
                  onChange={
                    handlePackageChange
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Declared Value"
                  required
                  className="border rounded-xl px-4 py-3"
                />

              </div>


              {/* FRAGILE */}

              <label className="flex items-center gap-3 mt-5">

                <input
                  type="checkbox"
                  checked={packageForm.fragile}
                  onChange={(e) =>
                    setPackageForm((prev) => ({
                      ...prev,
                      fragile:
                        e.target.checked,
                    }))
                  }
                />

                <span>
                  Fragile package
                </span>

              </label>

            </div>


            {/* =================================================
                FORM BUTTONS
            ================================================= */}

            <div className="flex gap-3 mt-6">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setError("");
                }}
                className="px-5 py-3 border rounded-xl font-semibold"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create Shipment"}
              </button>

            </div>

          </form>

        )}


        {/* ===================================================
            RECENT SHIPMENTS
        =================================================== */}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-xl font-bold">
              Recent Shipments
            </h2>

          </div>


          {/* LOADING */}

          {shipmentsLoading ? (

            <div className="p-10 text-center text-slate-500">
              Loading shipments...
            </div>

          ) : shipments.length === 0 ? (

            /* NO SHIPMENTS */

            <div className="p-10 text-center text-slate-500">
              No shipments to display yet.
            </div>

          ) : (

            /* SHIPMENT LIST */

            <div className="divide-y">

              {shipments.map(
                (shipment) => (

                  <div
                    key={shipment.id}
                    className="p-6"
                  >

                    {/* TOP */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                      <div>

                        <p className="text-lg font-bold">
                          {shipment.trackingNumber}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {shipment.senderName}
                          {" → "}
                          {shipment.receiverName}
                        </p>

                      </div>


                      {/* STATUS */}

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          shipment.status ===
                          "DELIVERED"
                            ? "bg-green-100 text-green-700"
                            : shipment.status ===
                              "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : shipment.status ===
                              "IN_TRANSIT"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {shipment.status}
                      </span>

                    </div>


                    {/* DETAILS */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 text-sm">

                      <p>
                        <strong>
                          Pickup:
                        </strong>{" "}
                        {shipment.pickupAddress}
                      </p>

                      <p>
                        <strong>
                          Delivery:
                        </strong>{" "}
                        {shipment.deliveryAddress}
                      </p>

                      <p>
                        <strong>
                          Priority:
                        </strong>{" "}
                        {shipment.priority}
                      </p>

                      <p>
                        <strong>
                          Receiver Email:
                        </strong>{" "}
                        {shipment.receiverEmail}
                      </p>

                    </div>


                    {/* =================================================
                        OPERATIONS
                    ================================================= */}

                    <div className="flex flex-col md:flex-row gap-3 mt-5">

                      {/* UPDATE STATUS */}

                      <select
                        value={shipment.status}
                        onChange={(e) =>
                          updateShipmentStatus(
                            shipment.id,
                            e.target.value
                          )
                        }
                        disabled={
                          shipment.status ===
                          "CANCELLED"
                        }
                        className="border rounded-xl px-4 py-2"
                      >

                        <option value="CREATED">
                          Created
                        </option>

                        <option value="PICKED_UP">
                          Picked Up
                        </option>

                        <option value="IN_TRANSIT">
                          In Transit
                        </option>

                        <option value="OUT_FOR_DELIVERY">
                          Out for Delivery
                        </option>

                        <option value="DELIVERED">
                          Delivered
                        </option>

                        <option value="FAILED_DELIVERY">
                          Failed Delivery
                        </option>

                        <option value="CANCELLED">
                          Cancelled
                        </option>

                      </select>


                      {/* CANCEL / DELETE */}

                      {shipment.status !==
                        "CANCELLED" && (

                        <button
                          type="button"
                          onClick={() =>
                            cancelShipment(
                              shipment.id,
                              shipment.trackingNumber
                            )
                          }
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                        >
                          Cancel Shipment
                        </button>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}