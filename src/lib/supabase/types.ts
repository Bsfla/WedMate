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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      budget_allocations: {
        Row: {
          amount: number
          category_id: string
          couple_id: string
        }
        Insert: {
          amount?: number
          category_id: string
          couple_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          couple_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["mid_id"]
          },
          {
            foreignKeyName: "budget_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_major_rollup"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "budget_allocations_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_allocations_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "budget_allocations_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          couple_id: string
          id: string
          note: string | null
          reference_url: string | null
          vendor_candidate: string | null
        }
        Insert: {
          amount?: number
          category_id: string
          couple_id: string
          id?: string
          note?: string | null
          reference_url?: string | null
          vendor_candidate?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          couple_id?: string
          id?: string
          note?: string | null
          reference_url?: string | null
          vendor_candidate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["mid_id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_major_rollup"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "budgets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "budgets_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      categories: {
        Row: {
          couple_id: string
          id: string
          is_archived: boolean
          level: string
          major_key: string | null
          name: string
          parent_id: string | null
          sort_order: number
        }
        Insert: {
          couple_id: string
          id?: string
          is_archived?: boolean
          level: string
          major_key?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number
        }
        Update: {
          couple_id?: string
          id?: string
          is_archived?: boolean
          level?: string
          major_key?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["mid_id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_major_rollup"
            referencedColumns: ["major_id"]
          },
        ]
      }
      couple_invites: {
        Row: {
          code: string
          couple_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          side: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          couple_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          side: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          couple_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          side?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          created_at: string
          display_name: string
          side: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          display_name: string
          side: string
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          display_name?: string
          side?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      couples: {
        Row: {
          avg_gift_amount: number
          created_at: string
          guest_min_guarantee: number
          id: string
          meal_cost_per_head: number
          name: string
          total_budget: number
          wedding_date: string
        }
        Insert: {
          avg_gift_amount?: number
          created_at?: string
          guest_min_guarantee?: number
          id?: string
          meal_cost_per_head?: number
          name: string
          total_budget?: number
          wedding_date: string
        }
        Update: {
          avg_gift_amount?: number
          created_at?: string
          guest_min_guarantee?: number
          id?: string
          meal_cost_per_head?: number
          name?: string
          total_budget?: number
          wedding_date?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          couple_id: string
          created_at: string
          created_by: string | null
          id: string
          is_estimated: boolean | null
          memo: string | null
          payment_method_id: string
          spent_day: number | null
          spent_month: number
          spent_year: number
          stage: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category_id: string
          couple_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_estimated?: boolean | null
          memo?: string | null
          payment_method_id: string
          spent_day?: number | null
          spent_month: number
          spent_year: number
          stage: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          couple_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_estimated?: boolean | null
          memo?: string | null
          payment_method_id?: string
          spent_day?: number | null
          spent_month?: number
          spent_year?: number
          stage?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_budget_lines"
            referencedColumns: ["mid_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_major_rollup"
            referencedColumns: ["major_id"]
          },
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "expenses_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          actual_attend_count: number | null
          companion_count: number
          couple_id: string
          created_at: string
          expected_attend: boolean | null
          gift_amount: number | null
          gift_method: string | null
          id: string
          memo: string | null
          name: string
          repay_done: boolean
          side: string
          sig_close: boolean
          sig_event_attended: boolean
          sig_invite_meeting: boolean
        }
        Insert: {
          actual_attend_count?: number | null
          companion_count?: number
          couple_id: string
          created_at?: string
          expected_attend?: boolean | null
          gift_amount?: number | null
          gift_method?: string | null
          id?: string
          memo?: string | null
          name: string
          repay_done?: boolean
          side: string
          sig_close?: boolean
          sig_event_attended?: boolean
          sig_invite_meeting?: boolean
        }
        Update: {
          actual_attend_count?: number | null
          companion_count?: number
          couple_id?: string
          created_at?: string
          expected_attend?: boolean | null
          gift_amount?: number | null
          gift_method?: string | null
          id?: string
          memo?: string | null
          name?: string
          repay_done?: boolean
          side?: string
          sig_close?: boolean
          sig_event_attended?: boolean
          sig_invite_meeting?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "guests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "guests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          couple_id: string
          id: string
          is_active: boolean
          label: string | null
          method: string
          payer: string
        }
        Insert: {
          couple_id: string
          id?: string
          is_active?: boolean
          label?: string | null
          method: string
          payer: string
        }
        Update: {
          couple_id?: string
          id?: string
          is_active?: boolean
          label?: string | null
          method?: string
          payer?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "payment_methods_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          account_name: string | null
          couple_id: string
          created_at: string
          current_amount: number
          id: string
          label: string
          monthly_amount: number | null
          months: number | null
          target_amount: number
        }
        Insert: {
          account_name?: string | null
          couple_id: string
          created_at?: string
          current_amount?: number
          id?: string
          label: string
          monthly_amount?: number | null
          months?: number | null
          target_amount: number
        }
        Update: {
          account_name?: string | null
          couple_id?: string
          created_at?: string
          current_amount?: number
          id?: string
          label?: string
          monthly_amount?: number | null
          months?: number | null
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "savings_goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
    }
    Views: {
      v_budget_lines: {
        Row: {
          budget_amount: number | null
          category_id: string | null
          confirmed_amount: number | null
          couple_id: string | null
          estimated_amount: number | null
          is_archived: boolean | null
          major_id: string | null
          major_key: string | null
          major_name: string | null
          major_sort: number | null
          mid_id: string | null
          mid_name: string | null
          mid_sort: number | null
          minor_name: string | null
          minor_sort: number | null
          note: string | null
          progress_pct: number | null
          reference_url: string | null
          remaining: number | null
          vendor_candidate: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      v_guest_summary: {
        Row: {
          actual_gift_total: number | null
          actual_headcount: number | null
          couple_id: string | null
          expected_gift_total: number | null
          expected_headcount: number | null
          guarantee_gap: number | null
          guest_min_guarantee: number | null
          net_actual: number | null
          net_expected: number | null
          shortfall_meal_cost: number | null
          wedding_budget_total: number | null
          wedding_confirmed_total: number | null
        }
        Relationships: []
      }
      v_major_rollup: {
        Row: {
          allocated: number | null
          confirmed_amount: number | null
          couple_id: string | null
          detail_total: number | null
          estimated_amount: number | null
          major_id: string | null
          major_key: string | null
          major_name: string | null
          major_sort: number | null
          over_allocation: number | null
          progress_pct: number | null
          remaining: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      v_monthly_timeline: {
        Row: {
          confirmed_amount: number | null
          couple_id: string | null
          estimated_amount: number | null
          spent_month: number | null
          spent_year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_guest_summary"
            referencedColumns: ["couple_id"]
          },
          {
            foreignKeyName: "expenses_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "v_settlement"
            referencedColumns: ["couple_id"]
          },
        ]
      }
      v_settlement: {
        Row: {
          bride_burden: number | null
          bride_paid: number | null
          couple_id: string | null
          couple_total: number | null
          groom_burden: number | null
          groom_paid: number | null
          joint_paid: number | null
          other_paid: number | null
          settle_amount: number | null
          settle_direction: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      active_invite: {
        Args: never
        Returns: {
          code: string
          couple_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          side: string
          used_at: string | null
          used_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "couple_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_couple: {
        Args: {
          p_display_name: string
          p_name: string
          p_side: string
          p_total_budget: number
          p_wedding_date: string
        }
        Returns: string
      }
      create_invite: {
        Args: never
        Returns: {
          code: string
          couple_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          side: string
          used_at: string | null
          used_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "couple_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_couple_id: { Args: never; Returns: string }
      redeem_invite: {
        Args: { p_code: string; p_display_name: string }
        Returns: string
      }
      seed_couple_defaults: {
        Args: { p_couple_id: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
