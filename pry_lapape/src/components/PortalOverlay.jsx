"use client";

import { createPortal } from "react-dom";

export default function PortalOverlay({ children }) {
  if (typeof document === "undefined") return null;

  return createPortal(children, document.body);
}
