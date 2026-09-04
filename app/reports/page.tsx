"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReportType =
  | "shipments"
  | "deliveries"
  | "routes"
  | "delays";

type Format = "pdf" | "excel";

export default function ReportsPage() {
  const router = useRouter();

  const [reportType, setReportType] =
    useState<ReportType>("shipments");

  const [format, setFormat] =
    useState<Format>("pdf");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const getReportName = () => {
    switch (reportType) {
      case "shipments":
        return "Shipment Report";
      case "deliveries":
        return "Delivery Report";
      case "routes":
        return "Route Performance Report";
      case "delays":
        return "Delay Analysis Report";
      default:
        return "Report";
    }
  };

  const getFileName = () => {
    switch (reportType) {
      case "shipments":
        return `shipment-report.${format === "pdf" ? "pdf" : "xlsx"}`;

      case "deliveries":
        return `delivery-report.${format === "pdf" ? "pdf" : "xlsx"}`;

      case "routes":
        return `route-performance-report.${format === "pdf" ? "pdf" : "xlsx"}`;

      case "delays":
        return `delay-analysis-report.${format === "pdf" ? "pdf" : "xlsx"}`;

      default:
        return `shiptrack-report.${format === "pdf" ? "pdf" : "xlsx"}`;
    }
  };

  const downloadReport = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8080/api/reports/${reportType}?format=${format}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You are not authorized to download this report."
          );
        }

        throw new Error(
          `Report download failed (${response.status}).`
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = getFileName();

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(
        `${getReportName()} downloaded successfully.`
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while downloading the report.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reports-page">
      <div className="reports-container">

        <button
          className="back-button"
          onClick={() => router.push("/home")}
        >
          ← Back to Home
        </button>

        <div className="reports-header">
          <div>
            <h1>Reports & Export</h1>

            <p>
              Generate and download shipment, delivery,
              route and delay reports.
            </p>
          </div>
        </div>

        <section className="report-card">

          <div className="section">
            <label htmlFor="reportType">
              Report Type
            </label>

            <select
              id="reportType"
              value={reportType}
              onChange={(event) =>
                setReportType(
                  event.target.value as ReportType
                )
              }
            >
              <option value="shipments">
                Shipment Report
              </option>

              <option value="deliveries">
                Delivery Report
              </option>

              <option value="routes">
                Route Performance Report
              </option>

              <option value="delays">
                Delay Analysis Report
              </option>
            </select>
          </div>

          <div className="section">

            <label>
              Export Format
            </label>

            <div className="format-options">

              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                />

                <span>PDF</span>
              </label>

              <label className="format-option">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === "excel"}
                  onChange={() => setFormat("excel")}
                />

                <span>Excel</span>
              </label>

            </div>
          </div>

          <div className="selected-report">

            <span className="report-icon">
              📊
            </span>

            <div>
              <h2>{getReportName()}</h2>

              <p>
                Format:{" "}
                {format === "pdf"
                  ? "PDF Document"
                  : "Excel Spreadsheet"}
              </p>
            </div>

          </div>

          <button
            className="download-button"
            onClick={downloadReport}
            disabled={loading}
          >
            {loading
              ? "Generating Report..."
              : "⬇ Download Report"}
          </button>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

        </section>

        <section className="report-info">

          <div className="info-card">
            <span>📦</span>
            <h3>Shipment Report</h3>
            <p>
              Shipment details, status and delivery dates.
            </p>
          </div>

          <div className="info-card">
            <span>🚚</span>
            <h3>Delivery Report</h3>
            <p>
              POD status and actual delivery information.
            </p>
          </div>

          <div className="info-card">
            <span>🗺️</span>
            <h3>Route Performance</h3>
            <p>
              Distance, estimated time, actual time and traffic.
            </p>
          </div>

          <div className="info-card">
            <span>⚠️</span>
            <h3>Delay Analysis</h3>
            <p>
              Delayed shipments and delay duration analysis.
            </p>
          </div>

        </section>

      </div>

      <style jsx>{`
        .reports-page {
          min-height: 100vh;
          padding: 40px 24px;
          background: #f5f7fb;
          color: #1f2937;
        }

        .reports-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .back-button {
          border: none;
          background: transparent;
          color: #374151;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          margin-bottom: 24px;
        }

        .back-button:hover {
          color: #111827;
        }

        .reports-header {
          margin-bottom: 28px;
        }

        .reports-header h1 {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .reports-header p {
          margin: 0;
          font-size: 15px;
          color: #6b7280;
        }

        .report-card {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.07);
          margin-bottom: 28px;
        }

        .section {
          margin-bottom: 25px;
        }

        .section > label {
          display: block;
          margin-bottom: 10px;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }

        select {
          width: 100%;
          padding: 13px 15px;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          background: white;
          color: #111827;
          font-size: 15px;
          outline: none;
        }

        select:focus {
          border-color: #6b7280;
        }

        .format-options {
          display: flex;
          gap: 16px;
        }

        .format-option {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          color: #374151;
        }

        .format-option:hover {
          background: #f9fafb;
        }

        .format-option input {
          width: 17px;
          height: 17px;
          cursor: pointer;
        }

        .selected-report {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          margin: 10px 0 24px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
        }

        .report-icon {
          font-size: 32px;
        }

        .selected-report h2 {
          margin: 0 0 5px;
          font-size: 18px;
          color: #111827;
        }

        .selected-report p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .download-button {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 9px;
          background: #111827;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }

        .download-button:hover:not(:disabled) {
          background: #374151;
        }

        .download-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message {
          margin-top: 18px;
          padding: 12px 15px;
          border-radius: 8px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          font-size: 14px;
          font-weight: 600;
        }

        .error-message {
          margin-top: 18px;
          padding: 12px 15px;
          border-radius: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 14px;
          font-weight: 600;
        }

        .report-info {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .info-card {
          background: white;
          padding: 22px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid #eef0f3;
        }

        .info-card span {
          font-size: 27px;
        }

        .info-card h3 {
          margin: 12px 0 7px;
          font-size: 16px;
          color: #111827;
        }

        .info-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #6b7280;
        }

        @media (max-width: 800px) {
          .report-info {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 550px) {
          .reports-page {
            padding: 25px 15px;
          }

          .report-card {
            padding: 20px;
          }

          .reports-header h1 {
            font-size: 26px;
          }

          .format-options {
            flex-direction: column;
          }

          .report-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}