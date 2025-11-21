# Mixed Notes Examples

This document demonstrates how the mixed notes feature works with various combinations of inline and detailed notes.

## Requirements Covered

- **Requirement 5.3**: Support for nodes with both inline and detailed notes
- **Requirement 6.3**: Simultaneous handling of both note types

## Basic Examples

### Example 1: Both Inline and Detailed Notes

**Markdown Input:**
```markdown
- JavaScript Basics: Core concepts and syntax
  > JavaScript is a high-level programming language.
  > It supports multiple paradigms including OOP and functional programming.
  - Variables
  - Functions
```

**Parsed Result:**
- Main Content: "JavaScript Basics"
- Inline Note: "Core concepts and syntax"
- Detailed Note: "JavaScript is a high-level programming language.\nIt supports multiple paradigms including OOP and functional programming."
- Children: ["Variables", "Functions"]

### Example 2: Only Inline Note

**Markdown Input:**
```markdown
- React Components: Building blocks of React apps
  - Functional Components
  - Class Components
```

**Parsed Result:**
- Main Content: "React Components"
- Inline Note: "Building blocks of React apps"
- Detailed Note: undefined
- Children: ["Functional Components", "Class Components"]

### Example 3: Only Detailed Note

**Markdown Input:**
```markdown
- TypeScript
  > TypeScript is a typed superset of JavaScript.
  > It compiles to plain JavaScript.
  - Types
  - Interfaces
```

**Parsed Result:**
- Main Content: "TypeScript"
- Inline Note: undefined
- Detailed Note: "TypeScript is a typed superset of JavaScript.\nIt compiles to plain JavaScript."
- Children: ["Types", "Interfaces"]

### Example 4: Neither Note Type

**Markdown Input:**
```markdown
- Programming Languages
  - JavaScript
  - Python
  - Java
```

**Parsed Result:**
- Main Content: "Programming Languages"
- Inline Note: undefined
- Detailed Note: undefined
- Children: ["JavaScript", "Python", "Java"]

## Advanced Examples

### Example 5: Escaped Separators with Both Note Types

**Markdown Input:**
```markdown
- CSS Grid\: Layout: Modern layout system
  > CSS Grid is a two-dimensional layout system.
  > It allows you to create complex layouts easily.
  - Grid Container
  - Grid Items
```

**Parsed Result:**
- Main Content: "CSS Grid: Layout"
- Inline Note: "Modern layout system"
- Detailed Note: "CSS Grid is a two-dimensional layout system.\nIt allows you to create complex layouts easily."
- Children: ["Grid Container", "Grid Items"]

### Example 6: Multiple Colons in Inline Note with Detailed Note

**Markdown Input:**
```markdown
- API Design: REST: GET: POST: PUT
  > RESTful APIs use HTTP methods for CRUD operations.
  - GET Requests
  - POST Requests
```

**Parsed Result:**
- Main Content: "API Design"
- Inline Note: "REST: GET: POST: PUT"
- Detailed Note: "RESTful APIs use HTTP methods for CRUD operations."
- Children: ["GET Requests", "POST Requests"]

### Example 7: Empty Inline Note with Detailed Note

**Markdown Input:**
```markdown
- Database Concepts:
  > Databases store and organize data.
  > They support queries and transactions.
  - SQL
  - NoSQL
```

**Parsed Result:**
- Main Content: "Database Concepts"
- Inline Note: ""
- Detailed Note: "Databases store and organize data.\nThey support queries and transactions."
- Children: ["SQL", "NoSQL"]

### Example 8: Detailed Note with Formatting and Inline Note

**Markdown Input:**
```markdown
- Git Workflow: Version control basics
  > Git is a **distributed** version control system.
  > It tracks *changes* in source code.
  - Commits
  - Branches
```

**Parsed Result:**
- Main Content: "Git Workflow"
- Inline Note: "Version control basics"
- Detailed Note: "Git is a distributed version control system.\nIt tracks changes in source code."
- Children: ["Commits", "Branches"]

## Custom Separators

### Example 9: Custom Note Separator

**Markdown Input (with '|' as separator):**
```markdown
- Node.js | Server-side JavaScript
  > Node.js is a JavaScript runtime built on Chrome's V8 engine.
  - Event Loop
  - Modules
```

**Parsed Result (with noteSeparator='|'):**
- Main Content: "Node.js"
- Inline Note: "Server-side JavaScript"
- Detailed Note: "Node.js is a JavaScript runtime built on Chrome's V8 engine."
- Children: ["Event Loop", "Modules"]

### Example 10: Custom Note Block Marker

**Markdown Input (with custom aside tag):**
```markdown
- Docker: Containerization platform
  <aside>Docker packages applications into containers.</aside>
  - Images
  - Containers
```

**Parsed Result (with noteBlockMarker='aside'):**
- Main Content: "Docker"
- Inline Note: "Containerization platform"
- Detailed Note: "Docker packages applications into containers."
- Children: ["Images", "Containers"]

## Edge Cases

### Example 11: Empty Detailed Note with Inline Note

**Markdown Input:**
```markdown
- Topic: Short note
  >
  - Child 1
```

**Parsed Result:**
- Main Content: "Topic"
- Inline Note: "Short note"
- Detailed Note: ""
- Children: ["Child 1"]

### Example 12: Whitespace Handling

**Markdown Input:**
```markdown
-   Main Content  :  Inline Note  
  >   Detailed Note with spaces   
  - Child
```

**Parsed Result:**
- Main Content: "Main Content"
- Inline Note: "Inline Note"
- Detailed Note: "Detailed Note with spaces"
- Children: ["Child"]

## Implementation Notes

The `parseMixedNotes` function:

1. **First** parses the inline note from the content using `parseInlineNote`
2. **Then** parses the detailed note from the children using `parseDetailedNote`
3. **Finally** combines the results and returns:
   - `mainContent`: The main text (with escape characters removed)
   - `inlineNote`: The inline note (if present)
   - `detailedNote`: The detailed note (if present)
   - `children`: The filtered children array (with blockquote nodes removed)

This approach ensures that both note types are handled independently and correctly, even when they appear together in the same node.
