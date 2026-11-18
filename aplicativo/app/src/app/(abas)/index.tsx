import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AlertaFogo } from '../../components/AlertaFogo';
import { Aviso } from '../../components/Aviso';
import { EstadoVazio } from '../../components/EstadoVazio';
import { OcorrenciaItem } from '../../components/OcorrenciaItem';
import { SeletorOpcoes } from '../../components/SeletorOpcoes';
import { useArmazemConectado } from '../../contexts/ArmazemContext';
import { useOcorrencias } from '../../contexts/OcorrenciasContext';
import { Opcao, STATUS, StatusOcorrencia } from '../../types/ocorrencia';
import { cores } from '../../theme';

type Filtro = 'todas' | StatusOcorrencia;
const FILTROS: Opcao<Filtro>[] = [{ valor: 'todas', rotulo: 'Todas' }, ...STATUS];

export default function TelaOcorrencias() {
  const { ocorrencias, carregando, erroPersistencia } = useOcorrencias();
  const { estado } = useArmazemConectado();
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busca, setBusca] = useState('');

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ocorrencias
      .filter((o) => filtro === 'todas' || o.status === filtro)
      .filter(
        (o) =>
          !termo ||
          o.titulo.toLowerCase().includes(termo) ||
          o.local.toLowerCase().includes(termo) ||
          o.descricao.toLowerCase().includes(termo),
      )
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  }, [ocorrencias, filtro, busca]);

  const contagem = useMemo(
    () => ({
      abertas: ocorrencias.filter((o) => o.status === 'aberta').length,
      andamento: ocorrencias.filter((o) => o.status === 'em_andamento').length,
      resolvidas: ocorrencias.filter((o) => o.status === 'resolvida').length,
      pendentes: ocorrencias.filter((o) => o.detalhesPendentes).length,
    }),
    [ocorrencias],
  );

  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.texto} size="large" />
        <Text style={estilos.suave}>Carregando ocorrências salvas…</Text>
      </View>
    );
  }

  const cabecalho = (
    <View style={estilos.cabecalho}>
      <View>
        <Text style={estilos.app}>Armazém</Text>
        <Text style={estilos.suave}>Semáforo, portão, alarme de incêndio e ocorrências</Text>
      </View>
      {estado?.fogo ? <AlertaFogo /> : null}
      {erroPersistencia ? <Aviso mensagem={erroPersistencia} /> : null}
      {contagem.pendentes > 0 ? (
        <Aviso
          tipo="info"
          mensagem={`${contagem.pendentes} registro(s) automático(s) do sensor aguardando detalhes.`}
        />
      ) : null}
      <View style={estilos.resumo}>
        <Indicador valor={contagem.abertas} rotulo="Abertas" cor={cores.vermelho} />
        <Indicador valor={contagem.andamento} rotulo="Em andamento" cor={cores.amarelo} />
        <Indicador valor={contagem.resolvidas} rotulo="Resolvidas" cor={cores.verde} />
      </View>
      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder="🔎 Buscar por título, local ou descrição"
        placeholderTextColor={cores.suave}
        style={estilos.busca}
        accessibilityLabel="Buscar ocorrências"
      />
      <SeletorOpcoes opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
    </View>
  );

  return (
    <View style={estilos.tela}>
      <FlatList
        data={visiveis}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OcorrenciaItem ocorrencia={item} onPress={(id) => router.push(`/ocorrencia/${id}`)} />
        )}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={
          ocorrencias.length === 0 ? (
            <EstadoVazio
              icone="📋"
              titulo="Nenhuma ocorrência registrada"
              mensagem="Toque em “+ Nova” para registrar a primeira. Incêndios detectados pelo sensor são registrados automaticamente."
            />
          ) : (
            <EstadoVazio
              icone="🔎"
              titulo="Nada encontrado"
              mensagem="Nenhuma ocorrência corresponde à busca ou ao filtro escolhido."
            />
          )
        }
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        keyboardShouldPersistTaps="handled"
      />
      <Pressable
        onPress={() => router.push('/ocorrencia/nova')}
        accessibilityRole="button"
        accessibilityLabel="Nova ocorrência"
        style={({ pressed }) => [estilos.fab, pressed && { opacity: 0.8 }]}
      >
        <Text style={estilos.fabTexto}>+ Nova</Text>
      </Pressable>
    </View>
  );
}

function Indicador(props: { valor: number; rotulo: string; cor: string }) {
  return (
    <View style={[estilos.indicador, { borderTopColor: props.cor }]}>
      <Text style={estilos.indicadorValor}>{props.valor}</Text>
      <Text style={estilos.indicadorRotulo}>{props.rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  lista: { padding: 16, paddingBottom: 100 },
  cabecalho: { gap: 14, marginBottom: 14 },
  app: { color: cores.texto, fontSize: 26, fontWeight: '800' },
  suave: { color: cores.suave, fontSize: 14 },
  resumo: { flexDirection: 'row', gap: 10 },
  indicador: {
    flex: 1,
    backgroundColor: cores.cartao,
    borderColor: cores.borda,
    borderWidth: 1,
    borderTopWidth: 4,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  indicadorValor: { color: cores.texto, fontSize: 24, fontWeight: '800' },
  indicadorRotulo: { color: cores.suave, fontSize: 12, textAlign: 'center' },
  busca: {
    backgroundColor: cores.cartao,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: 10,
    color: cores.texto,
    fontSize: 15,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    backgroundColor: cores.primaria,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    elevation: 4,
  },
  fabTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
