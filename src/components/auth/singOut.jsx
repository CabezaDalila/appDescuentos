import { logout } from "../../lib/firebase-auth";
import { Button } from "@/components/shadcn/button"
export default function SignOut() {
  const handleLogout = async () => {
    try {
      await logout();
      alert("Sesión cerrada correctamente");
    } catch (err) {
      alert("Error al cerrar sesión: " + err.message);
    }
  };

  return (
    <Button 
      onClick={handleLogout}>
      Cerrar Sesión
    </Button>
  );
}
