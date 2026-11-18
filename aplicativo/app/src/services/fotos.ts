// Câmera e galeria (expo-image-picker) + cópia da foto para a pasta permanente do app.

import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export type ResultadoFoto =
  | { tipo: 'ok'; uri: string }
  | { tipo: 'cancelado' }
  | { tipo: 'sem_permissao'; podePerguntarDeNovo: boolean }
  | { tipo: 'indisponivel'; mensagem: string };

const OPCOES: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.6,
  allowsEditing: true,
  aspect: [4, 3],
};

export async function tirarFoto(): Promise<ResultadoFoto> {
  try {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      return { tipo: 'sem_permissao', podePerguntarDeNovo: permissao.canAskAgain };
    }
    return tratar(await ImagePicker.launchCameraAsync(OPCOES));
  } catch (e) {
    // Ex.: emulador sem câmera.
    return { tipo: 'indisponivel', mensagem: mensagem(e) };
  }
}

export async function escolherDaGaleria(): Promise<ResultadoFoto> {
  try {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      return { tipo: 'sem_permissao', podePerguntarDeNovo: permissao.canAskAgain };
    }
    return tratar(await ImagePicker.launchImageLibraryAsync(OPCOES));
  } catch (e) {
    return { tipo: 'indisponivel', mensagem: mensagem(e) };
  }
}

function tratar(r: ImagePicker.ImagePickerResult): ResultadoFoto {
  if (r.canceled || !r.assets?.[0]) return { tipo: 'cancelado' };
  return { tipo: 'ok', uri: r.assets[0].uri };
}

const pastaFotos = () => new Directory(Paths.document, 'fotos');

/** A foto do picker fica no cache (o sistema pode apagar). Copia para documentos. */
export async function guardarFoto(uri: string | null, id: string): Promise<string | null> {
  if (!uri) return null;
  const pasta = pastaFotos();
  if (uri.startsWith(pasta.uri)) return uri; // já é permanente
  if (!pasta.exists) pasta.create({ intermediates: true, idempotent: true });
  const extensao = /\.(\w+)(\?|$)/.exec(uri)?.[1] ?? 'jpg';
  const destino = new File(pasta, `${id}-${Date.now()}.${extensao}`);
  await new File(uri).copy(destino);
  return destino.uri;
}

export function apagarFoto(uri: string | null): void {
  if (!uri || !uri.startsWith(pastaFotos().uri)) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch (e) {
    console.warn('Não foi possível apagar a foto', e);
  }
}

function mensagem(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
