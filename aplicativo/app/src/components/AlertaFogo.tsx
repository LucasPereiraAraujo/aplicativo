import { StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

export function AlertaFogo() {
  return (
    <View style={estilos.alerta} accessibilityRole="alert">
      <Text style={estilos.titulo}>🔥 FOGO DETECTADO</Text>
      <Text style={estilos.texto}>
        Emergência ativa: portão aberto para evacuação, ventilador e alarme ligados. A
        ocorrência foi registrada automaticamente; complete os detalhes quando o fogo acabar.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  alerta: { backgroundColor: cores.vermelho, borderRadius: 14, padding: 16, gap: 6 },
  titulo: { color: '#fff', fontSize: 22, fontWeight: '800' },
  texto: { color: '#fff', fontSize: 15, lineHeight: 21 },
});
