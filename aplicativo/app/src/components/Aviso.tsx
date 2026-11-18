import { StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

interface AvisoProps {
  mensagem: string;
  tipo?: 'erro' | 'sucesso' | 'info';
}

/** Faixa de mensagem (erro, sucesso ou informação). */
export function Aviso({ mensagem, tipo = 'erro' }: AvisoProps) {
  return (
    <View style={[estilos.base, estilos[tipo]]} accessibilityRole="alert">
      <Text style={[estilos.texto, estilos[`texto_${tipo}`]]}>{mensagem}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: 10, padding: 12 },
  erro: { backgroundColor: cores.erroFundo },
  sucesso: { backgroundColor: cores.sucessoFundo },
  info: { backgroundColor: cores.cartao, borderColor: cores.amarelo, borderWidth: 1 },
  texto: { fontSize: 14, lineHeight: 20 },
  texto_erro: { color: cores.erroTexto },
  texto_sucesso: { color: cores.sucessoTexto },
  texto_info: { color: cores.texto },
});
