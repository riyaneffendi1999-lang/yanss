export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          balance: number
          channel_kind: string
          channel_name: string
          code: string | null
          created_at: string
          daily_limit: number
          id: string
          online: boolean
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          balance?: number
          channel_kind: string
          channel_name: string
          code?: string | null
          created_at?: string
          daily_limit?: number
          id?: string
          online?: boolean
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          balance?: number
          channel_kind?: string
          channel_name?: string
          code?: string | null
          created_at?: string
          daily_limit?: number
          id?: string
          online?: boolean
          opening_balance?: number
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          account_id: string | null
          admin: string | null
          amount: number
          channel: string
          created_at: string
          created_by: string | null
          date_str: string
          full_name: string
          group_tier: string | null
          id: string
          iso_date: string
          notes: string | null
          sender_account: string | null
          sender_name: string | null
          status: string
          ticket: string
          time_str: string
          updated_at: string
          username: string
        }
        Insert: {
          account_id?: string | null
          admin?: string | null
          amount?: number
          channel: string
          created_at?: string
          created_by?: string | null
          date_str: string
          full_name: string
          group_tier?: string | null
          id?: string
          iso_date: string
          notes?: string | null
          sender_account?: string | null
          sender_name?: string | null
          status?: string
          ticket: string
          time_str: string
          updated_at?: string
          username: string
        }
        Update: {
          account_id?: string | null
          admin?: string | null
          amount?: number
          channel?: string
          created_at?: string
          created_by?: string | null
          date_str?: string
          full_name?: string
          group_tier?: string | null
          id?: string
          iso_date?: string
          notes?: string | null
          sender_account?: string | null
          sender_name?: string | null
          status?: string
          ticket?: string
          time_str?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      gebyar_turnover_entries: {
        Row: {
          claimed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          period_month: number
          period_year: number
          prize_amount: number
          prize_text: string
          status: string
          turnover: number
          username: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_month: number
          period_year: number
          prize_amount?: number
          prize_text?: string
          status?: string
          turnover?: number
          username: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_month?: number
          period_year?: number
          prize_amount?: number
          prize_text?: string
          status?: string
          turnover?: number
          username?: string
        }
        Relationships: []
      }
      kamis_ceria_claims: {
        Row: {
          bonus: number
          created_at: string
          created_by: string | null
          id: string
          iso_date: string
          username: string
        }
        Insert: {
          bonus?: number
          created_at?: string
          created_by?: string | null
          id?: string
          iso_date?: string
          username: string
        }
        Update: {
          bonus?: number
          created_at?: string
          created_by?: string | null
          id?: string
          iso_date?: string
          username?: string
        }
        Relationships: []
      }
      lucky_spin_entries: {
        Row: {
          bonus: number
          created_at: string
          created_by: string | null
          id: string
          iso_date: string | null
          processed_at: string | null
          status: string
          ticket: string
          updated_at: string
          username: string
        }
        Insert: {
          bonus?: number
          created_at?: string
          created_by?: string | null
          id?: string
          iso_date?: string | null
          processed_at?: string | null
          status?: string
          ticket: string
          updated_at?: string
          username?: string
        }
        Update: {
          bonus?: number
          created_at?: string
          created_by?: string | null
          id?: string
          iso_date?: string | null
          processed_at?: string | null
          status?: string
          ticket?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      role_page_access: {
        Row: {
          created_at: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          page_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "cs"
        | "finance"
        | "head"
        | "supervisor"
        | "ast_spv"
        | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "cs",
        "finance",
        "head",
        "supervisor",
        "ast_spv",
        "staff",
      ],
    },
  },
} as const
