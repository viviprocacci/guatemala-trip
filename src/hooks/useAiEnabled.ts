import { useEffect, useState } from "react";
import { checkAiStatus } from "../services/ai";

export function useAiEnabled() {
  const [enabled, setEnabled] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [exa, setExa] = useState(false);

  useEffect(() => {
    checkAiStatus().then((s) => {
      setEnabled(s.enabled);
      setWebSearch(s.webSearch);
      setExa(Boolean(s.providers?.exa));
    });
  }, []);

  return { enabled, webSearch, exa };
}
