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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_phones: {
        Row: {
          phone: string
        }
        Insert: {
          phone: string
        }
        Update: {
          phone?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          coupon_validity_days: number
          id: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          coupon_validity_days?: number
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          coupon_validity_days?: number
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string
          redeemed_by: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string
          redeemed_by: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: true
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount: number
          expires_at: string
          id: string
          phone: string
          redeemed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount: number
          expires_at: string
          id?: string
          phone: string
          redeemed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount?: number
          expires_at?: string
          id?: string
          phone?: string
          redeemed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean
        }
        Relationships: []
      }
      prizes: {
        Row: {
          discount: number
          id: string
          label: string
          probability: number
          sort_order: number
        }
        Insert: {
          discount: number
          id: string
          label: string
          probability?: number
          sort_order: number
        }
        Update: {
          discount?: number
          id?: string
          label?: string
          probability?: number
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          phone: string
        }
        Insert: {
          created_at?: string
          id: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      spin_history: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount: number
          id: string
          phone: string
          prize_label: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount: number
          id?: string
          phone: string
          prize_label: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount?: number
          id?: string
          phone?: string
          prize_label?: string
          user_id?: string
        }
        Relationships: []
      }
      spins: {
        Row: {
          coupon_id: string | null
          created_at: string
          discount: number
          id: string
          phone: string
          prize_id: string
          prize_label: string
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          discount: number
          id?: string
          phone: string
          prize_id: string
          prize_label: string
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          discount?: number
          id?: string
          phone?: string
          prize_id?: string
          prize_label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spins_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      perform_spin: { Args: never; Returns: Json }
      redeem_coupon: { Args: { _code: string }; Returns: Json }
      reset_spin: { Args: { _user_id: string }; Returns: undefined }
      set_coupon_expiry: {
        Args: { _coupon_id: string; _expires: string }
        Returns: undefined
      }
      update_prize_probabilities: { Args: { _items: Json }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
