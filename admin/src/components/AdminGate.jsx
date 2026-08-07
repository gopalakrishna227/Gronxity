import { useParams, Navigate } from "react-router-dom";

export default function AdminGate() {
  const { id } = useParams();

  const allowedSecrets = [
    "admin"
    
  ];

  const isAllowed = allowedSecrets.includes(id);

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Navigate to="/admin-login" replace />;
}