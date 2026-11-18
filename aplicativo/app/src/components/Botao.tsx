import { Pressable, StyleSheet, Text } from 'react-native';
import { cores } from '../theme';

export type VarianteBotao = 'padrao' | 'primario' | 'perigo' | 'contorno';

export interface BotaoProps {
  rotulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  /** Destaca o botão como opção selecionada (ex.: modo atual). */
  ativo?: boolean;
  desabilitado?: boolean;
  /** Ocupa o espaço disponível em uma linha de botões. */
  expandir?: boolean;
}

export function Botao({
  rotulo,
  onPress,
  variante = 'padrao',
  ativo,
  desabilitado,
  expandir = true,
}: BotaoProps) {
  return (
    <Pressable
      disabled={desabilitado}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: ativo, disabled: desabilitado }}
      style={({ pressed }) => [
        estilos.botao,
        expandir && estilos.expandir,
        estilos[variante],
        ativo && estilos.ativo,
        desabilitado && estilos.desabilitado,
        pressed && estilos.pressionado,
      ]}
    >
      <Text style={[estilos.texto, variante === 'perigo' && estilos.textoPerigo]}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  expandir: { flexGrow: 1, flexBasis: 0 },
  padrao: { backgroundColor: cores.apagado },
  primario: { backgroundColor: cores.primaria },
  perigo: { backgroundColor: 'transparent', borderColor: cores.vermelho, borderWidth: 1 },
  contorno: { backgroundColor: 'transparent', borderColor: cores.borda, borderWidth: 1 },
  ativo: { backgroundColor: cores.primaria },
  texto: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  textoPerigo: { color: cores.vermelho },
  desabilitado: { opacity: 0.4 },
  pressionado: { opacity: 0.7 },
});
