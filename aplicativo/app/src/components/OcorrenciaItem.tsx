import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GRAVIDADES, Ocorrencia, STATUS, TIPOS, rotuloDe } from '../types/ocorrencia';
import { formatarDataHora } from '../utils/datas';
import { cores } from '../theme';
import { Etiqueta, corDaGravidade, corDoStatus } from './Etiqueta';

interface OcorrenciaItemProps {
  ocorrencia: Ocorrencia;
  onPress: (id: string) => void;
}

/** Linha da FlatList de ocorrências. */
export function OcorrenciaItem({ ocorrencia: o, onPress }: OcorrenciaItemProps) {
  return (
    <Pressable
      onPress={() => onPress(o.id)}
      accessibilityRole="button"
      accessibilityLabel={`Ocorrência ${o.titulo}, ${rotuloDe(STATUS, o.status)}`}
      style={({ pressed }) => [
        estilos.item,
        { borderLeftColor: corDaGravidade[o.gravidade] },
        pressed && estilos.pressionado,
      ]}
    >
      <View style={estilos.topo}>
        <View style={estilos.textos}>
          <Text style={estilos.titulo} numberOfLines={1}>
            {o.titulo}
          </Text>
          <Text style={estilos.sub} numberOfLines={1}>
            {rotuloDe(TIPOS, o.tipo)} · {o.local}
          </Text>
          <Text style={estilos.data}>{formatarDataHora(o.dataHora)}</Text>
        </View>
        {o.fotoUri ? <Image source={{ uri: o.fotoUri }} style={estilos.miniatura} /> : null}
      </View>
      <View style={estilos.etiquetas}>
        <Etiqueta texto={rotuloDe(STATUS, o.status)} cor={corDoStatus[o.status]} />
        <Etiqueta texto={rotuloDe(GRAVIDADES, o.gravidade)} cor={corDaGravidade[o.gravidade]} />
        {o.origem === 'sensor' ? <Etiqueta texto="Sensor" cor={cores.primaria} /> : null}
      </View>
      {o.detalhesPendentes ? (
        <Text style={estilos.pendente}>⚠️ Registro automático: toque para completar os detalhes</Text>
      ) : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  item: {
    backgroundColor: cores.cartao,
    borderColor: cores.borda,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  topo: { flexDirection: 'row', gap: 12 },
  textos: { flex: 1, gap: 2 },
  titulo: { color: cores.texto, fontSize: 16, fontWeight: '700' },
  sub: { color: cores.suave, fontSize: 14 },
  data: { color: cores.suave, fontSize: 13 },
  miniatura: { width: 56, height: 56, borderRadius: 8, backgroundColor: cores.fundo },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pendente: { color: cores.amarelo, fontSize: 13, fontWeight: '600' },
  pressionado: { opacity: 0.7 },
});
