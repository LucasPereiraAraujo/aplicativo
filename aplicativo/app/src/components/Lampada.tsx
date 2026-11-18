import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Luz } from '../bluetooth/protocol';
import { cores } from '../theme';

interface LampadaProps {
  luz: Luz;
  atual: Luz;
  rotulo: string;
  desabilitado?: boolean;
  onPress: () => void;
}

const corDaLuz: Record<Luz, string> = { R: cores.vermelho, Y: cores.amarelo, G: cores.verde };

export function Lampada({ luz, atual, rotulo, desabilitado, onPress }: LampadaProps) {
  const cor = corDaLuz[luz];
  const acesa = luz === atual;
  return (
    <Pressable
      disabled={desabilitado}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Semáforo: ${rotulo}`}
      accessibilityState={{ selected: acesa, disabled: desabilitado }}
      style={({ pressed }) => [estilos.area, pressed && estilos.pressionado]}
    >
      <View
        style={[estilos.lampada, { backgroundColor: acesa ? cor : cores.apagado, borderColor: cor }]}
      />
      <Text style={[estilos.rotulo, acesa && { color: cores.texto }]}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 4 },
  lampada: { width: 64, height: 64, borderRadius: 32, borderWidth: 3 },
  rotulo: { color: cores.suave, fontSize: 14, fontWeight: '600' },
  pressionado: { opacity: 0.7 },
});
