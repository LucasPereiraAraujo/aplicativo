import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { prepararNotificacoes } from './src/notificacoes';
import { Comando, ComandoValor, EstadoArmazem, Luz } from './src/protocol';
import { Dispositivo, useArmazem } from './src/useArmazem';

const cores = {
  fundo: '#10151c',
  cartao: '#1b232e',
  borda: '#2b3644',
  texto: '#eef2f6',
  suave: '#8e9bab',
  primaria: '#3b82f6',
  vermelho: '#ef4444',
  amarelo: '#facc15',
  verde: '#22c55e',
  apagado: '#333d4a',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Tela />
    </SafeAreaProvider>
  );
}

function Tela() {
  const armazem = useArmazem();
  const { conexao, estado, erro } = armazem;
  const emFogo = estado?.fogo ?? false;

  useEffect(() => {
    void prepararNotificacoes();
  }, []);

  return (
    <SafeAreaView style={[estilos.tela, emFogo && estilos.telaFogo]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text style={estilos.titulo}>Armazém</Text>
        <Text style={estilos.subtitulo}>
          {conexao === 'conectado'
            ? `Conectado a ${armazem.conectadoA?.nome}`
            : conexao === 'conectando'
              ? 'Conectando…'
              : 'Desconectado'}
        </Text>

        {erro && (
          <View style={estilos.erro}>
            <Text style={estilos.erroTexto}>{erro}</Text>
          </View>
        )}

        {conexao === 'conectado' ? (
          <>
            {estado ? (
              <Painel estado={estado} enviar={armazem.enviar} />
            ) : (
              <View style={estilos.cartao}>
                <ActivityIndicator color={cores.texto} />
                <Text style={estilos.dica}>Aguardando o estado do Arduino…</Text>
              </View>
            )}
            <Botao rotulo="Desconectar" onPress={armazem.desconectar} contorno />
          </>
        ) : (
          <ListaDispositivos
            dispositivos={armazem.dispositivos}
            conectando={conexao === 'conectando'}
            onConectar={armazem.conectar}
            onAtualizar={armazem.listarPareados}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListaDispositivos(props: {
  dispositivos: Dispositivo[];
  conectando: boolean;
  onConectar: (d: Dispositivo) => void;
  onAtualizar: () => void;
}) {
  return (
    <View style={estilos.cartao}>
      <Text style={estilos.cartaoTitulo}>Dispositivos pareados</Text>
      {props.dispositivos.length === 0 && (
        <Text style={estilos.dica}>
          Nenhum dispositivo pareado. Pareie o HC-05/HC-06 nas configurações de Bluetooth do
          Android (senha 1234 ou 0000) e toque em Atualizar.
        </Text>
      )}
      {props.dispositivos.map((d) => (
        <Pressable
          key={d.endereco}
          disabled={props.conectando}
          onPress={() => props.onConectar(d)}
          style={({ pressed }) => [estilos.dispositivo, pressed && estilos.pressionado]}
        >
          <Text style={estilos.dispositivoNome}>{d.nome}</Text>
          <Text style={estilos.dispositivoEndereco}>{d.endereco}</Text>
        </Pressable>
      ))}
      {props.conectando ? (
        <ActivityIndicator color={cores.texto} style={{ marginTop: 12 }} />
      ) : (
        <Botao rotulo="Atualizar lista" onPress={props.onAtualizar} contorno />
      )}
    </View>
  );
}

function Painel(props: { estado: EstadoArmazem; enviar: (c: ComandoValor) => void }) {
  const { estado, enviar } = props;
  // Mantém a tela ligada enquanto monitora, para o alerta de fogo chegar na hora.
  useKeepAwake();

  const bloqueado = estado.fogo;
  const manual = estado.modo === 'M';

  return (
    <>
      {estado.fogo && (
        <View style={estilos.alerta}>
          <Text style={estilos.alertaTitulo}>🔥 FOGO DETECTADO</Text>
          <Text style={estilos.alertaTexto}>
            Emergência ativa: portão aberto para evacuação, ventilador e alarme ligados. Os
            controles ficam bloqueados até o fogo acabar.
          </Text>
        </View>
      )}

      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>Modo</Text>
        <View style={estilos.linha}>
          <Botao
            rotulo="Automático"
            ativo={!manual}
            onPress={() => enviar(Comando.automatico)}
          />
          <Botao rotulo="Manual" ativo={manual} onPress={() => enviar(Comando.manual)} />
        </View>
        <Text style={estilos.dica}>
          {manual
            ? 'Você controla o semáforo e o portão.'
            : 'O ciclo roda sozinho. Tocar em uma cor ou no portão muda para o modo manual.'}
        </Text>
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>Semáforo</Text>
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
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>
          Portão: {estado.portaoAberto ? 'ABERTO' : 'FECHADO'}
        </Text>
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
      </View>
    </>
  );
}

function Lampada(props: {
  luz: Luz;
  atual: Luz;
  rotulo: string;
  desabilitado?: boolean;
  onPress: () => void;
}) {
  const cor = { R: cores.vermelho, Y: cores.amarelo, G: cores.verde }[props.luz];
  const acesa = props.luz === props.atual;
  return (
    <Pressable
      disabled={props.desabilitado}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={`Semáforo: ${props.rotulo}`}
      accessibilityState={{ selected: acesa, disabled: props.desabilitado }}
      style={({ pressed }) => [estilos.lampadaArea, pressed && estilos.pressionado]}
    >
      <View
        style={[
          estilos.lampada,
          { backgroundColor: acesa ? cor : cores.apagado, borderColor: cor },
        ]}
      />
      <Text style={[estilos.lampadaRotulo, acesa && { color: cores.texto }]}>
        {props.rotulo}
      </Text>
    </Pressable>
  );
}

function Botao(props: {
  rotulo: string;
  onPress: () => void;
  ativo?: boolean;
  contorno?: boolean;
  desabilitado?: boolean;
}) {
  return (
    <Pressable
      disabled={props.desabilitado}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: props.ativo, disabled: props.desabilitado }}
      style={({ pressed }) => [
        estilos.botao,
        props.ativo && estilos.botaoAtivo,
        props.contorno && estilos.botaoContorno,
        props.desabilitado && estilos.desabilitado,
        pressed && estilos.pressionado,
      ]}
    >
      <Text style={estilos.botaoTexto}>{props.rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  telaFogo: { backgroundColor: '#3a0d0d' },
  conteudo: { padding: 16, gap: 14 },
  titulo: { color: cores.texto, fontSize: 28, fontWeight: '700' },
  subtitulo: { color: cores.suave, fontSize: 15, marginTop: -8 },
  cartao: {
    backgroundColor: cores.cartao,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cartaoTitulo: { color: cores.texto, fontSize: 17, fontWeight: '600' },
  dica: { color: cores.suave, fontSize: 14, lineHeight: 20 },
  linha: { flexDirection: 'row', gap: 10 },
  erro: { backgroundColor: '#4a1d1d', borderRadius: 10, padding: 12 },
  erroTexto: { color: '#fecaca', fontSize: 14, lineHeight: 20 },
  alerta: { backgroundColor: cores.vermelho, borderRadius: 14, padding: 16, gap: 6 },
  alertaTitulo: { color: '#fff', fontSize: 22, fontWeight: '800' },
  alertaTexto: { color: '#fff', fontSize: 15, lineHeight: 21 },
  dispositivo: {
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  dispositivoNome: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  dispositivoEndereco: { color: cores.suave, fontSize: 13, marginTop: 2 },
  botao: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: cores.apagado,
  },
  botaoAtivo: { backgroundColor: cores.primaria },
  botaoContorno: {
    flex: 0,
    backgroundColor: 'transparent',
    borderColor: cores.borda,
    borderWidth: 1,
  },
  botaoTexto: { color: cores.texto, fontSize: 16, fontWeight: '600' },
  desabilitado: { opacity: 0.4 },
  pressionado: { opacity: 0.7 },
  lampadaArea: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 4 },
  lampada: { width: 64, height: 64, borderRadius: 32, borderWidth: 3 },
  lampadaRotulo: { color: cores.suave, fontSize: 14, fontWeight: '600' },
});
