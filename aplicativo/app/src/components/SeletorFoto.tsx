import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { ResultadoFoto, escolherDaGaleria, tirarFoto } from '../services/fotos';
import { cores } from '../theme';
import { Botao } from './Botao';

interface SeletorFotoProps {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

/** Foto da ocorrência: câmera ou galeria, com tratamento de permissão negada. */
export function SeletorFoto({ uri, onChange }: SeletorFotoProps) {
  async function obter(fonte: 'camera' | 'galeria') {
    const r = fonte === 'camera' ? await tirarFoto() : await escolherDaGaleria();
    tratar(r, fonte);
  }

  function tratar(r: ResultadoFoto, fonte: 'camera' | 'galeria') {
    const nome = fonte === 'camera' ? 'câmera' : 'galeria de fotos';
    switch (r.tipo) {
      case 'ok':
        onChange(r.uri);
        return;
      case 'cancelado':
        return;
      case 'sem_permissao':
        Alert.alert(
          'Permissão negada',
          `Sem acesso à ${nome}, não é possível anexar a foto. A ocorrência pode ser salva sem foto.` +
            (r.podePerguntarDeNovo ? '' : '\n\nPara liberar, abra as configurações do app.'),
          r.podePerguntarDeNovo
            ? [{ text: 'OK' }]
            : [
                { text: 'Agora não', style: 'cancel' },
                { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
              ],
        );
        return;
      case 'indisponivel':
        Alert.alert(
          'Recurso indisponível',
          `Não foi possível usar a ${nome} neste aparelho (${r.mensagem}).` +
            (fonte === 'camera' ? ' Tente escolher uma imagem da galeria.' : ''),
        );
    }
  }

  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>Foto (opcional)</Text>
      {uri ? (
        <View style={estilos.previa}>
          <Image source={{ uri }} style={estilos.imagem} accessibilityLabel="Foto da ocorrência" />
        </View>
      ) : (
        <Text style={estilos.dica}>Registre o local, o equipamento ou o dano.</Text>
      )}
      <View style={estilos.linha}>
        <Botao rotulo="📷 Câmera" onPress={() => void obter('camera')} />
        <Botao rotulo="🖼️ Galeria" onPress={() => void obter('galeria')} />
      </View>
      {uri ? <Botao rotulo="Remover foto" variante="perigo" onPress={() => onChange(null)} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: { gap: 8 },
  rotulo: { color: cores.texto, fontSize: 15, fontWeight: '600' },
  dica: { color: cores.suave, fontSize: 13 },
  previa: { borderRadius: 12, overflow: 'hidden', borderColor: cores.borda, borderWidth: 1 },
  imagem: { width: '100%', aspectRatio: 4 / 3, backgroundColor: cores.fundo },
  linha: { flexDirection: 'row', gap: 10 },
});
