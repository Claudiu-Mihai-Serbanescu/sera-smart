import { useEffect, useState } from "react";

export default function useWindowWidth(initial = 1200) {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : initial
  );
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}
