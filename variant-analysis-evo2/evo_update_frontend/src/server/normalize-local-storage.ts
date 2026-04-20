if (typeof window === "undefined") {
  const maybeLocalStorage = (globalThis as { localStorage?: unknown })
    .localStorage as
    | {
        getItem?: unknown;
        setItem?: unknown;
        removeItem?: unknown;
        clear?: unknown;
      }
    | undefined;

  if (
    maybeLocalStorage &&
    typeof maybeLocalStorage.getItem !== "function"
  ) {
    (globalThis as any).localStorage = undefined;
  }
}

export {};
