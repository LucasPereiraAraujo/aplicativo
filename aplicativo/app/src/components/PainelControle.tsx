import { useKeepAwake } from 'expo-keep-awake';
import { StyleSheet, Text, View } from 'react-native';
import { Comando, ComandoValor, EstadoArmazem } from '../bluetooth/protocol';
import { cores } from '../theme';
import { AlertaFogo } from './AlertaFogo';
import { Botao } from './Botao';
import { Cartao } from './Cartao';
import { Lampada } from './Lampada';

interface PainelControleProps {
  estado: EstadoArmazem;
  enviar: (c: ComandoValor) => void;
}

export function PainelControle({ estado, enviar }: PainelControleProps) {
  // Mantém a tela ligada enquanto monitora, para o alerta de fogo chegar na hora.
  useKeepAwake();

  const bloqueado = estado.fogo;
  const manual = estado.modo === 'M';

  return (
    <>
      {estado.fogo && <AlertaFogo />}

      <Cartao titulo="Modo">
        <View style={estilos.linha}>
          <Botao rotulo="Automático" ativo={!manual} onPress={() => enviar(Comando.automatico)} />
          <Botao rotulo="Manual" ativo={manual} onPress={() => enviar(Comando.manual)} />
        </View>
        <Text style={estilos.dica}>
          {manual
            ? 'Você controla o semáforo e o portão.'
            : 'O ciclo roda sozinho. Tocar em uma cor ou no portão muda para o modo manual.'}
        </Text>
      </Cartao>

      <Cartao titulo="Semáforo">
        <View style={estilos.linha}>
          <Lampada
            luz="R"
            atual={estado.luz}
            rotulo="Parado"
            desabilitado={bloqueado}
            onPress={() => enviar(Comando.vermelho)}
          />
          <Lampada
            luz="Y"
            atual={estado.luz}
            rotulo="Atenção"
            desabilitado={bloqueado}
            onPress={() => enviar(Comando.amarelo)}
          />
          <Lampada
            luz="G"
            atual={estado.luz}
            rotulo="Liberado"
            desabilitado={bloqueado}
            onPress={() => enviar(Comando.verde)}
          />
        </View>
      </Cartao>

      <Cartao titulo={`Portão: ${estado.portaoAberto ? 'ABERTO' : 'FECHADO'}`}>
        <View style={estilos.linha}>
          <Botao
            rotulo="Abrir"
            ativo={estado.portaoAberto}
            desabilitado={bloqueado}
            onPress={() => enviar(Comando.abrirPortao)}
          />
          <Botao
            rotulo="Fechar"
            ativo={!estado.portaoAberto}
            desabilitado={bloqueado}
            onPress={() => enviar(Comando.fecharPortao)}
          />
        </View>
      </Cartao>
    </>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 10 },
  dica: { color: cores.suave, fontSize: 14, lineHeight: 20 },
});
