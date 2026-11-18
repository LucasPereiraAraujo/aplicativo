import { router } from 'expo-router';
import { Alert } from 'react-native';
import { FormularioOcorrencia } from '../../components/FormularioOcorrencia';
import { useOcorrencias } from '../../contexts/OcorrenciasContext';

export default function TelaNovaOcorrencia() {
  const { criar } = useOcorrencias();

  return (
    <FormularioOcorrencia
      rotuloEnviar="Registrar"
      onCancelar={() => router.back()}
      onEnviar={async (dados) => {
        const nova = await criar(dados);
        router.back();
        Alert.alert('Ocorrência registrada', `“${nova.titulo}” foi salva no aparelho.`);
      }}
    />
  );
}
