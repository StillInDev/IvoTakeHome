import React from "react";
import Clause from "./Clause";
import Mention from "./Mention";

let clauseCounter = 1;
let definitionSubCounter = 1;
let insideDefinitions = false;


const Renderer = ({ data }) => {
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
      const isTopLevelDefinition = node.title?.toLowerCase() === "definitions";
      const isSubDefinition = insideDefinitions && node.title?.toLowerCase().includes("definition");

      // Handle entering and leaving definition clauses
      if (isTopLevelDefinition) {
        insideDefinitions = true;
        definitionSubCounter = 1; // reset (a), (b), etc.
      }

      const index = isSubDefinition ? definitionSubCounter++ : clauseCounter++;

      // If it's a definition clause, handle rendering of the definition text
      return (
        <Clause
          key={key}
          index={index}
          isDefinition={isSubDefinition}
        >
          {renderChildren(node.children, marks)}
        </Clause>
      );
    }
    
    if (node.type === "p") {
      // Check for nested paragraphs in the children
      let processedChildren = [...(node.children || [])];
      
      // Handle nested paragraphs - extract their text content
      for (let i = 0; i < processedChildren.length; i++) {
        if (processedChildren[i].type === "p" && processedChildren[i].text) {
          // Replace the nested paragraph with a text node
          processedChildren[i] = { text: processedChildren[i].text };
        }
      }
      
      return <p key={key}>{renderChildren(processedChildren, marks)}</p>;
    }

    if (node.type === "block" && node.title === "Parties") {
      const partyParagraph = node.children?.find((c) => c.type === "p");
      if (!partyParagraph) return null;
    
      const mentions = [];
      const labels = [];
      const rest = [];
    
      let collectingMentions = true;
    
      partyParagraph.children.forEach((child) => {
        if (child.type === "mention" && collectingMentions) {
          mentions.push(child);
        } else if (
          collectingMentions &&
          typeof child.text === "string" &&
          /"[^"]*"/.test(child.text)
        ) {
          labels.push(child);
        } else {
          collectingMentions = false;
          rest.push(child);
        }
      });
    
      return (
        <div key={key}>      
          {mentions.map((mention, i) => (
            <p key={i}>
              {i + 1}.{" "}
              <Mention color={mention.color}>
                {mention.children?.[0]?.text ?? ""}
              </Mention>{" "}
              (<strong>{labels[i]?.text ?? ""}</strong>)
            </p>
          ))}
      
          {/* Remaining lines (e.g., "Each being a 'party'...") */}
          {partyParagraph.children
            .slice(mentions.length + labels.length)
            .map((child, i) => (
              <React.Fragment key={`rest-${i}`}>
                {renderNode(child, i, marks)}
              </React.Fragment>
            ))}
        </div>
      );
    }
    

    if (node.type === "h1") return <h1 key={key}>{renderChildren(node.children, marks)}</h1>;
    if (node.type === "h4") {
      const [first, ...rest] = node.children || [];
    
      return (
        <h4 key={key}>
          {renderNode(first, "h4-title", marks)}
          {rest.length > 0 && (
            <span style={{ fontWeight: "normal", textDecoration: "none" }}>
              {renderChildren(rest, {})}
            </span>
          )}
        </h4>
      );
    }
    
    if (node.type === "ul") return <ul key={key}>{renderChildren(node.children, marks)}</ul>;
    if (node.type === "li") return <li key={key}>{renderChildren(node.children, marks)}</li>;
    if (node.type === "lic") return <span key={key}>{renderChildren(node.children, marks)}</span>;

    if (node.type === "p" || node.type === "block") {
      const isAgreementSection = node.title?.toLowerCase() === "agreement to provide services";
    
      // Check if there are block-level children
      const hasBlockChild = (node.children || []).some((child) =>
        ["h1", "h4", "ul", "ol", "clause"].includes(child.type)
      );
    
      if (isAgreementSection) {
        return hasBlockChild ? (
          <div key={key}>
            {node.children?.map((child, i) => {
              let className = "";
              if (child.bold) className += " bold";
              if (child.underline) className += " underline";
    
              // If the child is a mention, render it with the color
              if (child.type === "mention") {
                return (
                  <span key={i} style={{ backgroundColor: child.color }} className={className}>
                    {renderChildren(child.children, marks)}
                  </span>
                );
              }
    
              // Render normal text
              return (
                <span key={i} className={className}>
                  {child.text}
                </span>
              );
            })}
          </div>
        ) : (
          <p key={key}>
            {node.children?.map((child, i) => {
              let className = "";
              if (child.bold) className += " bold";
              if (child.underline) className += " underline";
    
              // If the child is a mention, render it with the color
              if (child.type === "mention") {
                return (
                  <span key={i} style={{ backgroundColor: child.color }} className={className}>
                    {renderChildren(child.children, marks)}
                  </span>
                );
              }
    
              // Render normal text
              return (
                <span key={i} className={className}>
                  {child.text}
                </span>
              );
            })}
          </p>
        );
      }
    
      // Handle the other nodes outside of the Agreement Section as normal
      return hasBlockChild ? (
        <div key={key}>{renderChildren(node.children, marks)}</div>
      ) : (
        <p key={key}>{renderChildren(node.children, marks)}</p>
      );
    }

    
    

    if (node.text) {
      let className = "";
      if (marks.bold) className += " bold";
      if (marks.underline) className += " underline";
    
      // Only apply line breaks if coming from Parties block rest content
      const lines = node.text.split("\n");
      if (lines.length > 1) {
        return lines.map((line, i) => (
          <React.Fragment key={`${key}-line-${i}`}>
            <span className={className}>{line.trim()}</span>
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      }
    
      return <span key={key} className={className}>{node.text}</span>;
    }
    

    return null;
  };

  return <div>{renderChildren(data?.[0]?.children || [])}</div>;
};

export default Renderer;
