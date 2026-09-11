"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      className="landing-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #f8fbff 0%, #eef5ff 50%, #f8fbff 100%)",
        color: "#111827",
      }}
    >
      {/* ========================= */}
      {/* NAVIGATION */}
      {/* ========================= */}

      <nav
        className="landing-nav"
        style={{
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 7%",
          background: "rgba(255, 255, 255, 0.96)",
          borderBottom: "1px solid #e5e7eb",
          boxShadow:
            "0 2px 10px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          className="brand"
          style={{
            fontSize: "26px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            color: "#2563eb",
          }}
        >
          ShipTrack
        </div>

        <div
          className="nav-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              background: "#ffffff",
              color: "#2563eb",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            style={{
              padding: "10px 22px",
              borderRadius: "8px",
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Register
          </button>
        </div>
      </nav>

      {/* ========================= */}
      {/* HERO SECTION */}
      {/* ========================= */}

      <section
        className="hero-section"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background elements */}

        <div
          style={{
            position: "absolute",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "rgba(37, 99, 235, 0.06)",
            top: "-180px",
            left: "-120px",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background:
              "rgba(59, 130, 246, 0.05)",
            bottom: "-170px",
            right: "-100px",
          }}
        />

        <div
          className="hero-content"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "900px",
            textAlign: "center",
            padding: "55px 40px",
            borderRadius: "24px",
            background:
              "rgba(255, 255, 255, 0.82)",
            border:
              "1px solid rgba(226, 232, 240, 0.9)",
            boxShadow:
              "0 20px 60px rgba(15, 23, 42, 0.08)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Badge */}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              color: "#2563eb",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "22px",
            }}
          >
            <span>🚚</span>
            Shipment Tracking & Delivery Visibility
          </div>

          {/* Main Heading */}

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(42px, 6vw, 68px)",
              lineHeight: "1.08",
              fontWeight: 800,
              letterSpacing: "-2px",
              color: "#111827",
            }}
          >
            ShipTrack
          </h1>

          <h2
            style={{
              margin: "10px 0 24px",
              fontSize: "clamp(25px, 4vw, 40px)",
              lineHeight: "1.2",
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: "-1px",
            }}
          >
            Smart Shipment Management
          </h2>

          {/* Description */}

          <p
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              fontSize: "17px",
              lineHeight: "1.7",
              color: "#475569",
            }}
          >
            ShipTrack enables secure shipment management,
            delivery visibility and real-time tracking.
            <br />
            Access features based on your role and manage
            shipments efficiently.
          </p>

          {/* CTA Buttons */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "14px",
              marginTop: "34px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/login")}
              style={{
                minWidth: "130px",
                padding: "13px 28px",
                borderRadius: "9px",
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  "0 8px 18px rgba(37, 99, 235, 0.2)",
              }}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => router.push("/register")}
              style={{
                minWidth: "130px",
                padding: "13px 28px",
                borderRadius: "9px",
                border: "1px solid #2563eb",
                background: "#ffffff",
                color: "#2563eb",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Register
            </button>
          </div>

          {/* Small role-based note */}

          <div
            style={{
              marginTop: "28px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Secure role-based access for customers and
            delivery teams
          </div>
        </div>
      </section>

      {/* ========================= */}
      {/* FOOTER */}
      {/* ========================= */}

      <footer
        style={{
          padding: "18px 24px",
          textAlign: "center",
          fontSize: "12px",
          color: "#64748b",
          background: "rgba(255, 255, 255, 0.75)",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        © {new Date().getFullYear()} ShipTrack ·
        Shipment Tracking & Delivery Visibility Platform
      </footer>
    </main>
  );
}