import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

const CANAL_FOGO = 'alerta-fogo';

// Mostra a notificação mesmo com o app aberto em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function prepararNotificacoes(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_FOGO, {
      name: 'Alertas de incêndio',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: 'default',
    });
  }
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

export async function alertarFogo(): Promise<void> {
  Vibration.vibrate([0, 500, 250, 500, 250, 500]);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 FOGO DETECTADO NO ARMAZÉM',
        body: 'Modo de emergência ativo: portão aberto para evacuação e ventilador ligado.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: Platform.OS === 'android' ? { channelId: CANAL_FOGO } : null,
    });
  } catch (e) {
    console.warn('Falha ao exibir notificação de fogo', e);
  }
}

export async function avisarFogoExtinto(): Promise<void> {
  Vibration.cancel();
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Emergência encerrada',
        body: 'O sensor não detecta mais fogo. Operação normal retomada.',
      },
      trigger: Platform.OS === 'android' ? { channelId: CANAL_FOGO } : null,
    });
  } catch (e) {
    console.warn('Falha ao exibir notificação', e);
  }
}
