import { useState, useCallback, useRef } from "react";

export function useNotice() {
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((msg: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setSessionNotice(msg);
    noticeTimer.current = setTimeout(() => setSessionNotice(null), 2800);
  }, []);

  return { sessionNotice, showNotice };
}
