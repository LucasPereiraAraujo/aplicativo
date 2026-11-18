// Persistência local das ocorrências com AsyncStorage.
// A lista inteira é gravada como JSON em uma chave; para o volume de um armazém
// (dezenas ou centenas de registros) isso é simples e suficiente.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ocorrencia } from '../types/ocorrencia';

const CHAVE = '@armazem/ocorrencias:v1';
const CHAVE_BACKUP = '@armazem/ocorrencias:corrompido';

export async function carregarOcorrencias(): Promise<Ocorrencia[]> {
  const bruto = await AsyncStorage.getItem(CHAVE);
  if (bruto == null) return [];
  try {
    const dados: unknown = JSON.parse(bruto);
    if (!Array.isArray(dados)) throw new Error('formato inválido');
    return dados.filter(eOcorrencia).map(normalizar);
  } catch {
    // Guarda o conteúdo ilegível em vez de perdê-lo ao gravar a próxima alteração.
    await AsyncStorage.setItem(CHAVE_BACKUP, bruto);
    throw new Error('Os dados salvos estavam corrompidos e foram reiniciados (cópia mantida).');
  }
}

export async function salvarOcorrencias(lista: Ocorrencia[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista));
}

function eOcorrencia(x: unknown): x is Ocorrencia {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.titulo === 'string';
}

// Garante os campos novos em registros gravados por versões anteriores.
function normalizar(o: Ocorrencia): Ocorrencia {
  return {
    ...o,
    responsavel: o.responsavel ?? '',
    fotoUri: o.fotoUri ?? null,
    origem: o.origem ?? 'manual',
    detalhesPendentes: o.detalhesPendentes ?? false,
    encerradaEm: o.encerradaEm ?? null,
  };
}
