import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Cartao } from '../../components/Cartao';
import { ListaDispositivos } from '../../components/ListaDispositivos';
import { PainelControle } from '../../components/PainelControle';
import { useArmazemConectado } from '../../contexts/ArmazemContext';
import { cores } from '../../theme';

export default function TelaPainel() {
  const armazem = useArmazemConectado();
  const { conexao, estado, erro, disponivel } = armazem;
  const emFogo = estado?.fogo ?? false;

  return (
    <ScrollView
      style={[estilos.tela, emFogo && estilos.telaFogo]}
      contentContainerStyle={estilos.conteudo}
    >
      <Text style={estilos.status}>
        {conexao === 'conectado'
          ? `Conectado a ${armazem.conectadoA?.nome}`
          : conexao === 'conectando'
            ? 'Conectando…'
            : 'Desconectado'}
      </Text>

      {erro ? <Aviso mensagem={erro} /> : null}

      {!disponivel ? null : conexao === 'conectado' ? (
        <>
          {estado ? (
            <PainelControle estado={estado} enviar={(c) => void armazem.enviar(c)} />
          ) : (
            <Cartao>
              <ActivityIndicator color={cores.texto} />
              <Text style={estilos.dica}>Aguardando o estado do Arduino…</Text>
            </Cartao>
          )}
          <Botao
            rotulo="Desconectar"
            onPress={() => void armazem.desconectar()}
            variante="contorno"
            expandir={false}
          />
        </>
      ) : (
        <ListaDispositivos
          dispositivos={armazem.dispositivos}
          conectando={conexao === 'conectando'}
          onConectar={(d) => void armazem.conectar(d)}
          onAtualizar={() => void armazem.listarPareados()}
        />
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  telaFogo: { backgroundColor: cores.fogoFundo },
  conteudo: { padding: 16, gap: 14 },
  status: { color: cores.suave, fontSize: 15 },
  dica: { color: cores.suave, fontSize: 14, lineHeight: 20 },
});
