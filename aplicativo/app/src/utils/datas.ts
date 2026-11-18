const dois = (n: number) => String(n).padStart(2, '0');

/** "18/11/2026 14:05" */
export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(
    d.getHours(),
  )}:${dois(d.getMinutes())}`;
}

/**
 * Converte "dd/mm/aaaa hh:mm" (hora local) em ISO.
 * Retorna null se o texto não for uma data válida.
 */
export function lerDataHora(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const [dia, mes, ano, hora, min] = m.slice(1).map(Number);
  const d = new Date(ano, mes - 1, dia, hora, min);
  // new Date aceita 31/02 e "corrige" para março; aqui isso é erro.
  if (
    d.getFullYear() !== ano ||
    d.getMonth() !== mes - 1 ||
    d.getDate() !== dia ||
    d.getHours() !== hora ||
    d.getMinutes() !== min
  ) {
    return null;
  }
  return d.toISOString();
}

export function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
