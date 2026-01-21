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
