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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_history: {
        Row: {
          accessed_at: string
          game_id: string
          id: string
          ip_address: string | null
          session_duration: number | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          game_id: string
          id?: string
          ip_address?: string | null
          session_duration?: number | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          game_id?: string
          id?: string
          ip_address?: string | null
          session_duration?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_webhooks: {
        Row: {
          asaas_event_id: string | null
          created_at: string | null
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json | null
          payment_id: string | null
          processed: boolean | null
          processed_at: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          asaas_event_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          asaas_event_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_webhooks_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_webhooks_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asaas_webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_requests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          game_id: string
          id: string
          request_message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          game_id: string
          id?: string
          request_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          game_id?: string
          id?: string
          request_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_requests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          category: string | null
          checksum: string | null
          cover_image: string | null
          cover_image_local: string | null
          created_at: string | null
          description: string | null
          download_url: string | null
          file_size: number | null
          folder_path: string
          id: string
          installer_type: string | null
          is_active: boolean | null
          minimum_disk_space: number | null
          name: string
          order: number | null
          slug: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: string | null
          checksum?: string | null
          cover_image?: string | null
          cover_image_local?: string | null
          created_at?: string | null
          description?: string | null
          download_url?: string | null
          file_size?: number | null
          folder_path: string
          id?: string
          installer_type?: string | null
          is_active?: boolean | null
          minimum_disk_space?: number | null
          name: string
          order?: number | null
          slug: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string | null
          checksum?: string | null
          cover_image?: string | null
          cover_image_local?: string | null
          created_at?: string | null
          description?: string | null
          download_url?: string | null
          file_size?: number | null
          folder_path?: string
          id?: string
          installer_type?: string | null
          is_active?: boolean | null
          minimum_disk_space?: number | null
          name?: string
          order?: number | null
          slug?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      launcher_sessions: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_heartbeat: string | null
          launcher_version: string | null
          os_info: string | null
          subscription_status_cache: string | null
          token_hash: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_heartbeat?: string | null
          launcher_version?: string | null
          os_info?: string | null
          subscription_status_cache?: string | null
          token_hash: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_heartbeat?: string | null
          launcher_version?: string | null
          os_info?: string | null
          subscription_status_cache?: string | null
          token_hash?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launcher_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_games: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          plan_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          plan_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_games_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          asaas_payment_id: string | null
          asaas_payment_link: string | null
          asaas_subscription_id: string | null
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string | null
          id: string
          last_payment_date: string | null
          last_payment_status: string | null
          next_due_date: string | null
          payment_method: string | null
          plan_value: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asaas_payment_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_status?: string | null
          next_due_date?: string | null
          payment_method?: string | null
          plan_value?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asaas_payment_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          last_payment_date?: string | null
          last_payment_status?: string | null
          next_due_date?: string | null
          payment_method?: string | null
          plan_value?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_access: {
        Row: {
          created_at: string | null
          expires_at: string | null
          game_id: string
          granted_at: string
          granted_by: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          game_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          game_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_access_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          plan_id: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          plan_id: string
          start_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          plan_id?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_code: string | null
          asaas_customer_id: string | null
          created_at: string | null
          email: string
          email_verification_token: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          last_login: string | null
          password: string
          password_hash: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          access_code?: string | null
          asaas_customer_id?: string | null
          created_at?: string | null
          email: string
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login?: string | null
          password: string
          password_hash?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          access_code?: string | null
          asaas_customer_id?: string | null
          created_at?: string | null
          email?: string
          email_verification_token?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login?: string | null
          password?: string
          password_hash?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
