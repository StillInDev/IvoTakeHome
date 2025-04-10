# IvoTakeHome

npm start - to run

To Optimize Further:
1. Memoize the Renderer component: Wrap the Renderer with React.memo to prevent unnecessary re-renders when props haven't changed.
2. Replace global variables with useState: Convert clauseCounter, definitionSubCounter, and insideDefinitions to React state to prevent unexpected behavior during renders and re-renders.
3. Cache processed children results: Implement useMemo for the processedChildren array in the paragraph handling logic to avoid unnecessary processing on every render.
4. Optimize recursive rendering: Use the useCallback hook for the renderNode and renderChildren functions to prevent recreation on each render.
5. Flatten deeply nested conditionals: Simplify the complex nested conditionals in the renderNode function by extracting separate handler functions for each node type to improve code readability and performance.