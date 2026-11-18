// Protocolo de texto entre o app e o Arduino (ver o cabeçalho do arquivo .ino).

export type Luz = 'R' | 'Y' | 'G';
export type Modo = 'A' | 'M';

export interface EstadoArmazem {
  modo: Modo;
  luz: Luz;
  portaoAberto: boolean;
  fogo: boolean;
}

export const Comando = {
  automatico: 'A',
  manual: 'M',
  vermelho: 'R',
  amarelo: 'Y',
  verde: 'G',
  abrirPortao: 'O',
  fecharPortao: 'C',
  pedirEstado: 'S',
} as const;

export type ComandoValor = (typeof Comando)[keyof typeof Comando];

/** Interpreta uma linha "S:<modo>,<luz>,<portao>,<fogo>". Retorna null se for inválida. */
export function interpretarLinha(linha: string): EstadoArmazem | null {
  const m = /S:([AM]),([RYG]),([01]),([01])/.exec(linha);
  if (!m) return null;
  return {
    modo: m[1] as Modo,
    luz: m[2] as Luz,
    portaoAberto: m[3] === '1',
    fogo: m[4] === '1',
  };
}
