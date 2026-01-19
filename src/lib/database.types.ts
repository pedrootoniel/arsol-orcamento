export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string
          user_id: string
          title: string
          client_name: string
          description: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          client_name?: string
          description?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          client_name?: string
          description?: string
          status?: string
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
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          description: string
          quantity?: number
          unit?: string
          unit_price?: number
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          description?: string
          quantity?: number
          unit?: string
          unit_price?: number
          category?: string
          created_at?: string
        }
      }
    }
  }
}
