export type Categoria =
  | "Venue" | "Buffet" | "Decoração" | "Foto/Vídeo" | "Vestuário"
  | "Música" | "Convites" | "Lua de Mel" | "Beleza" | "Alianças"
  | "Bolo" | "Flores" | "Transporte" | "Outros";

export type Status = "pendente" | "em_andamento" | "concluido" | "cancelado";
export type Prioridade = "alta" | "media" | "baixa";

export interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;
  pago: boolean;
}

export interface WeddingItem {
  id: string;
  nome: string;
  categoria: Categoria;
  fornecedor: string | null;
  valorTotal: number;
  valorPago: number;
  parcelas: Parcela[];
  prazo: string | null;
  status: Status;
  prioridade: Prioridade;
  notas: string | null;
  criadoEm: string;
}

export interface WeddingConfig {
  nomeNoiva: string;
  nomeNoivo: string;
  dataCasamento: string;
  orcamentoTotal: number;
}

export const CATEGORIAS: Categoria[] = [
  "Venue", "Buffet", "Decoração", "Foto/Vídeo", "Vestuário",
  "Música", "Convites", "Lua de Mel", "Beleza", "Alianças",
  "Bolo", "Flores", "Transporte", "Outros",
];

export const CATEGORIA_ICONS: Record<Categoria, string> = {
  "Venue": "🏛️", "Buffet": "🍽️", "Decoração": "🎀", "Foto/Vídeo": "📸",
  "Vestuário": "👗", "Música": "🎵", "Convites": "💌", "Lua de Mel": "✈️",
  "Beleza": "💄", "Alianças": "💍", "Bolo": "🎂", "Flores": "🌸",
  "Transporte": "🚗", "Outros": "📦",
};

export const STATUS_LABELS: Record<Status, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<Status, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400",
  em_andamento: "bg-blue-500/20 text-blue-400",
  concluido: "bg-emerald-500/20 text-emerald-400",
  cancelado: "bg-red-500/20 text-red-400",
};

export const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};
