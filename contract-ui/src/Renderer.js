import React from "react";
import Clause from "./Clause";
import Mention from "./Mention";

// Global counters and state variables used for numbering sections
// clauseCounter: Tracks the sequential numbering of regular clauses (1, 2, 3...)
// definitionSubCounter: Tracks the alphabetical lettering of definition subclauses ((a), (b), (c)...)
// insideDefinitions: Flags when we're rendering inside a definitions section to modify rendering behavior
let clauseCounter = 1;
let definitionSubCounter = 1;
let insideDefinitions = false;


/**
 * Renderer component - The main component responsible for transforming the JSON contract data
 * into React elements. Uses a recursive approach to handle nested document structure.
 * 
 * @param {Object} data - The JSON data representing the contract document structure
 */
const Renderer = ({ data }) => {
  /**
   * Processes an array of child nodes and renders them recursively
   * Maintains formatting marks from parent to children (e.g., bold, underline)
   * 
   * @param {Array} children - Array of child nodes to render
   * @param {Object} parentMarks - Formatting marks inherited from parent nodes
   * @returns {Array} - Array of rendered React elements
   */
  const renderChildren = (children, parentMarks = {}) => {
    if (!children || !Array.isArray(children)) return null;
    return children.map((child, i) => renderNode(child, i, parentMarks));
  };

  /**
   * Core rendering function that processes a single node in the document tree
   * Different node types (mention, clause, paragraph, etc.) are handled with specific logic
   * 
   * @param {Object} node - The node to render
   * @param {number|string} key - React key for the element
   * @param {Object} parentMarks - Formatting marks inherited from parent nodes
   * @returns {React.Element} - The rendered React element
   */
  const renderNode = (node, key, parentMarks = {}) => {
    // Inherit formatting marks from parent and apply node's own marks
    const marks = { ...parentMarks };
    if (node.bold) marks.bold = true;
    if (node.underline) marks.underline = true;

    // Handle mention nodes - special highlighted fields with dynamic values
    if (node.type === "mention") {
      return (
        <Mention key={key} color={node.color}>
          {renderChildren(node.children, marks)}
        </Mention>
      );
    }    

    // Handle clause nodes - numbered or lettered sections with specific formatting
    if (node.type === "clause") {
      // Determine if this is a top-level "Definitions" section or a sub-definition
      const isTopLevelDefinition = node.title?.toLowerCase() === "definitions";
      const isSubDefinition = insideDefinitions && node.title?.toLowerCase().includes("definition");

      // Set state and reset counters when entering definitions section
      if (isTopLevelDefinition) {
        insideDefinitions = true;
        definitionSubCounter = 1; // reset (a), (b), etc.
      }

      // Determine the correct numbering based on clause type
      const index = isSubDefinition ? definitionSubCounter++ : clauseCounter++;

      // Render the clause with appropriate numbering and formatting
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
    
    // Handle paragraph and block nodes with special processing for nested structure
    if (node.type === "p" || node.type === "block") {
      // Process any nested paragraphs by flattening the structure
      // This handles a common issue in the input JSON where paragraphs are nested incorrectly
      let processedChildren = [...(node.children || [])];
      for (let i = 0; i < processedChildren.length; i++) {
        if (processedChildren[i].type === "p" && processedChildren[i].text) {
          // Replace the nested paragraph with a simple text node to avoid nesting issues
          processedChildren[i] = { text: processedChildren[i].text };
        }
      }

      // Special handling for the "Agreement to Provide Services" section
      const isAgreementSection = node.title?.toLowerCase() === "agreement to provide services";
    
      // Determine if this block contains other block-level elements that need special handling
      const hasBlockChild = (processedChildren || []).some((child) =>
        ["h1", "h4", "ul", "ol", "clause"].includes(child.type)
      );
    
      // Special formatting for Agreement Section with custom rendering for children
      if (isAgreementSection) {
        // Different rendering based on whether it contains block elements
        return hasBlockChild ? (
          <div key={key}>
            {processedChildren?.map((child, i) => {
              // Apply formatting classes
              let className = "";
              if (child.bold) className += " bold";
              if (child.underline) className += " underline";
    
              // Special handling for mentions in Agreement Section
              if (child.type === "mention") {
                return (
                  <span key={i} style={{ backgroundColor: child.color }} className={className}>
                    {renderChildren(child.children, marks)}
                  </span>
                );
              }
    
              // Render regular text with appropriate formatting
              return (
                <span key={i} className={className}>
                  {child.text}
                </span>
              );
            })}
          </div>
        ) : (
          // For non-block children, wrap in a paragraph
          <p key={key}>
            {processedChildren?.map((child, i) => {
              // Apply formatting classes
              let className = "";
              if (child.bold) className += " bold";
              if (child.underline) className += " underline";
    
              // Special handling for mentions in Agreement Section
              if (child.type === "mention") {
                return (
                  <span key={i} style={{ backgroundColor: child.color }} className={className}>
                    {renderChildren(child.children, marks)}
                  </span>
                );
              }
    
              // Render regular text with appropriate formatting
              return (
                <span key={i} className={className}>
                  {child.text}
                </span>
              );
            })}
          </p>
        );
      }
    
      // Default handling for paragraphs and blocks not in special sections
      return hasBlockChild ? (
        <div key={key}>{renderChildren(processedChildren, marks)}</div>
      ) : (
        <p key={key}>{renderChildren(processedChildren, marks)}</p>
      );
    }

    // Special handling for the Parties block with custom formatting
    if (node.type === "block" && node.title === "Parties") {
      // Find the paragraph in the Parties block that contains party information
      const partyParagraph = node.children?.find((c) => c.type === "p");
      if (!partyParagraph) return null;
    
      // Arrays to organize different parts of the parties section
      const mentions = []; // Company/party names
      const labels = []; // The labels like "Provider", "Client"
      const rest = []; // Additional text after the party listings
    
      // Flag to track while we're collecting the parties information
      let collectingMentions = true;
    
      // Process each child to categorize it appropriately
      partyParagraph.children.forEach((child) => {
        if (child.type === "mention" && collectingMentions) {
          // Company/party names
          mentions.push(child);
        } else if (
          collectingMentions &&
          typeof child.text === "string" &&
          /"[^"]*"/.test(child.text) // Look for quoted text like "Provider"
        ) {
          // Party labels
          labels.push(child);
        } else {
          // Once we're done with party names and labels, collect the rest
          collectingMentions = false;
          rest.push(child);
        }
      });
    
      // Render the Parties section with custom formatting
      return (
        <div key={key}>      
          {/* Render each party as a numbered item with label */}
          {mentions.map((mention, i) => (
            <p key={i}>
              {i + 1}.{" "}
              <Mention color={mention.color}>
                {mention.children?.[0]?.text ?? ""}
              </Mention>{" "}
              (<strong>{labels[i]?.text ?? ""}</strong>)
            </p>
          ))}
      
          {/* Render the remaining text (e.g., "Each being a 'party'...") */}
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
    
    // Handle headings with different levels
    if (node.type === "h1") return <h1 key={key}>{renderChildren(node.children, marks)}</h1>;
    
    // Special handling for h4 headers to separate the title from the description
    if (node.type === "h4") {
      // Split the heading into the title part and the rest (description)
      const [first, ...rest] = node.children || [];
    
      return (
        <h4 key={key}>
          {/* Render the title part with full formatting */}
          {renderNode(first, "h4-title", marks)}
          {/* Render the description part with normal formatting */}
          {rest.length > 0 && (
            <span style={{ fontWeight: "normal", textDecoration: "none" }}>
              {renderChildren(rest, {})}
            </span>
          )}
        </h4>
      );
    }
    
    // Handle list elements - unordered lists, list items, and list item content
    if (node.type === "ul") return <ul key={key}>{renderChildren(node.children, marks)}</ul>;
    if (node.type === "li") return <li key={key}>{renderChildren(node.children, marks)}</li>;
    if (node.type === "lic") return <span key={key}>{renderChildren(node.children, marks)}</span>;

    // Handle text nodes with formatting and line breaks
    if (node.text) {
      // Apply formatting classes from marks
      let className = "";
      if (marks.bold) className += " bold";
      if (marks.underline) className += " underline";
    
      // Handle multi-line text by splitting and adding line breaks
      const lines = node.text.split("\n");
      if (lines.length > 1) {
        return lines.map((line, i) => (
          <React.Fragment key={`${key}-line-${i}`}>
            <span className={className}>{line.trim()}</span>
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      }
    
      // Simple single-line text
      return <span key={key} className={className}>{node.text}</span>;
    }
    
    // Return null for unhandled node types
    return null;
  };

  // Render the entire document by starting with the top-level children
  return <div>{renderChildren(data?.[0]?.children || [])}</div>;
};

export default Renderer;
