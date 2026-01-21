export const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  revision: { label: 'Em Revisão', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Reprovado', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-700' },
} as const

export const CATEGORY_CONFIG = {
  material: { label: 'Material', color: 'bg-blue-500' },
  labor: { label: 'Mão de Obra', color: 'bg-amber-500' },
  equipment: { label: 'Equipamento', color: 'bg-slate-500' },
  service: { label: 'Serviço', color: 'bg-teal-500' },
  electrical: { label: 'Elétrica', color: 'bg-yellow-500' },
  solar: { label: 'Energia Solar', color: 'bg-orange-500' },
  hydraulic: { label: 'Hidráulica', color: 'bg-cyan-500' },
  pool: { label: 'Piscina', color: 'bg-sky-500' },
  additional: { label: 'Adicional', color: 'bg-gray-500' },
} as const

export const CLIENT_TYPE_CONFIG = {
  residential: { label: 'Residencial' },
  commercial: { label: 'Comercial' },
  industrial: { label: 'Industrial' },
} as const

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('pt-BR')
}

export const SERVICE_TYPE_CONFIG = {
  engineering: { label: 'Engenharia', color: 'bg-blue-500', icon: 'HardHat' },
  electrical: { label: 'Elétrica', color: 'bg-yellow-500', icon: 'Zap' },
  hydraulic: { label: 'Hidráulica', color: 'bg-cyan-500', icon: 'Droplets' },
  pool: { label: 'Piscinas', color: 'bg-blue-400', icon: 'Waves' },
  solar: { label: 'Aquecimento Solar', color: 'bg-orange-500', icon: 'Sun' },
} as const

export const USER_ROLE_CONFIG = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700' },
  technician: { label: 'Técnico', color: 'bg-blue-100 text-blue-700' },
  financial: { label: 'Financeiro', color: 'bg-emerald-100 text-emerald-700' },
} as const

export const SERVICE_ORDER_STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'Em Execução', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
} as const

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'Atrasado', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-700' },
} as const

export const PAYMENT_METHOD_CONFIG = {
  pix: { label: 'PIX' },
  credit_card: { label: 'Cartão de Crédito' },
  debit_card: { label: 'Cartão de Débito' },
  cash: { label: 'Dinheiro' },
  bank_slip: { label: 'Boleto' },
} as const
