import type React from "react";
import type ReactDOM from "react-dom";

export {};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    React: typeof React;
    ReactDOM: typeof ReactDOM;
    VoidrixClient_API: Record<string, unknown>;
  }
}
