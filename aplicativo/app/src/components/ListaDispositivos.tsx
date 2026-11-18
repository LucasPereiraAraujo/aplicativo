import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Dispositivo } from '../bluetooth/useArmazem';
import { cores } from '../theme';
import { Botao } from './Botao';
import { Cartao } from './Cartao';

interface ListaDispositivosProps {
  dispositivos: Dispositivo[];
  conectando: boolean;
  onConectar: (d: Dispositivo) => void;
  onAtualizar: () => void;
}

export function ListaDispositivos({
  dispositivos,
  conectando,
  onConectar,
  onAtualizar,
}: ListaDispositivosProps) {
  return (
    <Cartao titulo="Dispositivos pareados">
      {dispositivos.length === 0 && (
        <Text style={estilos.dica}>
          Nenhum dispositivo pareado. Pareie o HC-05/HC-06 nas configurações de Bluetooth do
          Android (senha 1234 ou 0000) e toque em Atualizar.
        </Text>
      )}
      {dispositivos.map((d) => (
        <Pressable
          key={d.endereco}
          disabled={conectando}
          onPress={() => onConectar(d)}
          accessibilityRole="button"
          accessibilityLabel={`Conectar em ${d.nome}`}
          style={({ pressed }) => [estilos.dispositivo, pressed && estilos.pressionado]}
        >
          <Text style={estilos.nome}>{d.nome}</Text>
          <Text style={estilos.endereco}>{d.endereco}</Text>
        </Pressable>
      ))}
      {conectando ? (
        <ActivityIndicator color={cores.texto} style={{ marginTop: 12 }} />
      ) : (
        <Botao rotulo="Atualizar lista" onPress={onAtualizar} variante="contorno" expandir={false} />
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  dica: { color: cores.suave, fontSize: 14, lineHeight: 20 },
  dispositivo: { borderColor: cores.borda, borderWidth: 1, borderRadius: 10, padding: 14 },
  nome: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  endereco: { color: cores.suave, fontSize: 13, marginTop: 2 },
  pressionado: { opacity: 0.7 },
});
