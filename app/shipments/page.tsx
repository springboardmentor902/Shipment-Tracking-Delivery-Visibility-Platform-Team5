"use client";

import { FormEvent, useState } from "react";

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

export default function ShipmentsPage() {
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

  return (
    <main className="shipment-container">
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
    </main>
  );
}