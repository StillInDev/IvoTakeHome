import React from "react";

const Clause = ({ index, children }) => {
  return (
    <div className="clause">
      <div className="clause-number">{index}.</div>
      <div className="clause-body">{children}</div>
    </div>
  );
};

export default Clause;
