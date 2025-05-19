import { supabase } from "@/lib/supabase"; // Adjust based on your setup
import { useEffect, useState } from "react";

type SupabaseConstraint<T> = {
  column: keyof T | string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "neq" | "like" | "ilike";
  value: any;
};

const useFetchData = <T>(
  tableName: string,
  constraints: SupabaseConstraint<T>[] = [],
  enableRealtime: boolean = false
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) return;

    const fetchData = async () => {
      let query = supabase.from(tableName).select("*");

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

    // Optional: real-time updates
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
          (payload) => {
            fetchData(); // re-fetch on change
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [tableName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

export default useFetchData;
