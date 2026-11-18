import { DarkTheme, Stack, ThemeProvider, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ArmazemProvider } from '../contexts/ArmazemContext';
import { OcorrenciasProvider } from '../contexts/OcorrenciasContext';
import { aoTocarNotificacao, prepararNotificacoes } from '../services/notificacoes';
import { cores } from '../theme';

const tema = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: cores.fundo,
    card: cores.cartao,
    border: cores.borda,
    text: cores.texto,
    primary: cores.primaria,
  },
};

export default function LayoutRaiz() {
  useEffect(() => {
    prepararNotificacoes().catch((e: unknown) =>
      console.warn('Notificações indisponíveis neste aparelho', e),
    );
  }, []);

  // Tocar na notificação de fogo abre a ocorrência correspondente.
  useEffect(() => aoTocarNotificacao((id) => router.push(`/ocorrencia/${id}`)), []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={tema}>
        <OcorrenciasProvider>
          <ArmazemProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: cores.cartao },
                headerTintColor: cores.texto,
                contentStyle: { backgroundColor: cores.fundo },
              }}
            >
              <Stack.Screen name="(abas)" options={{ headerShown: false }} />
              <Stack.Screen name="ocorrencia/nova" options={{ title: 'Nova ocorrência' }} />
              <Stack.Screen name="ocorrencia/[id]/index" options={{ title: 'Ocorrência' }} />
              <Stack.Screen name="ocorrencia/[id]/editar" options={{ title: 'Editar ocorrência' }} />
            </Stack>
          </ArmazemProvider>
        </OcorrenciasProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
