import React from "react";
import Renderer from "./Renderer";
import data from "./input.json";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Renderer data={data} />
    </div>
  );
}

export default App;
