export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          subscription_tier: string | null
          preferences: Json | null
          last_analysis_date: string | null
          analysis_count: number | null
          favorite_stocks: string[] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          subscription_tier?: string | null
          preferences?: Json | null
          last_analysis_date?: string | null
          analysis_count?: number | null
          favorite_stocks?: string[] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          subscription_tier?: string | null
          preferences?: Json | null
          last_analysis_date?: string | null
          analysis_count?: number | null
          favorite_stocks?: string[] | null
        }
        Relationships: []
      }
      stock_analyses: {
        Row: {
          analysis_data: Json | null
          created_at: string
          id: string
          stock_symbol: string
          user_id: string
          analysis_type: string | null
          exchange: string | null
          period_days: number | null
          interval: string | null
          overall_signal: string | null
          confidence_score: number | null
          risk_level: string | null
          current_price: number | null
          price_change_percentage: number | null
          sector: string | null
          analysis_quality: string | null
          mathematical_validation: boolean | null
          chart_paths: Json | null
          metadata: Json | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          id?: string
          stock_symbol: string
          user_id: string
          analysis_type?: string | null
          exchange?: string | null
          period_days?: number | null
          interval?: string | null
          overall_signal?: string | null
          confidence_score?: number | null
          risk_level?: string | null
          current_price?: number | null
          price_change_percentage?: number | null
          sector?: string | null
          analysis_quality?: string | null
          mathematical_validation?: boolean | null
          chart_paths?: Json | null
          metadata?: Json | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          id?: string
          stock_symbol?: string
          user_id?: string
          analysis_type?: string | null
          exchange?: string | null
          period_days?: number | null
          interval?: string | null
          overall_signal?: string | null
          confidence_score?: number | null
          risk_level?: string | null
          current_price?: number | null
          price_change_percentage?: number | null
          sector?: string | null
          analysis_quality?: string | null
          mathematical_validation?: boolean | null
          chart_paths?: Json | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      technical_indicators: {
        Row: {
          id: string
          analysis_id: string
          indicator_type: string
          indicator_name: string
          value: number | null
          signal: string | null
          strength: number | null
          timestamp: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          indicator_type: string
          indicator_name: string
          value?: number | null
          signal?: string | null
          strength?: number | null
          timestamp?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          indicator_type?: string
          indicator_name?: string
          value?: number | null
          signal?: string | null
          strength?: number | null
          timestamp?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_indicators_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      sector_benchmarking: {
        Row: {
          id: string
          analysis_id: string
          sector: string
          sector_index: string | null
          beta: number | null
          correlation: number | null
          sharpe_ratio: number | null
          volatility: number | null
          max_drawdown: number | null
          cumulative_return: number | null
          annualized_return: number | null
          sector_beta: number | null
          sector_correlation: number | null
          sector_sharpe_ratio: number | null
          sector_volatility: number | null
          sector_max_drawdown: number | null
          sector_cumulative_return: number | null
          sector_annualized_return: number | null
          excess_return: number | null
          sector_excess_return: number | null
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          sector: string
          sector_index?: string | null
          beta?: number | null
          correlation?: number | null
          sharpe_ratio?: number | null
          volatility?: number | null
          max_drawdown?: number | null
          cumulative_return?: number | null
          annualized_return?: number | null
          sector_beta?: number | null
          sector_correlation?: number | null
          sector_sharpe_ratio?: number | null
          sector_volatility?: number | null
          sector_max_drawdown?: number | null
          sector_cumulative_return?: number | null
          sector_annualized_return?: number | null
          excess_return?: number | null
          sector_excess_return?: number | null
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          sector?: string
          sector_index?: string | null
          beta?: number | null
          correlation?: number | null
          sharpe_ratio?: number | null
          volatility?: number | null
          max_drawdown?: number | null
          cumulative_return?: number | null
          annualized_return?: number | null
          sector_beta?: number | null
          sector_correlation?: number | null
          sector_sharpe_ratio?: number | null
          sector_volatility?: number | null
          sector_max_drawdown?: number | null
          sector_cumulative_return?: number | null
          sector_annualized_return?: number | null
          excess_return?: number | null
          sector_excess_return?: number | null
          timestamp?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_benchmarking_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      pattern_recognition: {
        Row: {
          id: string
          analysis_id: string
          pattern_type: string
          pattern_name: string
          confidence: number | null
          direction: string | null
          start_date: string | null
          end_date: string | null
          start_price: number | null
          end_price: number | null
          target_price: number | null
          stop_loss: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          pattern_type: string
          pattern_name: string
          confidence?: number | null
          direction?: string | null
          start_date?: string | null
          end_date?: string | null
          start_price?: number | null
          end_price?: number | null
          target_price?: number | null
          stop_loss?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          pattern_type?: string
          pattern_name?: string
          confidence?: number | null
          direction?: string | null
          start_date?: string | null
          end_date?: string | null
          start_price?: number | null
          end_price?: number | null
          target_price?: number | null
          stop_loss?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_recognition_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      risk_management: {
        Row: {
          id: string
          analysis_id: string
          risk_type: string
          risk_level: string
          risk_score: number | null
          description: string | null
          mitigation_strategy: string | null
          stop_loss_level: number | null
          take_profit_level: number | null
          position_size_recommendation: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          risk_type: string
          risk_level: string
          risk_score?: number | null
          description?: string | null
          mitigation_strategy?: string | null
          stop_loss_level?: number | null
          take_profit_level?: number | null
          position_size_recommendation?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          risk_type?: string
          risk_level?: string
          risk_score?: number | null
          description?: string | null
          mitigation_strategy?: string | null
          stop_loss_level?: number | null
          take_profit_level?: number | null
          position_size_recommendation?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_management_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      trading_levels: {
        Row: {
          id: string
          analysis_id: string
          level_type: string
          price_level: number
          strength: number | null
          volume_confirmation: boolean | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          level_type: string
          price_level: number
          strength?: number | null
          volume_confirmation?: boolean | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          level_type?: string
          price_level?: number
          strength?: number | null
          volume_confirmation?: boolean | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_levels_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      multi_timeframe_analysis: {
        Row: {
          id: string
          analysis_id: string
          timeframe: string
          signal: string | null
          confidence: number | null
          bias: string | null
          entry_range_min: number | null
          entry_range_max: number | null
          target_1: number | null
          target_2: number | null
          stop_loss: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          timeframe: string
          signal?: string | null
          confidence?: number | null
          bias?: string | null
          entry_range_min?: number | null
          entry_range_max?: number | null
          target_1?: number | null
          target_2?: number | null
          stop_loss?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          timeframe?: string
          signal?: string | null
          confidence?: number | null
          bias?: string | null
          entry_range_min?: number | null
          entry_range_max?: number | null
          target_1?: number | null
          target_2?: number | null
          stop_loss?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "multi_timeframe_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
      volume_analysis: {
        Row: {
          id: string
          analysis_id: string
          volume_type: string
          date: string | null
          volume: number | null
          price: number | null
          significance: number | null
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          volume_type: string
          date?: string | null
          volume?: number | null
          price?: number | null
          significance?: number | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          volume_type?: string
          date?: string | null
          volume?: number | null
          price?: number | null
          significance?: number | null
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volume_analysis_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "stock_analyses"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      analysis_summary_view: {
        Row: {
          id: string | null
          stock_symbol: string | null
          user_id: string | null
          overall_signal: string | null
          confidence_score: number | null
          risk_level: string | null
          current_price: number | null
          price_change_percentage: number | null
          sector: string | null
          analysis_type: string | null
          created_at: string | null
          user_name: string | null
          user_email: string | null
        }
        Relationships: []
      }
      sector_performance_view: {
        Row: {
          sector: string | null
          analysis_count: number | null
          avg_confidence: number | null
          avg_price_change: number | null
          bullish_count: number | null
          bearish_count: number | null
          neutral_count: number | null
          last_analysis: string | null
        }
        Relationships: []
      }
      user_analysis_history_view: {
        Row: {
          user_id: string | null
          full_name: string | null
          email: string | null
          total_analyses: number | null
          unique_stocks: number | null
          avg_confidence: number | null
          last_analysis: string | null
          sectors_analyzed: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_analyses: {
        Args: {
          days_to_keep?: number
        }
        Returns: number
      }
      extract_pattern_recognition: {
        Args: {
          analysis_id: string
        }
        Returns: undefined
      }
      extract_sector_benchmarking: {
        Args: {
          analysis_id: string
        }
        Returns: undefined
      }
      extract_technical_indicators: {
        Args: {
          analysis_id: string
        }
        Returns: undefined
      }
      extract_trading_levels: {
        Args: {
          analysis_id: string
        }
        Returns: undefined
      }
      extract_volume_analysis: {
        Args: {
          analysis_id: string
        }
        Returns: undefined
      }
      get_analysis_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_analyses: number
          total_users: number
          avg_confidence: number
          most_analyzed_sector: string
          most_analyzed_stock: string
        }[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    // No enums defined for this Supabase schema
    Enums: {},
  },
} as const
