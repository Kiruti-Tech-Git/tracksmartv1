import { supabase } from "@/lib/supabase";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { useEffect, useState } from "react";

type SupabaseConstraint<T> = {
  column: keyof T | string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "neq" | "like" | "ilike";
  value: any;
};

type FetchOptions = {
  constraints?: any[];
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
};

type QueryOptions<T> = {
  constraints?: SupabaseConstraint<T>[];
  orderBy?: { column: keyof T | string; ascending?: boolean };
  limit?: number;
  refreshKey?: number; // Add this
};

const useFetchData = <T>(
  tableName: string,
  { constraints = [], orderBy, limit, refreshKey }: QueryOptions<T> = {},
  enableRealtime = false
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let query: PostgrestFilterBuilder<any, any, any[], string, unknown> =
        supabase.from(tableName).select("*");

      constraints.forEach(({ column, operator, value }) => {
        switch (operator) {
          case "eq":
            query = query.eq(column as string, value);
            break;
          case "gt":
            query = query.gt(column as string, value);
            break;
          case "lt":
            query = query.lt(column as string, value);
            break;
          case "gte":
            query = query.gte(column as string, value);
            break;
          case "lte":
            query = query.lte(column as string, value);
            break;
          case "neq":
            query = query.neq(column as string, value);
            break;
          case "like":
            query = query.like(column as string, value);
            break;
          case "ilike":
            query = query.ilike(column as string, value);
            break;
          default:
            break;
        }
      });

      if (orderBy) {
        query = query.order(orderBy.column as string, {
          ascending: orderBy.ascending ?? true,
        });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setData(data || []);
      setLoading(false);
    };

    fetchData();

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    if (enableRealtime) {
      subscription = supabase
        .channel(`realtime:${tableName}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: tableName,
          },
          () => {
            fetchData();
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [
    tableName,
    JSON.stringify(constraints),
    orderBy?.column,
    orderBy?.ascending,
    limit,
    refreshKey,
  ]); // 👈 include refreshKey

  return { data, loading, error };
};

export default useFetchData;
