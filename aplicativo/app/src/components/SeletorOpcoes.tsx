import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Opcao } from '../types/ocorrencia';
import { cores } from '../theme';

interface SeletorOpcoesProps<T extends string> {
  rotulo?: string;
  opcoes: Opcao<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  obrigatorio?: boolean;
  erro?: string;
}

/** Grupo de "chips" para escolher uma opção (tipo, gravidade, status, filtro...). */
export function SeletorOpcoes<T extends string>({
  rotulo,
  opcoes,
  valor,
  onChange,
  obrigatorio,
  erro,
}: SeletorOpcoesProps<T>) {
  return (
    <View style={estilos.campo}>
      {rotulo ? (
        <Text style={estilos.rotulo}>
          {rotulo}
          {obrigatorio ? <Text style={estilos.asterisco}> *</Text> : null}
        </Text>
      ) : null}
      <View style={estilos.opcoes} accessibilityRole="radiogroup">
        {opcoes.map((o) => {
          const selecionado = o.valor === valor;
          return (
            <Pressable
              key={o.valor}
              onPress={() => onChange(o.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selecionado }}
              style={({ pressed }) => [
                estilos.chip,
                selecionado && estilos.chipSelecionado,
                pressed && estilos.pressionado,
              ]}
            >
              <Text style={[estilos.texto, selecionado && estilos.textoSelecionado]}>
                {o.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: 8 },
  rotulo: { color: cores.texto, fontSize: 15, fontWeight: '600' },
  asterisco: { color: cores.vermelho },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  texto: { color: cores.suave, fontSize: 14, fontWeight: '600' },
  textoSelecionado: { color: cores.texto },
  pressionado: { opacity: 0.7 },
  erro: { color: cores.erroTexto, fontSize: 13 },
});
