// Estado global das ocorrências: carrega do AsyncStorage ao abrir o app e grava
// a lista a cada alteração (cadastro, edição, mudança de status, exclusão).

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apagarFoto, guardarFoto } from '../services/fotos';
import { carregarOcorrencias, salvarOcorrencias } from '../storage/ocorrenciasStorage';
import { DadosOcorrencia, Ocorrencia, StatusOcorrencia } from '../types/ocorrencia';
import { gerarId } from '../utils/datas';

// Um fogo detectado há menos que isso e ainda sem fim registrado é o mesmo incêndio
// (ex.: o app reconectou ou foi reaberto durante a emergência).
const JANELA_MESMO_INCENDIO_MS = 30 * 60 * 1000;

interface ValorOcorrencias {
  ocorrencias: Ocorrencia[];
  carregando: boolean;
  erroPersistencia: string | null;
  buscar: (id: string) => Ocorrencia | undefined;
  criar: (dados: DadosOcorrencia) => Promise<Ocorrencia>;
  atualizar: (id: string, dados: DadosOcorrencia) => Promise<void>;
  alterarStatus: (id: string, status: StatusOcorrencia) => void;
  excluir: (id: string) => void;
  /** Chamado quando o sensor detecta fogo. Retorna o id da ocorrência do incêndio. */
  registrarFogoDetectado: () => string;
  /** Chamado quando o fogo acaba. Retorna o id da ocorrência encerrada, se houver. */
  registrarFogoEncerrado: () => string | null;
}

const Contexto = createContext<ValorOcorrencias | null>(null);

export function OcorrenciasProvider({ children }: { children: ReactNode }) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroPersistencia, setErroPersistencia] = useState<string | null>(null);
  const listaRef = useRef<Ocorrencia[]>([]);
  listaRef.current = ocorrencias;
  const fogoAtualRef = useRef<string | null>(null);

  // 1) Recupera os registros ao iniciar o app.
  useEffect(() => {
    let ativo = true;
    carregarOcorrencias()
      .then((salvas) => {
        if (!ativo) return;
        // Mantém algo criado durante o carregamento (ex.: fogo detectado logo ao abrir).
        setOcorrencias((atuais) => [
          ...atuais.filter((a) => !salvas.some((s) => s.id === a.id)),
          ...salvas,
        ]);
      })
      .catch((e: unknown) => ativo && setErroPersistencia(mensagem(e)))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  // 2) Grava sempre que a lista muda. Só depois de carregar, para não
  //    sobrescrever os dados salvos com a lista vazia inicial.
  useEffect(() => {
    if (carregando) return;
    salvarOcorrencias(ocorrencias)
      .then(() => setErroPersistencia(null))
      .catch((e: unknown) =>
        setErroPersistencia(`Não foi possível salvar no aparelho: ${mensagem(e)}`),
      );
  }, [ocorrencias, carregando]);

  const buscar = useCallback(
    (id: string) => ocorrencias.find((o) => o.id === id),
    [ocorrencias],
  );

  const criar = useCallback(async (dados: DadosOcorrencia) => {
    const id = gerarId();
    const agora = new Date().toISOString();
    const nova: Ocorrencia = {
      ...dados,
      id,
      fotoUri: await guardarFoto(dados.fotoUri, id),
      origem: 'manual',
      detalhesPendentes: false,
      encerradaEm: null,
      criadaEm: agora,
      atualizadaEm: agora,
    };
    setOcorrencias((lista) => [nova, ...lista]);
    return nova;
  }, []);

  const atualizar = useCallback(async (id: string, dados: DadosOcorrencia) => {
    const anterior = listaRef.current.find((o) => o.id === id);
    if (!anterior) throw new Error('Ocorrência não encontrada (pode ter sido excluída).');
    const fotoUri = await guardarFoto(dados.fotoUri, id);
    if (anterior.fotoUri && anterior.fotoUri !== fotoUri) apagarFoto(anterior.fotoUri);
    setOcorrencias((lista) =>
      lista.map((o) =>
        o.id === id
          ? {
              ...o,
              ...dados,
              fotoUri,
              detalhesPendentes: false,
              atualizadaEm: new Date().toISOString(),
            }
          : o,
      ),
    );
  }, []);

  const alterarStatus = useCallback((id: string, status: StatusOcorrencia) => {
    setOcorrencias((lista) =>
      lista.map((o) =>
        o.id === id ? { ...o, status, atualizadaEm: new Date().toISOString() } : o,
      ),
    );
  }, []);

  const excluir = useCallback((id: string) => {
    const alvo = listaRef.current.find((o) => o.id === id);
    apagarFoto(alvo?.fotoUri ?? null);
    if (fogoAtualRef.current === id) fogoAtualRef.current = null;
    setOcorrencias((lista) => lista.filter((o) => o.id !== id));
  }, []);

  const registrarFogoDetectado = useCallback(() => {
    const agora = Date.now();
    const emAndamento = listaRef.current.find(
      (o) =>
        o.origem === 'sensor' &&
        o.encerradaEm === null &&
        agora - new Date(o.criadaEm).getTime() < JANELA_MESMO_INCENDIO_MS,
    );
    if (emAndamento) {
      fogoAtualRef.current = emAndamento.id;
      return emAndamento.id;
    }
    const iso = new Date(agora).toISOString();
    const nova: Ocorrencia = {
      id: gerarId(),
      titulo: 'Incêndio detectado pelo sensor',
      tipo: 'incendio',
      gravidade: 'critica',
      status: 'aberta',
      local: 'Armazém (sensor de chama)',
      descricao:
        'Registro automático: o sensor de chama do Arduino detectou fogo. Portão aberto, ' +
        'ventilador e alarme ligados. Complete com a causa, os danos e as providências.',
      responsavel: '',
      dataHora: iso,
      fotoUri: null,
      origem: 'sensor',
      detalhesPendentes: true,
      encerradaEm: null,
      criadaEm: iso,
      atualizadaEm: iso,
    };
    fogoAtualRef.current = nova.id;
    setOcorrencias((lista) => [nova, ...lista]);
    return nova.id;
  }, []);

  const registrarFogoEncerrado = useCallback(() => {
    const id = fogoAtualRef.current;
    fogoAtualRef.current = null;
    if (!id) return null;
    const agora = new Date().toISOString();
    setOcorrencias((lista) =>
      lista.map((o) =>
        o.id === id && o.encerradaEm === null
          ? { ...o, encerradaEm: agora, atualizadaEm: agora }
          : o,
      ),
    );
    return id;
  }, []);

  const valor = useMemo<ValorOcorrencias>(
    () => ({
      ocorrencias,
      carregando,
      erroPersistencia,
      buscar,
      criar,
      atualizar,
      alterarStatus,
      excluir,
      registrarFogoDetectado,
      registrarFogoEncerrado,
    }),
    [
      ocorrencias,
      carregando,
      erroPersistencia,
      buscar,
      criar,
      atualizar,
      alterarStatus,
      excluir,
      registrarFogoDetectado,
      registrarFogoEncerrado,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useOcorrencias(): ValorOcorrencias {
  const v = useContext(Contexto);
  if (!v) throw new Error('useOcorrencias precisa estar dentro de <OcorrenciasProvider>');
  return v;
}

function mensagem(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
