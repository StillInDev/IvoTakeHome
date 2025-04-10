import React from "react";

const Mention = ({ color, children }) => {
  return (
    <span className="mention" style={{ backgroundColor: color }}>
      {children}
    </span>
  );
};

export default Mention;
