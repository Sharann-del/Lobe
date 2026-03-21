import type { PageRow, PagesInsert, PagesUpdate } from "./pages";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Matches `@supabase/supabase-js` GenericRelationship (non-empty tuple types for inference). */
type DbRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      pages: {
        Row: PageRow;
        Insert: PagesInsert;
        Update: PagesUpdate;
        Relationships: DbRelationship[];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: DbRelationship[];
      };
      workspaces: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon: string | null;
          icon_type: string;
          cover_url: string | null;
          description: string | null;
          owner_id: string;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          icon?: string | null;
          icon_type?: string;
          cover_url?: string | null;
          description?: string | null;
          owner_id: string;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          icon?: string | null;
          icon_type?: string;
          cover_url?: string | null;
          description?: string | null;
          owner_id?: string;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: DbRelationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      soft_delete_page: {
        Args: { p_page_id: string };
        Returns: unknown;
      };
      restore_page: {
        Args: { p_page_id: string };
        Returns: unknown;
      };
      get_page_tree: {
        Args: { p_workspace_id: string };
        Returns: PageRow[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type PublicSchema = Database["public"];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: "public" },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: "public";
  }
    ? keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: "public" }
  ? (PublicSchema["Tables"] & PublicSchema["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: "public" },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: "public";
  }
    ? keyof PublicSchema["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: "public" }
  ? PublicSchema["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: "public" },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: "public";
  }
    ? keyof PublicSchema["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: "public" }
  ? PublicSchema["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: "public" },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: "public";
  }
    ? keyof PublicSchema["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: "public" }
  ? PublicSchema["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
