export interface SendNotificationOptions {
  userId?: string;
  oneSignalPlayerIds?: string[];
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
  sendToAll?: boolean;
}

export interface SendNotificationResponse {
  success: boolean;
  notificationId?: string;
  recipients?: number;
  error?: string;
}

export const sendPushNotification = async (
  options: SendNotificationOptions
): Promise<SendNotificationResponse> => {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: options.userId,
        include_player_ids: options.oneSignalPlayerIds,
        title: options.title,
        message: options.message,
        url: options.url,
        data: options.data,
        send_to_all: options.sendToAll || false,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Error al enviar notificación",
      };
    }

    return {
      success: true,
      notificationId: result.notificationId,
      recipients: result.recipients,
    };
  } catch (error: any) {
    console.error("Error enviando notificación push:", error);
    return {
      success: false,
      error: error.message || "Error desconocido",
    };
  }
};

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  options?: {
    url?: string;
    data?: Record<string, any>;
  }
): Promise<SendNotificationResponse> => {
  return sendPushNotification({
    userId,
    title,
    message,
    url: options?.url,
    data: options?.data,
  });
};

export const sendNotificationToPlayers = async (
  playerIds: string[],
  title: string,
  message: string,
  options?: {
    url?: string;
    data?: Record<string, any>;
  }
): Promise<SendNotificationResponse> => {
  return sendPushNotification({
    oneSignalPlayerIds: playerIds,
    title,
    message,
    url: options?.url,
    data: options?.data,
  });
};

export const sendNotificationToAll = async (
  title: string,
  message: string,
  options?: {
    url?: string;
    data?: Record<string, any>;
  }
): Promise<SendNotificationResponse> => {
  return sendPushNotification({
    sendToAll: true,
    title,
    message,
    url: options?.url,
    data: options?.data,
  });
};
