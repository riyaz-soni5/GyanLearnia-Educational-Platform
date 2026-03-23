import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ToastProvider } from "./components/toast";
import { applyTheme, getPreferredTheme } from "./lib/theme";

applyTheme(getPreferredTheme());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
