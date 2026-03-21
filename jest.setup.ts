import "@testing-library/jest-dom";

// Guards are needed because some test files run in node environment (no window).
if (typeof window !== "undefined") {
  // jsdom doesn't implement window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // jsdom doesn't implement ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // jsdom logs when app code calls location.assign. Errors come from jsdom's realm, so
  // `instanceof Error` is often false in Jest — match on message text instead.
  const navigationNotImplemented = /not implemented: navigation/i;
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]): void => {
    const shouldSuppress = args.some((arg) => {
      if (typeof arg === "string") {
        return navigationNotImplemented.test(arg);
      }
      if (
        typeof arg === "object" &&
        arg !== null &&
        "message" in arg &&
        typeof (arg as { message: unknown }).message === "string"
      ) {
        return navigationNotImplemented.test(
          (arg as { message: string }).message
        );
      }
      return false;
    });
    if (shouldSuppress) {
      return;
    }
    originalConsoleError.apply(console, args as Parameters<typeof console.error>);
  };
}
