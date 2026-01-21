export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'client'
export type ClientType = 'residential' | 'commercial' | 'industrial'
export type BudgetStatus = 'draft' | 'sent' | 'revision' | 'approved' | 'rejected' | 'expired'
export type ItemCategory = 'material' | 'labor' | 'equipment' | 'service' | 'electrical' | 'solar' | 'hydraulic' | 'pool' | 'additional'
export type ServiceType = 'engineering' | 'electrical' | 'hydraulic' | 'pool' | 'solar'
export type InternalUserRole = 'admin' | 'technician' | 'financial'
export type ServiceOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentType = 'full' | 'installment' | 'down_payment'
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_slip'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type PhotoType = 'before' | 'during' | 'after'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string
          phone: string
          created_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string
          phone?: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          full_name?: string
          phone?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          admin_id: string
          name: string
          document: string
          email: string
          phone: string
          address: string
          client_type: ClientType
          user_id: string | null
          building_manager: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          name: string
          document?: string
          email?: string
          phone?: string
          address?: string
          client_type?: ClientType
          user_id?: string | null
          building_manager?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          name?: string
          document?: string
          email?: string
          phone?: string
          address?: string
          client_type?: ClientType
          user_id?: string | null
          building_manager?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          title: string
          client_name: string
          description: string
          status: BudgetStatus
          responsible_name: string
          validity_date: string | null
          total_materials: number
          total_labor: number
          total_additional: number
          profit_margin: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          title: string
          client_name?: string
          description?: string
          status?: BudgetStatus
          responsible_name?: string
          validity_date?: string | null
          total_materials?: number
          total_labor?: number
          total_additional?: number
          profit_margin?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          title?: string
          client_name?: string
          description?: string
          status?: BudgetStatus
          responsible_name?: string
          validity_date?: string | null
          total_materials?: number
          total_labor?: number
          total_additional?: number
          profit_margin?: number
          created_at?: string
          updated_at?: string
        }
      }
      budget_items: {
        Row: {
          id: string
          budget_id: string
          description: string
          quantity: number
          unit: string
          unit_price: number
          category: ItemCategory
          technical_specs: Json
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          description: string
          quantity?: number
          unit?: string
          unit_price?: number
          category?: ItemCategory
          technical_specs?: Json
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          description?: string
          quantity?: number
          unit?: string
          unit_price?: number
          category?: ItemCategory
          technical_specs?: Json
          created_at?: string
        }
      }
      budget_comments: {
        Row: {
          id: string
          budget_id: string
          user_id: string
          content: string
          is_admin_reply: boolean
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          user_id: string
          content: string
          is_admin_reply?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          user_id?: string
          content?: string
          is_admin_reply?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type BudgetItem = Database['public']['Tables']['budget_items']['Row']
export type BudgetComment = Database['public']['Tables']['budget_comments']['Row']

export interface InternalUser {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  role: InternalUserRole;
  is_active: boolean;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: string;
  budget_id: string;
  order_number: string;
  client_id: string;
  technician_id: string | null;
  status: ServiceOrderStatus;
  start_date: string | null;
  deadline_date: string | null;
  completion_date: string | null;
  technical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderPhoto {
  id: string;
  service_order_id: string;
  photo_url: string;
  photo_type: PhotoType;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  budget_id: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  installment_number: number | null;
  total_installments: number | null;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: PaymentStatus;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetAttachment {
  id: string;
  budget_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BudgetVersion {
  id: string;
  budget_id: string;
  version_number: number;
  data: Json;
  created_by: string | null;
  created_at: string;
}
