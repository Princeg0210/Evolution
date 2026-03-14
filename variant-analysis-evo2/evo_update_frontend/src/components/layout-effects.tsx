"use client";

import dynamic from "next/dynamic";

const CustomCursor = dynamic(() => import("./custom-cursor"), {
  ssr: false,
});
const CursorGlow = dynamic(() => import("./cursor-glow"), {
  ssr: false,
});
const BiotechBackground = dynamic(() => import("./biotech-background"), {
  ssr: false,
});

export default function LayoutEffects() {
  return (
    <>
      <BiotechBackground />
      <CursorGlow />
      <CustomCursor />
    </>
  );
}
