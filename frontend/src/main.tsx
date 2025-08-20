import { createRoot } from "react-dom/client";
import "./styles/App.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
// import { GoogleOAuthProvider } from "@react-oauth/google";

// const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
import * as amplitude from '@amplitude/analytics-browser';
const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;

amplitude.init(apiKey, {"autocapture":true});


createRoot(document.getElementById("root")!).render(
  // <GoogleOAuthProvider clientId={clientId}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
  // </GoogleOAuthProvider>
);
