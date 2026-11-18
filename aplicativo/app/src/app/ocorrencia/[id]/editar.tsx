import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { EstadoVazio } from '../../../components/EstadoVazio';
import { FormularioOcorrencia } from '../../../components/FormularioOcorrencia';
import { useOcorrencias } from '../../../contexts/OcorrenciasContext';

export default function TelaEditarOcorrencia() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buscar, atualizar, carregando } = useOcorrencias();
  const ocorrencia = buscar(id);

  if (!ocorrencia) {
    return (
      <EstadoVazio
        icone={carregando ? '⏳' : '❓'}
        titulo={carregando ? 'Carregando…' : 'Ocorrência não encontrada'}
        mensagem={carregando ? '' : 'Ela pode ter sido excluída.'}
      />
    );
  }

  return (
    <FormularioOcorrencia
      inicial={ocorrencia}
      rotuloEnviar="Salvar alterações"
      aviso={
        ocorrencia.detalhesPendentes
          ? 'Registro automático do sensor de chama. Revise o texto e informe a causa, os danos, as providências e o responsável.'
          : undefined
      }
      onCancelar={() => router.back()}
      onEnviar={async (dados) => {
        await atualizar(ocorrencia.id, dados);
        router.back();
        Alert.alert('Alterações salvas', 'A ocorrência foi atualizada.');
      }}
    />
  );
}
