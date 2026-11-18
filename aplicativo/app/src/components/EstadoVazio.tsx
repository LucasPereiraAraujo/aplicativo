import { StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

interface EstadoVazioProps {
  icone: string;
  titulo: string;
  mensagem: string;
}

export function EstadoVazio({ icone, titulo, mensagem }: EstadoVazioProps) {
  return (
    <View style={estilos.vazio}>
      <Text style={estilos.icone}>{icone}</Text>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.mensagem}>{mensagem}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  vazio: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  icone: { fontSize: 44 },
  titulo: { color: cores.texto, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  mensagem: { color: cores.suave, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
