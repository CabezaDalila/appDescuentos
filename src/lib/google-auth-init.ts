// Inicializar Google Auth para Capacitor
export const initializeGoogleAuth = async () => {
  try {
    // Solo inicializar si estamos en el cliente y en una plataforma nativa
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      // Import dinámico para evitar errores en SSR
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      
      await GoogleAuth.initialize({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'TU_CLIENT_ID_WEB.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      // Log removido por seguridad
    }
  } catch (error) {
    console.error('Error al inicializar Google Auth:', error);
  }
}; 