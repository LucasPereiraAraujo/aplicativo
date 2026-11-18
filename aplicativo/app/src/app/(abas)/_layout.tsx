import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';
import { useOcorrencias } from '../../contexts/OcorrenciasContext';
import { cores } from '../../theme';

const icone = (emoji: string) =>
  function Icone({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
  };

export default function LayoutAbas() {
  const { ocorrencias } = useOcorrencias();
  const abertas = ocorrencias.filter((o) => o.status !== 'resolvida').length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.cartao },
        headerTintColor: cores.texto,
        tabBarStyle: { backgroundColor: cores.cartao, borderTopColor: cores.borda },
        tabBarActiveTintColor: cores.texto,
        tabBarInactiveTintColor: cores.suave,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Ocorrências', tabBarIcon: icone('📋'), tabBarBadge: abertas || undefined }}
      />
      <Tabs.Screen name="painel" options={{ title: 'Painel', tabBarIcon: icone('🚦') }} />
    </Tabs>
  );
}
