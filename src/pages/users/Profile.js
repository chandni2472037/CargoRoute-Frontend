import { useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../../utils/jwtUtils";
import Layout from "../../components/Layout";
import { signoutUser } from "../../api/authApi";
import { AuthContext } from "../../auth/AuthContext";
import "../../styles/Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { logoutUser } = useContext(AuthContext);
  const user = getUserFromToken() || {};
  const [copied, setCopied] = useState("");

  const profile = useMemo(() => {
    const issuedAt = user?.iat ? new Date(user.iat * 1000) : null;
    const expiresAt = user?.exp ? new Date(user.exp * 1000) : null;
    return {
      name: user?.name || "-",
      email: user?.email || "-",
      role: user?.role || "-",
      phone: user?.phone || "-",
      issuedAt,
      expiresAt,
    };
  }, [user]);

  const copyText = async (value, key) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(key);
      setTimeout(() => setCopied(""), 1200);
    } catch {
      setCopied("");
    }
  };

  const exportProfile = () => {
    const headers = ["Name", "Email", "Role", "Phone", "Token Issued At", "Token Expires At"];
    const row = [
      profile.name,
      profile.email,
      profile.role,
      profile.phone,
      profile.issuedAt ? profile.issuedAt.toLocaleString() : "-",
      profile.expiresAt ? profile.expiresAt.toLocaleString() : "-",
    ];
    const csv = [headers, row]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-profile.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignout = async () => {
    try {
      await signoutUser();
    } catch {
      // local signout should still proceed
    } finally {
      logoutUser();
      navigate("/login");
    }
  };

  return (
    <Layout>
      <div className="profile-page">
        <div className="profile-header">
          <div>
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">Manage your account details</p>
          </div>
          <div className="profile-top-actions">
            <button className="profile-btn" onClick={exportProfile}>⬇ Export</button>
            <button className="profile-btn profile-btn-danger" onClick={handleSignout}>Signout</button>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-card profile-card-main">
            <div className="profile-avatar">{String(profile.name).charAt(0).toUpperCase()}</div>
            <div className="profile-main-meta">
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              <span className="profile-role-pill">{profile.role}</span>
            </div>
          </section>

          <section className="profile-card">
            <h3>Account Info</h3>
            <div className="profile-row">
              <span>Email</span>
              <div className="profile-value-wrap">
                <strong>{profile.email}</strong>
                <button className="profile-icon-btn" onClick={() => copyText(profile.email, "email")}>📋</button>
              </div>
            </div>
            <div className="profile-row">
              <span>Phone Number</span>
              <div className="profile-value-wrap">
                <strong>{profile.phone}</strong>
                <button className="profile-icon-btn" onClick={() => copyText(profile.phone, "phone")}>📋</button>
              </div>
            </div>
            <div className="profile-row">
              <span>Token Issued</span>
              <strong>{profile.issuedAt ? profile.issuedAt.toLocaleString() : "-"}</strong>
            </div>
            <div className="profile-row">
              <span>Token Expires</span>
              <strong>{profile.expiresAt ? profile.expiresAt.toLocaleString() : "-"}</strong>
            </div>
            {copied && <div className="profile-copied">Copied {copied} ✓</div>}
          </section>
        </div>
      </div>
    </Layout>
  );
}
