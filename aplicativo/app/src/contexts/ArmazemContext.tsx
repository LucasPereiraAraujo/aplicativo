// Conexão Bluetooth compartilhada entre as abas. Fica acima da navegação para que o
// alerta de fogo (e o registro automático da ocorrência) funcione em qualquer tela.

import { ReactNode, createContext, useContext } from 'react';
import { useArmazem } from '../bluetooth/useArmazem';
import { alertarFogo, avisarFogoExtinto } from '../services/notificacoes';
import { useOcorrencias } from './OcorrenciasContext';

type ValorArmazem = ReturnType<typeof useArmazem>;

const Contexto = createContext<ValorArmazem | null>(null);

export function ArmazemProvider({ children }: { children: ReactNode }) {
  const { registrarFogoDetectado, registrarFogoEncerrado } = useOcorrencias();
  const armazem = useArmazem({
    onFogoDetectado: () => void alertarFogo(registrarFogoDetectado()),
    onFogoEncerrado: () => void avisarFogoExtinto(registrarFogoEncerrado()),
  });
  return <Contexto.Provider value={armazem}>{children}</Contexto.Provider>;
}

export function useArmazemConectado(): ValorArmazem {
  const v = useContext(Contexto);
  if (!v) throw new Error('useArmazemConectado precisa estar dentro de <ArmazemProvider>');
  return v;
}
