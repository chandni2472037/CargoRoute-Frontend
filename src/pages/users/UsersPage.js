import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import axios from "axios";
import "../../styles/Users.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);


  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    status: "ACTIVE"
  });


  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );


  const handleCreate = async () => {
  await axios.post(
    "http://localhost:8084/cargoRoute/auth/signup",
    newUser,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setShowCreate(false);
  setNewUser({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    status: "ACTIVE"
  });

  loadUsers();
  };



  const loadUsers = async () => {
    const res = await axios.get(
      "http://localhost:8084/cargoRoute/user/getAllUsers",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
      );
      setUsers(res.data);
    };
    useEffect(() => {
      loadUsers();
    }, []);


  const handleSave = async () => {
  await axios.put(
    `http://localhost:8084/cargoRoute/user/${selectedUser.userID}`,
    {
      role: selectedUser.role,
      status: selectedUser.status
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setSelectedUser(null);
  loadUsers(); // reload table
};


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

    <button className="primary" onClick={() => setShowCreate(true)}>
      + New User
    </button>
  </div>
</div>


      <table className="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
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
              <td>{u.phone}</td>
              <td>
                <button onClick={() => setSelectedUser(u)}>Edit</button>

              </td>
            </tr>
          ))}
        </tbody>
      </table>



        {/* ✅ EDIT USER MODAL — PUT IT HERE */}
        {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-card">

            <h3>Edit User</h3>

            <label>Email</label>
            <input value={selectedUser.email} disabled />

            <label>Role</label>
            <select
              value={selectedUser.role}
              onChange={e =>
                setSelectedUser({ ...selectedUser, role: e.target.value })
              }
            >
              <option>Admin</option>
              <option>Dispatcher</option>
              <option>Driver</option>
              <option>Analyst</option>
            </select>

            <label>Status</label>
            <select
              value={selectedUser.status}
              onChange={e =>
                setSelectedUser({ ...selectedUser, status: e.target.value })
              }
            >
              <option>ACTIVE</option>
              <option>INACTIVE</option>
            </select>

            <div className="modal-actions">
              <button onClick={() => setSelectedUser(null)}>
                Cancel
              </button>
              <button className="primary" onClick={handleSave}>
                Save
              </button>
            </div>

          </div>
        </div>
      )}




      {showCreate && (
  <div className="modal-backdrop">
    <div className="modal-card">

      <h3>Create New User</h3>

      <label>Name</label>
      <input
        value={newUser.name}
        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
      />

      <label>Email</label>
      <input
        value={newUser.email}
        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
      />

      <label>Phone</label>
      <input
        value={newUser.phone}
        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
      />

      <label>Role</label>
      <select
        value={newUser.role}
        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
      >
        <option>Dispatcher</option>
        <option>Driver</option>
        <option>FleetManager</option>
        <option>WarehouseManager</option>
        <option>BillingClerk</option>
        <option>Analyst</option>
        <option>Admin</option>
      </select>

      <label>Password</label>
      <input
        type="password"
        value={newUser.password}
        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
      />

      <div className="modal-actions">
        <button onClick={() => setShowCreate(false)}>Cancel</button>
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
