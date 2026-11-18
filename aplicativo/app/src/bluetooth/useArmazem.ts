import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { Comando, ComandoValor, EstadoArmazem, interpretarLinha } from './protocol';

export type Conexao = 'desconectado' | 'conectando' | 'conectado';

export interface Dispositivo {
  nome: string;
  endereco: string;
}

// Sem nenhuma linha de estado por este tempo, considera a conexão perdida.
// (o Arduino envia o estado a cada 2 s)
const TEMPO_SEM_DADOS_MS = 8000;

/**
 * O módulo nativo só existe no APK (build de desenvolvimento ou preview).
 * No Expo Go ele não está presente: o restante do app funciona, só o painel fica indisponível.
 */
export const bluetoothDisponivel =
  Platform.OS === 'android' && NativeModules.RNBluetoothClassic != null;

export interface EventosFogo {
  onFogoDetectado: () => void;
  onFogoEncerrado: () => void;
}

async function pedirPermissoesBluetooth(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const permissoes =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const resultado = await PermissionsAndroid.requestMultiple(permissoes);
  return permissoes.every((p) => resultado[p] === PermissionsAndroid.RESULTS.GRANTED);
}

export function useArmazem(eventos: EventosFogo) {
  const [conexao, setConexao] = useState<Conexao>('desconectado');
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [conectadoA, setConectadoA] = useState<Dispositivo | null>(null);
  const [estado, setEstado] = useState<EstadoArmazem | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const dispositivoRef = useRef<BluetoothDevice | null>(null);
  const assinaturaRef = useRef<{ remove: () => void } | null>(null);
  const fogoRef = useRef(false);
  const ultimoDadoRef = useRef(0);
  // Sempre a versão mais recente dos callbacks, sem recriar a assinatura do Bluetooth.
  const eventosRef = useRef(eventos);
  eventosRef.current = eventos;

  const limparConexao = useCallback(() => {
    assinaturaRef.current?.remove();
    assinaturaRef.current = null;
    dispositivoRef.current = null;
    setConectadoA(null);
    setEstado(null);
    setConexao('desconectado');
    // fogoRef é mantido de propósito: se reconectar com o fogo ainda ativo, não repete o alerta.
  }, []);

  const receberLinha = useCallback((linha: string) => {
    const novo = interpretarLinha(linha);
    if (!novo) return;
    ultimoDadoRef.current = Date.now();
    setEstado(novo);
    if (novo.fogo && !fogoRef.current) {
      fogoRef.current = true;
      eventosRef.current.onFogoDetectado();
    } else if (!novo.fogo && fogoRef.current) {
      fogoRef.current = false;
      eventosRef.current.onFogoEncerrado();
    }
  }, []);

  const listarPareados = useCallback(async () => {
    setErro(null);
    if (!bluetoothDisponivel) {
      setErro(
        Platform.OS === 'android'
          ? 'Bluetooth indisponível nesta versão do app (Expo Go). Instale o APK para controlar o armazém. O registro de ocorrências funciona normalmente.'
          : 'O controle por Bluetooth só funciona no Android (HC-05/HC-06 usam Bluetooth Clássico).',
      );
      return;
    }
    try {
      if (!(await pedirPermissoesBluetooth())) {
        setErro('Permissão de Bluetooth negada. Libere em Configurações > Apps > Armazém.');
        return;
      }
      if (!(await RNBluetoothClassic.isBluetoothEnabled())) {
        const ligou = await RNBluetoothClassic.requestBluetoothEnabled();
        if (!ligou) {
          setErro('Ligue o Bluetooth do celular para continuar.');
          return;
        }
      }
      const pareados = await RNBluetoothClassic.getBondedDevices();
      setDispositivos(
        pareados.map((d) => ({ nome: d.name || 'Sem nome', endereco: d.address })),
      );
    } catch (e) {
      setErro(`Não foi possível listar os dispositivos: ${mensagem(e)}`);
    }
  }, []);

  const conectar = useCallback(
    async (alvo: Dispositivo) => {
      if (dispositivoRef.current) return;
      setErro(null);
      setConexao('conectando');
      try {
        const dispositivo = await RNBluetoothClassic.connectToDevice(alvo.endereco, {
          delimiter: '\n',
          charset: 'ascii',
        });
        dispositivoRef.current = dispositivo;
        assinaturaRef.current = dispositivo.onDataReceived((evento) => {
          receberLinha(String(evento.data ?? ''));
        });
        ultimoDadoRef.current = Date.now();
        setConectadoA(alvo);
        setConexao('conectado');
        await dispositivo.write(Comando.pedirEstado);
      } catch (e) {
        limparConexao();
        setErro(
          `Falha ao conectar em ${alvo.nome}: ${mensagem(e)}. ` +
            'Confira se o módulo está ligado e não está conectado a outro celular.',
        );
      }
    },
    [limparConexao, receberLinha],
  );

  const desconectar = useCallback(async () => {
    const dispositivo = dispositivoRef.current;
    limparConexao();
    try {
      await dispositivo?.disconnect();
    } catch {
      // já estava desconectado
    }
  }, [limparConexao]);

  const enviar = useCallback(
    async (comando: ComandoValor) => {
      const dispositivo = dispositivoRef.current;
      if (!dispositivo) return;
      try {
        await dispositivo.write(comando);
      } catch (e) {
        setErro(`Conexão perdida: ${mensagem(e)}`);
        limparConexao();
      }
    },
    [limparConexao],
  );

  // Queda de conexão avisada pelo sistema
  useEffect(() => {
    if (!bluetoothDisponivel) return;
    const assinatura = RNBluetoothClassic.onDeviceDisconnected(() => {
      if (dispositivoRef.current) {
        setErro('O módulo Bluetooth foi desconectado.');
        limparConexao();
      }
    });
    return () => assinatura.remove();
  }, [limparConexao]);

  // Queda silenciosa (Arduino sem energia, fora de alcance...)
  useEffect(() => {
    if (conexao !== 'conectado') return;
    const id = setInterval(() => {
      if (Date.now() - ultimoDadoRef.current > TEMPO_SEM_DADOS_MS) {
        setErro('Sem resposta do Arduino. Conexão encerrada.');
        void desconectar();
      }
    }, 2000);
    return () => clearInterval(id);
  }, [conexao, desconectar]);

  useEffect(() => {
    void listarPareados();
    return () => {
      assinaturaRef.current?.remove();
      void dispositivoRef.current?.disconnect().catch(() => {});
    };
  }, [listarPareados]);

  return {
    disponivel: bluetoothDisponivel,
    conexao,
    dispositivos,
    conectadoA,
    estado,
    erro,
    listarPareados,
    conectar,
    desconectar,
    enviar,
  };
}

function mensagem(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
