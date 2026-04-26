import { getUserFromToken } from "../../utils/jwtUtils";
import Layout from "../../components/Layout";

export default function Profile() {
  const user = getUserFromToken();

  return (
    <Layout>
      <h2>My Profile</h2>

      <div style={{ maxWidth: 420 }}>
        <label>Name</label>
        <input value={user.name} disabled />

        <label>Email</label>
        <input value={user.email} disabled />

        <label>Role</label>
        <input value={user.role} disabled />
      </div>
    </Layout>
  );
}
