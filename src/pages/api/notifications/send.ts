import { saveNotificationToFirestore } from "@/lib/notifications";
import type { NextApiRequest, NextApiResponse } from "next";

interface SendNotificationRequest {
  userId?: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
  include_player_ids?: string[];
  send_to_all?: boolean;
}

interface OneSignalResponse {
  id: string;
  recipients: number;
  errors?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const {
      userId,
      title,
      message,
      url,
      data,
      include_player_ids,
      send_to_all = false,
    }: SendNotificationRequest = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: "El título y el mensaje son requeridos",
      });
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      return res.status(500).json({
        error:
          "OneSignal no está configurado correctamente. Verifica las variables de entorno.",
      });
    }

    const notificationPayload: any = {
      app_id: appId,
      headings: { en: title, es: title },
      contents: { en: message, es: message },
      data: {
        ...data,
        url: url || "",
      },
    };

    if (send_to_all) {
      notificationPayload.included_segments = ["All"];
    } else if (include_player_ids && include_player_ids.length > 0) {
      notificationPayload.include_player_ids = include_player_ids;
    } else if (userId) {
      notificationPayload.filters = [
        { field: "tag", key: "firebase_user_id", relation: "=", value: userId },
      ];
    } else {
      return res.status(400).json({
        error:
          "Debes proporcionar userId, include_player_ids, o establecer send_to_all en true",
      });
    }

    if (url) {
      notificationPayload.url = url;
    }
    const oneSignalResponse = await fetch(
      "https://onesignal.com/api/v1/notifications",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${restApiKey}`,
        },
        body: JSON.stringify(notificationPayload),
      }
    );

    const responseText = await oneSignalResponse.text();

    if (!oneSignalResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      console.error("Error de OneSignal:", errorData);
      return res.status(oneSignalResponse.status).json({
        error: "Error al enviar notificación",
        details: errorData,
      });
    }

    let oneSignalResult: OneSignalResponse;
    try {
      oneSignalResult = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parseando respuesta:", error);
      return res.status(500).json({
        error: "Error al procesar respuesta de OneSignal",
        details: responseText,
      });
    }

    if (userId && !send_to_all) {
      try {
        await saveNotificationToFirestore({
          userId,
          title,
          message,
          type: (data?.type as any) || "sistema",
        });
      } catch (firestoreError) {
        console.error(
          "Error guardando notificación en Firestore:",
          firestoreError
        );
      }
    }

    return res.status(200).json({
      success: true,
      notificationId: oneSignalResult.id,
      recipients: oneSignalResult.recipients,
      message: "Notificación enviada correctamente",
    });
  } catch (error: any) {
    console.error("Error enviando notificación:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
}
