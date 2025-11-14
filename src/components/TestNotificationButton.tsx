import { Button } from "@/components/Share/button";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Share/select";
import { useAuth } from "@/hooks/useAuth";
import {
  sendNotificationToAll,
  sendNotificationToUser,
} from "@/lib/onesignal-api";
import { Bell, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type NotificationType =
  | "vencimiento_tarjeta"
  | "promocion"
  | "recordatorio"
  | "sistema"
  | "info"
  | "warning"
  | "success"
  | "error";

export default function TestNotificationButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("¡Nueva oferta disponible! 🎉");
  const [message, setMessage] = useState(
    "Descubre nuestros descuentos exclusivos"
  );
  const [url, setUrl] = useState("/home");
  const [type, setType] = useState<NotificationType>("promocion");

  const handleSendToAll = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("El título y mensaje son requeridos");
      return;
    }

    setLoading(true);
    try {
      const result = await sendNotificationToAll(title, message, {
        url: url || "/home",
        data: {
          type: type,
          timestamp: new Date().toISOString(),
          sentBy: user?.email || "admin",
        },
      });

      if (result.success) {
        toast.success("Notificación enviada");
      } else {
        const errorMsg = result.error || "Error al enviar notificación";
        toast.error(errorMsg, {
          duration: 5000,
        });
        console.error("Error completo:", result);
      }
    } catch (error) {
      toast.error("Error al enviar notificación");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToMe = async () => {
    if (!user) {
      toast.error("Debes estar autenticado");
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error("El título y mensaje son requeridos");
      return;
    }

    setLoading(true);
    try {
      const result = await sendNotificationToUser(user.uid, title, message, {
        url: url || "/notifications",
        data: {
          type: type,
          test: true,
          userId: user.uid,
          timestamp: new Date().toISOString(),
        },
      });

      if (result.success) {
        toast.success("Notificación de prueba enviada correctamente");
      } else {
        toast.error(result.error || "Error al enviar notificación");
      }
    } catch (error) {
      toast.error("Error al enviar notificación");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <div>
        <h3 className="font-semibold text-lg mb-1">Enviar Notificación Push</h3>
        <p className="text-sm text-gray-600">
          Envía notificaciones a todos los dispositivos suscritos
        </p>
      </div>

      <div className="space-y-4">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">Título de la notificación</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: ¡Nueva oferta disponible!"
            disabled={loading}
          />
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <Label htmlFor="message">Mensaje</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ej: Descubre nuestros descuentos exclusivos"
            disabled={loading}
          />
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de notificación</Label>
          <Select
            value={type}
            onValueChange={(value: NotificationType) => setType(value)}
            disabled={loading}
          >
            <SelectTrigger id="type" className="text-gray-900">
              <SelectValue placeholder="Selecciona un tipo">
                {type === "promocion" && "Promoción"}
                {type === "vencimiento_tarjeta" && "Vencimiento de Tarjeta"}
                {type === "recordatorio" && "Recordatorio"}
                {type === "sistema" && "Sistema"}
                {type === "info" && "Información"}
                {type === "warning" && "Advertencia"}
                {type === "success" && "Éxito"}
                {type === "error" && "Error"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promocion">Promoción</SelectItem>
              <SelectItem value="vencimiento_tarjeta">
                Vencimiento de Tarjeta
              </SelectItem>
              <SelectItem value="recordatorio">Recordatorio</SelectItem>
              <SelectItem value="sistema">Sistema</SelectItem>
              <SelectItem value="info">Información</SelectItem>
              <SelectItem value="warning">Advertencia</SelectItem>
              <SelectItem value="success">Éxito</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* URL */}
        <div className="space-y-2">
          <Label htmlFor="url">URL de destino (opcional)</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/home"
            disabled={loading}
          />
        </div>

        {/* Botón principal para enviar a todos */}
        <Button
          onClick={handleSendToAll}
          disabled={loading || !title.trim() || !message.trim()}
          variant="default"
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Bell className="w-4 h-4 animate-pulse" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar a Todos los Dispositivos
            </>
          )}
        </Button>

        {/* Botón secundario para prueba personal */}
        {user && (
          <Button
            onClick={handleSendToMe}
            disabled={loading || !user}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Bell className="w-4 h-4" />
            Enviar a mí (prueba)
          </Button>
        )}

        {loading && (
          <p className="text-xs text-center text-gray-500">
            Enviando notificación a todos los dispositivos suscritos...
          </p>
        )}
      </div>
    </div>
  );
}
