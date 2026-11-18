// Tipos do registro de ocorrências do armazém.

export type TipoOcorrencia =
  | 'incendio'
  | 'falha_equipamento'
  | 'acesso_indevido'
  | 'acidente'
  | 'manutencao'
  | 'outro';

export type Gravidade = 'baixa' | 'media' | 'alta' | 'critica';

export type StatusOcorrencia = 'aberta' | 'em_andamento' | 'resolvida';

/** `sensor`: criada automaticamente quando o Arduino detectou fogo. */
export type OrigemOcorrencia = 'manual' | 'sensor';

export interface Ocorrencia {
  id: string;
  titulo: string;
  tipo: TipoOcorrencia;
  gravidade: Gravidade;
  status: StatusOcorrencia;
  local: string;
  descricao: string;
  responsavel: string;
  /** Quando a ocorrência aconteceu (ISO 8601). */
  dataHora: string;
  /** Foto salva na pasta de documentos do app, ou null. */
  fotoUri: string | null;
  origem: OrigemOcorrencia;
  /** Registro automático que ainda espera o usuário preencher os detalhes. */
  detalhesPendentes: boolean;
  /** Fim da emergência informado pelo sensor (só para origem "sensor"). */
  encerradaEm: string | null;
  criadaEm: string;
  atualizadaEm: string;
}

/** Campos que o usuário preenche no formulário. */
export type DadosOcorrencia = Pick<
  Ocorrencia,
  | 'titulo'
  | 'tipo'
  | 'gravidade'
  | 'status'
  | 'local'
  | 'descricao'
  | 'responsavel'
  | 'dataHora'
  | 'fotoUri'
>;

export interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
}

export const TIPOS: Opcao<TipoOcorrencia>[] = [
  { valor: 'incendio', rotulo: '🔥 Incêndio' },
  { valor: 'falha_equipamento', rotulo: '⚙️ Falha de equipamento' },
  { valor: 'acesso_indevido', rotulo: '🚫 Acesso indevido' },
  { valor: 'acidente', rotulo: '🩹 Acidente' },
  { valor: 'manutencao', rotulo: '🔧 Manutenção' },
  { valor: 'outro', rotulo: '📌 Outro' },
];

export const GRAVIDADES: Opcao<Gravidade>[] = [
  { valor: 'baixa', rotulo: 'Baixa' },
  { valor: 'media', rotulo: 'Média' },
  { valor: 'alta', rotulo: 'Alta' },
  { valor: 'critica', rotulo: 'Crítica' },
];

export const STATUS: Opcao<StatusOcorrencia>[] = [
  { valor: 'aberta', rotulo: 'Aberta' },
  { valor: 'em_andamento', rotulo: 'Em andamento' },
  { valor: 'resolvida', rotulo: 'Resolvida' },
];

export function rotuloDe<T extends string>(opcoes: Opcao<T>[], valor: T): string {
  return opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;
}
