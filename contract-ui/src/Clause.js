import React from "react";

const Clause = ({ index, children, isDefinition }) => {
  const label = isDefinition
    ? `(${String.fromCharCode(96 + index)})`  // (a), (b), (c)
    : `${index}.`;  // regular numbered clauses like 1., 2., 3.

  return (
    <div className={`clause ${isDefinition ? 'definition-clause' : ''}`}>
      <div className="clause-number">{label}</div>
      <div className="clause-body">{children}</div>
    </div>
  );
};



export default Clause;
