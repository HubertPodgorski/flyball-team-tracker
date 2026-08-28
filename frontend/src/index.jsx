import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerServiceWorker } from "./helpers/serviceWorkerHelpers";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // TODO: run on production tho - enable when done with D&D
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

const register = async () => {
  try {
    await registerServiceWorker();
  } catch (error) {
    console.log(error);
  }
};

register();
