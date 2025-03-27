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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          location: string | null
          professional_summary: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          location?: string | null
          professional_summary?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          location?: string | null
          professional_summary?: string | null
          updated_at?: string | null
        }
      }
      cover_letters: {
        Row: {
          id: string
          user_id: string
          job_description: string
          content: string
          tone: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_description: string
          content: string
          tone: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_description?: string
          content?: string
          tone?: string
          created_at?: string
        }
      }
      exports: {
        Row: {
          id: string
          user_id: string
          format: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          format: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          format?: string
          created_at?: string
        }
      }
      job_analyses: {
        Row: {
          id: string
          user_id: string
          content: string
          analysis: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          analysis: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          analysis?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}