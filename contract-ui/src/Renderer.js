import React from "react";
import Clause from "./Clause";
import Mention from "./Mention";

let clauseCounter = 1;

const Renderer = ({ data }) => {
  console.log("Renderer received data:", data);
  console.log("Top-level children:", data?.[0]?.children);

  const renderChildren = (children, parentMarks = {}) => {
    if (!children || !Array.isArray(children)) return null;
    return children.map((child, i) => renderNode(child, i, parentMarks));
  };

  const renderNode = (node, key, parentMarks = {}) => {
    const marks = { ...parentMarks };
    if (node.bold) marks.bold = true;
    if (node.underline) marks.underline = true;

    if (node.type === "mention") {
      return (
        <Mention key={key} color={node.color}>
          {renderChildren(node.children, marks)}
        </Mention>
      );
    }

    if (node.type === "clause") {
      return (
        <Clause key={key} index={clauseCounter++}>
          {renderChildren(node.children, marks)}
        </Clause>
      );
    }

    if (node.type === "h1") return <h1 key={key}>{renderChildren(node.children, marks)}</h1>;
    if (node.type === "h4") return <h4 key={key}>{renderChildren(node.children, marks)}</h4>;
    if (node.type === "ul") return <ul key={key}>{renderChildren(node.children, marks)}</ul>;
    if (node.type === "li") return <li key={key}>{renderChildren(node.children, marks)}</li>;
    if (node.type === "lic") return <span key={key}>{renderChildren(node.children, marks)}</span>;
    if (node.type === "p" || node.type === "block") return <p key={key}>{renderChildren(node.children, marks)}</p>;

    if (node.text) {
      let className = "";
      if (marks.bold) className += " bold";
      if (marks.underline) className += " underline";
      return (
        <span key={key} className={className}>
          {node.text}
        </span>
      );
    }

    return null;
  };

  return <div>{renderChildren(data?.[0]?.children || [])}</div>;
};

export default Renderer;
