import axios from "axios";
import { getToken } from "../utils/jwtUtils";
import { useEffect, useState } from "react";

export default function AdminDashboard() {

  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8082/user", {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    }).then(res => setUsers(res.data));
  }, []);

  return (
    <>
      <h2>Admin Dashboard</h2>
      <ul>
        {users.map(u => (
          <li key={u.userID}>{u.name} - {u.role}</li>
        ))}
      </ul>
    </>
  );
}