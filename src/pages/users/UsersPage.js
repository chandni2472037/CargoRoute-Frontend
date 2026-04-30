import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import axios from "axios";
import { ROLES } from "../../constants/roles";
import "../../styles/Users.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const [openActionsUserId, setOpenActionsUserId] = useState(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Dispatcher",
    password: "",
    confirmPassword: "",
    status: "ACTIVE"
  });
  const [formErrors, setFormErrors] = useState({});

  const validateNewUser = () => {
    const e = {};
    if (!newUser.name.trim()) e.name = "Name is required";
    if (/\s{2,}/.test(newUser.name)) e.name = "Avoid consecutive spaces";
    if (!newUser.email.trim()) e.email = "Email is required";
    if (newUser.email.length > 100) e.email = "Email is too long";
    if (!/^\S+@\S+\.\S+$/.test(newUser.email)) e.email = "Enter a valid email";
    if (!newUser.phone.trim()) e.phone = "Phone is required";
    if (!/^[0-9]{10}$/.test(newUser.phone)) e.phone = "Phone must be 10 digits";
    if (/^(\d)\1+$/.test(newUser.phone)) e.phone = "Phone cannot be all same digits";
    if (!newUser.password) e.password = "Password is required";
    if (newUser.password.length < 8) e.password = "Minimum 8 characters";
    if (/\s/.test(newUser.password)) e.password = "Password cannot contain spaces";
    if (!/[A-Z]/.test(newUser.password) || !/[a-z]/.test(newUser.password) || !/[0-9]/.test(newUser.password) || !/[^A-Za-z0-9]/.test(newUser.password)) {
      e.password = "Use upper, lower, number and special character";
    }
    if (!newUser.confirmPassword) e.confirmPassword = "Confirm password is required";
    if (newUser.password !== newUser.confirmPassword) e.confirmPassword = "Passwords do not match";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validateNewUser()) return;
    setError("");
    try {
      await axios.post("http://localhost:8089/cargoRoute/auth/signup", newUser, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      setShowCreate(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "Dispatcher",
        password: "",
        confirmPassword: "",
        status: "ACTIVE"
      });
      setFormErrors({});
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create user.");
    }
  };

  const loadUsers = async () => {
    const res = await axios.get("http://localhost:8089/cargoRoute/user/getAllUsers", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
      setUsers(res.data);
    };
    useEffect(() => {
      loadUsers();
    }, []);

  const handleSave = async () => {
    await axios.put(
      `http://localhost:8089/cargoRoute/user/${selectedUser.userID}`,
      { role: selectedUser.role, status: selectedUser.status },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    setSelectedUser(null);
    loadUsers();
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.role || "").toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);


  return (
    <Layout>
      <div className="users-header">
  <div>
    <h2>User Management & Access Control</h2>
    <p>Manage users, roles, and access</p>
  </div>

  <div className="users-actions">
    <input
      type="text"
      placeholder="Search users by name, email, or role..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />

    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
      <option value="ALL">All Roles</option>
      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>

    <button className="primary btn-create-user" title="Create User" onClick={() => setShowCreate(true)}>
      +
    </button>
  </div>
</div>

      {error && <div className="users-banner users-banner-error">⚠ {error}</div>}


      <table className="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map(u => (
            <tr key={u.userID}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`role-badge role-${u.role}`}>
                  {u.role}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${String(u.status || "").toLowerCase()}`}>
                  {u.status || "N/A"}
                </span>
              </td>
              <td>{u.phone}</td>
              <td>
                <div className="actions-menu-wrap">
                  <button className="actions-trigger" onClick={() => setOpenActionsUserId((prev) => prev === u.userID ? null : u.userID)}>⋯</button>
                  {openActionsUserId === u.userID && (
                    <div className="actions-menu">
                      <button onClick={() => { setSelectedUser(u); setOpenActionsUserId(null); }}>Edit</button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>



        {/* ✅ EDIT USER MODAL — PUT IT HERE */}
        {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-edit">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            <label>Email</label>
            <input value={selectedUser.email} disabled />

            <label>Role</label>
            <select
              value={selectedUser.role}
              onChange={e =>
                setSelectedUser({ ...selectedUser, role: e.target.value })
              }
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <label>Status</label>
            <select
              value={selectedUser.status}
              onChange={e =>
                setSelectedUser({ ...selectedUser, status: e.target.value })
              }
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="modal-actions">
              
              <button className="primary" onClick={handleSave}>
                Save
              </button>
            </div>

          </div>
        </div>
      )}




      {showCreate && (
  <div className="modal-backdrop">
    <div className="modal-card modal-card-create">
      <div className="modal-header">
        <h3>Create New User</h3>
        <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <label>Name</label>
          <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
          <small className="field-error">{formErrors.name || " "}</small>
        </div>

        <div className="form-field">
          <label>Email</label>
          <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          <small className="field-error">{formErrors.email || " "}</small>
        </div>

        <div className="form-field">
          <label>Phone</label>
          <input value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
          <small className="field-error">{formErrors.phone || " "}</small>
        </div>

        <div className="form-field">
          <label>Role</label>
          <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <small className="field-error"> </small>
        </div>

        <div className="form-field">
          <label>Password</label>
          <input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          <small className="field-error">{formErrors.password || " "}</small>
        </div>

        <div className="form-field">
          <label>Confirm Password</label>
          <input type="password" value={newUser.confirmPassword} onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })} />
          <small className="field-error">{formErrors.confirmPassword || " "}</small>
        </div>
      </div>

      <div className="modal-actions">
        <button onClick={() => {
          setNewUser({ name: "", email: "", phone: "", role: "Dispatcher", password: "", confirmPassword: "", status: "ACTIVE" });
          setFormErrors({});
        }}>Reset</button>
        <button className="primary" onClick={handleCreate}>
          Create
        </button>
      </div>

    </div>
  </div>
)}

    </Layout>
  );
}
