import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  DadosOcorrencia,
  GRAVIDADES,
  Gravidade,
  STATUS,
  StatusOcorrencia,
  TIPOS,
  TipoOcorrencia,
} from '../types/ocorrencia';
import { formatarDataHora, lerDataHora } from '../utils/datas';
import { cores } from '../theme';
import { Aviso } from './Aviso';
import { Botao } from './Botao';
import { CampoTexto } from './CampoTexto';
import { SeletorFoto } from './SeletorFoto';
import { SeletorOpcoes } from './SeletorOpcoes';

type Campo = 'titulo' | 'tipo' | 'gravidade' | 'local' | 'descricao' | 'dataHora';
type Erros = Partial<Record<Campo, string>>;

interface FormularioOcorrenciaProps {
  /** Valores para edição. Sem eles, o formulário começa vazio (cadastro). */
  inicial?: DadosOcorrencia;
  rotuloEnviar: string;
  onEnviar: (dados: DadosOcorrencia) => Promise<void>;
  onCancelar: () => void;
  /** Texto de orientação no topo (ex.: registro automático pendente). */
  aviso?: string;
}

export function FormularioOcorrencia({
  inicial,
  rotuloEnviar,
  onEnviar,
  onCancelar,
  aviso,
}: FormularioOcorrenciaProps) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [tipo, setTipo] = useState<TipoOcorrencia | null>(inicial?.tipo ?? null);
  const [gravidade, setGravidade] = useState<Gravidade | null>(inicial?.gravidade ?? null);
  const [status, setStatus] = useState<StatusOcorrencia>(inicial?.status ?? 'aberta');
  const [local, setLocal] = useState(inicial?.local ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [responsavel, setResponsavel] = useState(inicial?.responsavel ?? '');
  const [dataHora, setDataHora] = useState(
    formatarDataHora(inicial?.dataHora ?? new Date().toISOString()),
  );
  const [fotoUri, setFotoUri] = useState<string | null>(inicial?.fotoUri ?? null);
  const [erros, setErros] = useState<Erros>({});
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): { erros: Erros; dataIso: string | null } {
    const e: Erros = {};
    if (titulo.trim().length < 3) e.titulo = 'Informe um título com pelo menos 3 caracteres.';
    if (!tipo) e.tipo = 'Escolha o tipo da ocorrência.';
    if (!gravidade) e.gravidade = 'Escolha a gravidade.';
    if (!local.trim()) e.local = 'Informe onde aconteceu.';
    if (descricao.trim().length < 10)
      e.descricao = 'Descreva o que aconteceu (mínimo de 10 caracteres).';
    const dataIso = lerDataHora(dataHora);
    if (!dataIso) e.dataHora = 'Use o formato dd/mm/aaaa hh:mm com uma data válida.';
    else if (new Date(dataIso).getTime() > Date.now() + 5 * 60 * 1000)
      e.dataHora = 'A data não pode estar no futuro.';
    return { erros: e, dataIso };
  }

  async function enviar() {
    const { erros: e, dataIso } = validar();
    setErros(e);
    setErroEnvio(null);
    if (Object.keys(e).length > 0 || !tipo || !gravidade || !dataIso) {
      setErroEnvio('Corrija os campos destacados antes de salvar.');
      return;
    }
    setEnviando(true);
    try {
      await onEnviar({
        titulo: titulo.trim(),
        tipo,
        gravidade,
        status,
        local: local.trim(),
        descricao: descricao.trim(),
        responsavel: responsavel.trim(),
        dataHora: dataIso,
        fotoUri,
      });
    } catch (err) {
      setErroEnvio(`Não foi possível salvar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setEnviando(false);
    }
  }

  // Limpa o erro do campo assim que o usuário mexe nele.
  const limpar = (c: Campo) => erros[c] && setErros((x) => ({ ...x, [c]: undefined }));

  return (
    <KeyboardAvoidingView
      style={estilos.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {aviso ? <Aviso tipo="info" mensagem={aviso} /> : null}

        <CampoTexto
          rotulo="Título"
          obrigatorio
          value={titulo}
          onChangeText={(t) => {
            setTitulo(t);
            limpar('titulo');
          }}
          placeholder="Ex.: Empilhadeira com vazamento de óleo"
          maxLength={80}
          erro={erros.titulo}
        />
        <SeletorOpcoes
          rotulo="Tipo"
          obrigatorio
          opcoes={TIPOS}
          valor={tipo}
          onChange={(v) => {
            setTipo(v);
            limpar('tipo');
          }}
          erro={erros.tipo}
        />
        <SeletorOpcoes
          rotulo="Gravidade"
          obrigatorio
          opcoes={GRAVIDADES}
          valor={gravidade}
          onChange={(v) => {
            setGravidade(v);
            limpar('gravidade');
          }}
          erro={erros.gravidade}
        />
        <CampoTexto
          rotulo="Local / setor"
          obrigatorio
          value={local}
          onChangeText={(t) => {
            setLocal(t);
            limpar('local');
          }}
          placeholder="Ex.: Doca 2, corredor B"
          maxLength={60}
          erro={erros.local}
        />
        <CampoTexto
          rotulo="Data e hora"
          obrigatorio
          value={dataHora}
          onChangeText={(t) => {
            setDataHora(t);
            limpar('dataHora');
          }}
          placeholder="dd/mm/aaaa hh:mm"
          keyboardType="numbers-and-punctuation"
          maxLength={16}
          erro={erros.dataHora}
          dica="Quando a ocorrência aconteceu."
        />
        <CampoTexto
          rotulo="Descrição"
          obrigatorio
          value={descricao}
          onChangeText={(t) => {
            setDescricao(t);
            limpar('descricao');
          }}
          placeholder="O que aconteceu, causa provável, danos e providências tomadas"
          multiline
          maxLength={1000}
          erro={erros.descricao}
        />
        <CampoTexto
          rotulo="Responsável"
          value={responsavel}
          onChangeText={setResponsavel}
          placeholder="Quem registrou ou acompanha"
          maxLength={60}
        />
        <SeletorOpcoes rotulo="Status" opcoes={STATUS} valor={status} onChange={setStatus} />
        <SeletorFoto uri={fotoUri} onChange={setFotoUri} />

        {erroEnvio ? <Aviso mensagem={erroEnvio} /> : null}

        <View style={estilos.linha}>
          <Botao rotulo="Cancelar" variante="contorno" onPress={onCancelar} desabilitado={enviando} />
          {enviando ? (
            <View style={estilos.carregando}>
              <ActivityIndicator color={cores.texto} />
            </View>
          ) : (
            <Botao rotulo={rotuloEnviar} variante="primario" onPress={() => void enviar()} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: 16, gap: 18, paddingBottom: 40 },
  linha: { flexDirection: 'row', gap: 10 },
  carregando: { flexGrow: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'center' },
});
