import { StyleSheet, Text, View } from 'react-native';
import { Gravidade, StatusOcorrencia } from '../types/ocorrencia';
import { cores } from '../theme';

export const corDaGravidade: Record<Gravidade, string> = {
  baixa: cores.verde,
  media: cores.amarelo,
  alta: cores.laranja,
  critica: cores.vermelho,
};

export const corDoStatus: Record<StatusOcorrencia, string> = {
  aberta: cores.vermelho,
  em_andamento: cores.amarelo,
  resolvida: cores.verde,
};

interface EtiquetaProps {
  texto: string;
  cor: string;
}

/** Pequeno selo colorido (status, gravidade...). */
export function Etiqueta({ texto, cor }: EtiquetaProps) {
  return (
    <View style={[estilos.etiqueta, { borderColor: cor }]}>
      <View style={[estilos.ponto, { backgroundColor: cor }]} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  texto: { color: cores.texto, fontSize: 13, fontWeight: '600' },
});
