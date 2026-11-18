// Compartilhamento nativo (menu "Compartilhar" do Android/iOS).

import { Share } from 'react-native';
import { GRAVIDADES, Ocorrencia, STATUS, TIPOS, rotuloDe } from '../types/ocorrencia';
import { formatarDataHora } from '../utils/datas';

export function textoDaOcorrencia(o: Ocorrencia): string {
  const linhas = [
    `OCORRÊNCIA — ${o.titulo}`,
    `Tipo: ${rotuloDe(TIPOS, o.tipo)}`,
    `Gravidade: ${rotuloDe(GRAVIDADES, o.gravidade)}`,
    `Status: ${rotuloDe(STATUS, o.status)}`,
    `Local: ${o.local}`,
    `Data/hora: ${formatarDataHora(o.dataHora)}`,
  ];
  if (o.encerradaEm) linhas.push(`Emergência encerrada: ${formatarDataHora(o.encerradaEm)}`);
  if (o.responsavel) linhas.push(`Responsável: ${o.responsavel}`);
  linhas.push('', o.descricao);
  return linhas.join('\n');
}

/** Retorna false se o usuário fechou o menu sem compartilhar. */
export async function compartilharOcorrencia(o: Ocorrencia): Promise<boolean> {
  const r = await Share.share({
    title: `Ocorrência: ${o.titulo}`,
    message: textoDaOcorrencia(o),
  });
  return r.action === Share.sharedAction;
}
