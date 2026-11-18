import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '../../../components/Aviso';
import { Botao } from '../../../components/Botao';
import { Cartao } from '../../../components/Cartao';
import { Etiqueta, corDaGravidade, corDoStatus } from '../../../components/Etiqueta';
import { EstadoVazio } from '../../../components/EstadoVazio';
import { SeletorOpcoes } from '../../../components/SeletorOpcoes';
import { useOcorrencias } from '../../../contexts/OcorrenciasContext';
import { compartilharOcorrencia } from '../../../services/compartilhar';
import { GRAVIDADES, STATUS, TIPOS, rotuloDe } from '../../../types/ocorrencia';
import { formatarDataHora } from '../../../utils/datas';
import { cores } from '../../../theme';

export default function TelaDetalheOcorrencia() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buscar, alterarStatus, excluir, carregando } = useOcorrencias();
  const o = buscar(id);

  if (!o) {
    return (
      <EstadoVazio
        icone={carregando ? '⏳' : '❓'}
        titulo={carregando ? 'Carregando…' : 'Ocorrência não encontrada'}
        mensagem={carregando ? '' : 'Ela pode ter sido excluída.'}
      />
    );
  }

  function confirmarExclusao() {
    if (!o) return;
    Alert.alert('Excluir ocorrência', `Excluir “${o.titulo}”? Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          // Volta primeiro para a tela de detalhes não piscar "não encontrada".
          router.back();
          excluir(o.id);
        },
      },
    ]);
  }

  async function compartilhar() {
    if (!o) return;
    try {
      await compartilharOcorrencia(o);
    } catch (e) {
      Alert.alert('Não foi possível compartilhar', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Stack.Screen options={{ title: o.titulo }} />

      {o.detalhesPendentes ? (
        <Aviso
          tipo="info"
          mensagem="Registro automático do sensor de chama. Toque em Editar para completar os detalhes."
        />
      ) : null}

      <View style={estilos.etiquetas}>
        <Etiqueta texto={rotuloDe(STATUS, o.status)} cor={corDoStatus[o.status]} />
        <Etiqueta texto={rotuloDe(GRAVIDADES, o.gravidade)} cor={corDaGravidade[o.gravidade]} />
        {o.origem === 'sensor' ? <Etiqueta texto="Sensor" cor={cores.primaria} /> : null}
      </View>

      {o.fotoUri ? (
        <Image source={{ uri: o.fotoUri }} style={estilos.foto} accessibilityLabel="Foto da ocorrência" />
      ) : null}

      <Cartao titulo="Detalhes">
        <Linha rotulo="Tipo" valor={rotuloDe(TIPOS, o.tipo)} />
        <Linha rotulo="Local" valor={o.local} />
        <Linha rotulo="Data e hora" valor={formatarDataHora(o.dataHora)} />
        {o.origem === 'sensor' ? (
          <Linha
            rotulo="Fim da emergência"
            valor={o.encerradaEm ? formatarDataHora(o.encerradaEm) : 'Não registrado'}
          />
        ) : null}
        <Linha rotulo="Responsável" valor={o.responsavel || '—'} />
        <Linha rotulo="Atualizada em" valor={formatarDataHora(o.atualizadaEm)} />
      </Cartao>

      <Cartao titulo="Descrição">
        <Text style={estilos.descricao}>{o.descricao}</Text>
      </Cartao>

      <Cartao titulo="Alterar status">
        <SeletorOpcoes opcoes={STATUS} valor={o.status} onChange={(s) => alterarStatus(o.id, s)} />
      </Cartao>

      <View style={estilos.linhaBotoes}>
        <Botao rotulo="✏️ Editar" variante="primario" onPress={() => router.push(`/ocorrencia/${o.id}/editar`)} />
        <Botao rotulo="📤 Compartilhar" onPress={() => void compartilhar()} />
      </View>
      <Botao rotulo="🗑️ Excluir" variante="perigo" onPress={confirmarExclusao} expandir={false} />
    </ScrollView>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 14, paddingBottom: 40 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: cores.cartao },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rotulo: { color: cores.suave, fontSize: 14 },
  valor: { color: cores.texto, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  descricao: { color: cores.texto, fontSize: 15, lineHeight: 22 },
  linhaBotoes: { flexDirection: 'row', gap: 10 },
});
