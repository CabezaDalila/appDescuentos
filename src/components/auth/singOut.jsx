import { logout } from "../../lib/firebase-auth";
import { Button } from "@/components/Share/button"
export default function SignOut() {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <Button 
      onClick={handleLogout}>
      Cerrar Sesión
    </Button>
  );
}
