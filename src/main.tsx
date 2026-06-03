import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { BudgetProvider } from "./contexts/BudgetContext";
import "leaflet/dist/leaflet.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BudgetProvider>
      <App />
    </BudgetProvider>
  </StrictMode>,
);
