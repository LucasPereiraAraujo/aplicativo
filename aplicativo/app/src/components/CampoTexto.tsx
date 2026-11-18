import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { cores } from '../theme';

interface CampoTextoProps extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  obrigatorio?: boolean;
  erro?: string;
  dica?: string;
}

export function CampoTexto({ rotulo, obrigatorio, erro, dica, ...props }: CampoTextoProps) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>
        {rotulo}
        {obrigatorio ? <Text style={estilos.asterisco}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={cores.suave}
        accessibilityLabel={rotulo}
        {...props}
        style={[estilos.entrada, props.multiline && estilos.multilinha, erro && estilos.entradaErro]}
      />
      {erro ? (
        <Text style={estilos.erro}>{erro}</Text>
      ) : dica ? (
        <Text style={estilos.dica}>{dica}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: 6 },
  rotulo: { color: cores.texto, fontSize: 15, fontWeight: '600' },
  asterisco: { color: cores.vermelho },
  entrada: {
    backgroundColor: cores.fundo,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    color: cores.texto,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  multilinha: { minHeight: 110, textAlignVertical: 'top' },
  entradaErro: { borderColor: cores.vermelho },
  erro: { color: cores.erroTexto, fontSize: 13 },
  dica: { color: cores.suave, fontSize: 13 },
});
