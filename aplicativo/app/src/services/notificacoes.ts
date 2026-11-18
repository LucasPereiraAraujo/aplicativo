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

export async function alertarFogo(ocorrenciaId: string | null): Promise<void> {
  Vibration.vibrate([0, 500, 250, 500, 250, 500]);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 FOGO DETECTADO NO ARMAZÉM',
        body: 'Modo de emergência ativo: portão aberto para evacuação e ventilador ligado. Ocorrência registrada.',
        sound: 'default',
        data: ocorrenciaId ? { ocorrenciaId } : {},
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: Platform.OS === 'android' ? { channelId: CANAL_FOGO } : null,
    });
  } catch (e) {
    console.warn('Falha ao exibir notificação de fogo', e);
  }
}

export async function avisarFogoExtinto(ocorrenciaId: string | null): Promise<void> {
  Vibration.cancel();
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Emergência encerrada',
        body: 'O sensor não detecta mais fogo. Toque para completar os detalhes da ocorrência.',
        data: ocorrenciaId ? { ocorrenciaId } : {},
      },
      trigger: Platform.OS === 'android' ? { channelId: CANAL_FOGO } : null,
    });
  } catch (e) {
    console.warn('Falha ao exibir notificação', e);
  }
}

/**
 * Chama `abrir(id)` quando o usuário toca numa notificação de fogo, inclusive
 * quando o toque abriu o app que estava fechado. Retorna a função de limpeza.
 */
export function aoTocarNotificacao(abrir: (ocorrenciaId: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  try {
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        const id = ocorrenciaDaNotificacao(r);
        if (id) {
          abrir(id);
          void Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => {});
    const assinatura = Notifications.addNotificationResponseReceivedListener((r) => {
      const id = ocorrenciaDaNotificacao(r);
      if (id) abrir(id);
    });
    return () => assinatura.remove();
  } catch (e) {
    console.warn('Notificações indisponíveis', e);
    return () => {};
  }
}

/** Id da ocorrência que uma notificação tocada pelo usuário deve abrir. */
function ocorrenciaDaNotificacao(
  resposta: Notifications.NotificationResponse | null,
): string | null {
  const id = resposta?.notification.request.content.data?.ocorrenciaId;
  return typeof id === 'string' ? id : null;
}
