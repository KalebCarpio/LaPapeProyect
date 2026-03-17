// src/components/ContentsquareTag.jsx
"use client";

import { useEffect } from "react";

export default function ContentsquareTag() {
  useEffect(() => {
    // Si ya existe, no lo duplicamos
    if (document.getElementById("contentsquare-tag")) return;

    const script = document.createElement("script");
    script.id = "contentsquare-tag";
    script.src = "https://t.contentsquare.net/uxa/f56a36a847b7.js"; // 👈 TU URL
    script.async = true;

    document.head.appendChild(script);
  }, []);

  return null; // No muestra nada en pantalla
}
