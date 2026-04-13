import { useEffect } from "react";
import { useTradeStore } from "@/store/tradeStore";
import { API } from "@/utils";

export function useHydrateTrades(accessToken: string | null) {
  const setTradesBulk = useTradeStore((s) => s.setTradesBulk);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      const res = await API.get(`${import.meta.env.VITE_API_URL}/api/trades`);
      setTradesBulk(res.data);
    };

    load();
  }, [accessToken]);
}
