import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return formatDistanceToNow(new Date(value), { locale: ptBR, addSuffix: true });
}
