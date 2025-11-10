# Format Handler Implementation Guide

This guide explains how to add support for new document formats to AegisRedact. By following these steps, you can extend the application to handle additional file types while maintaining consistency and security.

## Overview

AegisRedact uses a **format abstraction layer** that provides a unified interface for working with different document types. Each format is implemented as a class extending `DocumentFormat` and registered with the `FormatRegistry`.

### Architecture Principles

1. **Separation of Concerns**: Format handlers contain no UI logic
2. **Lazy Loading**: Handlers are only imported when first used
3. **Security First**: All formats must support secure redaction
4. **Test-Driven**: Every handler must have comprehensive unit tests
5. **TypeScript Strict**: Full type safety with no `any` types

---

## Quick Start

### Step 1: Create Format Class

Create a new file in the appropriate directory:
- Text formats → `src/lib/formats/text/`
- Structured data → `src/lib/formats/structured/`
- Office documents → `src/lib/formats/office/`
- Rich text → `src/lib/formats/rich/`
- Other → `src/lib/formats/other/`

```typescript
// src/lib/formats/text/MyFormat.ts
import { DocumentFormat } from '../base/DocumentFormat';
import type {
  BoundingBox,
  Document,
  DocumentMetadata,
  RenderOptions,
  ExportOptions,
  TextExtractionResult,
  FormatCapabilities
} from '../base/types';

export class MyFormat extends DocumentFormat {
  readonly formatId = 'myformat';
  readonly formatName = 'My Format';
  readonly supportedExtensions = ['myext'];
  readonly mimeTypes = ['application/x-myformat'];

  readonly capabilities: FormatCapabilities = {
    canRenderToCanvas: false,
    canRenderToDOM: true,
    supportsMultiPage: false,
    supportsTextExtraction: true,
    requiresOCR: false,
    supportsDirectExport: true,
    requiresFlattening: false,
    supportedExportFormats: ['myext', 'text']
  };

  async load(file: File): Promise<Document> {
    // Implementation here
  }

  async render(doc: Document, options: RenderOptions): Promise<void> {
    // Implementation here
  }

  async extractText(doc: Document, page?: number): Promise<TextExtractionResult> {
    // Implementation here
  }

  async findTextBoxes(doc: Document, terms: string[], page?: number): Promise<BoundingBox[]> {
    // Implementation here
  }

  async redact(doc: Document, boxes: BoundingBox[]): Promise<void> {
    // Implementation here
  }

  async export(doc: Document, options?: ExportOptions): Promise<Blob> {
    // Implementation here
  }

  cleanup(): void {
    // Implementation here
  }
}
```

### Step 2: Register Format

Add your format to `FormatRegistry.initialize()`:

```typescript
// src/lib/formats/base/FormatRegistry.ts
private static async initialize(): Promise<void> {
  if (this.initialized) return;

  // Existing registrations...

  // Add your format
  const { MyFormat } = await import('../text/MyFormat');
  this.register('myformat', () => new MyFormat());

  this.initialized = true;
}
```

### Step 3: Add Type Mappings

Update `src/lib/formats/base/types.ts`:

```typescript
export const MIME_TYPES: Record<string, string> = {
  // Existing types...
  'application/x-myformat': 'myformat',
};

export const FILE_EXTENSIONS: Record<string, string> = {
  // Existing extensions...
  'myext': 'myformat',
};
```

### Step 4: Create Tests

Create comprehensive unit tests in `tests/unit/formats/`:

```typescript
// tests/unit/formats/text/MyFormat.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyFormat } from '../../../../src/lib/formats/text/MyFormat';

describe('MyFormat', () => {
  let format: MyFormat;

  beforeEach(() => {
    format = new MyFormat();
  });

  describe('load', () => {
    it('should load a file', async () => {
      const file = new File(['content'], 'test.myext');
      const doc = await format.load(file);

      expect(doc.metadata.fileName).toBe('test.myext');
      expect(doc.metadata.format).toBe('myformat');
    });
  });

  // More tests...
});
```

---

## Detailed Implementation

### Method: `load(file: File)`

**Purpose:** Parse the file and create internal document representation.

**Returns:** `Document` object containing:
- `metadata`: File info and format-specific properties
- `content`: Internal representation (format-specific)
- `boxes`: Empty array initially
- `rendered`: `false`
- `modified`: `false`

**Example:**
```typescript
async load(file: File): Promise<Document> {
  // 1. Read file
  const arrayBuffer = await file.arrayBuffer();

  // 2. Parse format-specific structure
  const parsed = parseMyFormat(arrayBuffer);

  // 3. Create metadata
  const metadata: DocumentMetadata = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/x-myformat',
    format: this.formatId,
    // Add format-specific metadata
    lineCount: parsed.lines.length
  };

  // 4. Store internal representation
  const content = {
    raw: parsed,
    // Add whatever you need for other methods
  };

  return {
    metadata,
    content,
    boxes: [],
    currentPage: 0,
    rendered: false,
    modified: false
  };
}
```

**Common Patterns:**
- Use `FileReader` for text files
- Use `arrayBuffer()` for binary formats
- Store parsed structure in `content` for later use
- Add format-specific metadata

---

### Method: `render(doc: Document, options: RenderOptions)`

**Purpose:** Display the document in the UI.

**Rendering Strategies:**

#### DOM-based Rendering (Text, CSV)
```typescript
async render(doc: Document, options: RenderOptions): Promise<void> {
  const container = options.container;
  container.innerHTML = '';

  // Create DOM elements
  const contentDiv = document.createElement('div');
  contentDiv.className = 'my-format-content';

  // Populate with content
  // ...

  container.appendChild(contentDiv);
  doc.rendered = true;
}
```

#### Canvas-based Rendering (PDF, Images)
```typescript
async render(doc: Document, options: RenderOptions): Promise<void> {
  const container = options.container;

  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set dimensions
  canvas.width = options.width || 800;
  canvas.height = options.height || 600;

  // Draw content
  // ...

  container.appendChild(canvas);
  doc.rendered = true;
}
```

**Best Practices:**
- Clear container before rendering
- Store element references in `content` for `findTextBoxes()`
- Apply existing redaction boxes after rendering
- Set `doc.rendered = true` when complete

---

### Method: `extractText(doc: Document, page?: number)`

**Purpose:** Extract plain text for PII detection.

**Returns:** `TextExtractionResult` with:
- `fullText`: Complete text for detection
- Optional: `pageText`, `lineText`, `characterPositions`

**Example:**
```typescript
async extractText(doc: Document, page?: number): Promise<TextExtractionResult> {
  const content = doc.content as MyFormatContent;

  // For single-page formats
  return {
    fullText: content.text,
    lineText: content.lines
  };

  // For multi-page formats
  if (page !== undefined) {
    return {
      fullText: content.pages[page].text,
      pageText: new Map([[page, content.pages[page].text]])
    };
  }

  // Return all pages
  return {
    fullText: content.pages.map(p => p.text).join('\n'),
    pageText: new Map(content.pages.map((p, i) => [i, p.text]))
  };
}
```

---

### Method: `findTextBoxes(doc: Document, terms: string[], page?: number)`

**Purpose:** Map detected PII terms to visual coordinates.

**Returns:** Array of `BoundingBox` objects with coordinates.

**Coordinate Systems:**

| System | Origin | Best For | Example |
|--------|--------|----------|---------|
| **Canvas** | Top-left (0,0) | Images, PDFs | `{ x: 100, y: 50, w: 200, h: 20 }` |
| **Line-based** | Top-left (0,0) | Text files | `{ x: charPos * 8, y: lineNum * 22, line: 5 }` |
| **Cell-based** | N/A | CSV/TSV | `{ row: 3, column: 5 }` (no x/y needed) |

**Example (Line-based):**
```typescript
async findTextBoxes(doc: Document, terms: string[]): Promise<BoundingBox[]> {
  const content = doc.content as MyFormatContent;
  const boxes: BoundingBox[] = [];

  for (const term of terms) {
    content.lines.forEach((line, lineIndex) => {
      let startIndex = 0;

      // Find all occurrences in this line
      while (true) {
        const index = line.toLowerCase().indexOf(term.toLowerCase(), startIndex);
        if (index === -1) break;

        // Calculate approximate pixel coordinates
        const charWidth = 8; // Monospace font
        const lineHeight = 22;

        boxes.push({
          x: index * charWidth,
          y: lineIndex * lineHeight,
          w: term.length * charWidth,
          h: lineHeight,
          text: line.substring(index, index + term.length),
          line: lineIndex,
          source: 'regex'
        });

        startIndex = index + 1;
      }
    });
  }

  return boxes;
}
```

**Tips:**
- Case-insensitive matching (`toLowerCase()`)
- Find all occurrences, not just first
- Store original text (preserve case)
- Add padding for better coverage (`expandBox()`)

---

### Method: `redact(doc: Document, boxes: BoundingBox[])`

**Purpose:** Apply redactions to the document (permanently modify content).

**Security Requirements:**
- Use **solid black** or **character replacement** (never blur!)
- Make changes **irreversible**
- No hidden data in output
- Update `doc.modified = true`

**Example (Text replacement):**
```typescript
async redact(doc: Document, boxes: BoundingBox[]): Promise<void> {
  const content = doc.content as MyFormatContent;

  // Group boxes by line
  const boxesByLine = new Map<number, BoundingBox[]>();
  for (const box of boxes) {
    if (box.line === undefined) continue;
    if (!boxesByLine.has(box.line)) {
      boxesByLine.set(box.line, []);
    }
    boxesByLine.get(box.line)!.push(box);
  }

  // Apply redactions (right to left to preserve indices)
  for (const [lineIndex, lineBoxes] of boxesByLine) {
    let line = content.lines[lineIndex];

    // Sort by position (right to left)
    lineBoxes.sort((a, b) => {
      const aStart = line.indexOf(a.text);
      const bStart = line.indexOf(b.text);
      return bStart - aStart;
    });

    // Replace text with block characters
    for (const box of lineBoxes) {
      const index = line.indexOf(box.text);
      if (index >= 0) {
        const redaction = '█'.repeat(box.text.length);
        line = line.substring(0, index) + redaction + line.substring(index + box.text.length);
      }
    }

    content.lines[lineIndex] = line;
  }

  // Update full text
  content.fullText = content.lines.join('\n');

  doc.boxes = [...doc.boxes, ...boxes];
  doc.modified = true;
}
```

**For Canvas-based formats:**
```typescript
async redact(doc: Document, boxes: BoundingBox[]): Promise<void> {
  const canvas = doc.content.canvas as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  // Draw solid black rectangles
  ctx.fillStyle = '#000';
  for (const box of boxes) {
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }

  doc.boxes = [...doc.boxes, ...boxes];
  doc.modified = true;
}
```

---

### Method: `export(doc: Document, options?: ExportOptions)`

**Purpose:** Generate downloadable file with redactions applied.

**Returns:** `Blob` object ready for download.

**Example:**
```typescript
async export(doc: Document, options?: ExportOptions): Promise<Blob> {
  const content = doc.content as MyFormatContent;

  // Generate output based on format
  const outputText = content.lines.join('\n');

  // Create blob with appropriate MIME type
  const blob = new Blob([outputText], {
    type: 'text/plain;charset=utf-8'
  });

  return blob;
}
```

**For binary formats:**
```typescript
async export(doc: Document, options?: ExportOptions): Promise<Blob> {
  const content = doc.content as MyFormatContent;

  // Encode to format-specific binary structure
  const arrayBuffer = encodeMyFormat(content);

  const blob = new Blob([arrayBuffer], {
    type: 'application/x-myformat'
  });

  return blob;
}
```

**Security Checklist:**
- ✅ No selectable text (for canvas-based formats)
- ✅ No hidden layers or metadata
- ✅ Redactions are permanent
- ✅ Original data cannot be recovered

---

### Method: `cleanup()`

**Purpose:** Release resources when document is closed.

**Example:**
```typescript
cleanup(): void {
  const content = this.currentDoc?.content;

  // Terminate workers
  if (content?.worker) {
    content.worker.terminate();
  }

  // Clear large data structures
  if (content?.cache) {
    content.cache.clear();
  }

  // Remove event listeners
  if (content?.canvas) {
    content.canvas.remove();
  }
}
```

---

## Testing Strategy

### Unit Test Structure

```typescript
describe('MyFormat', () => {
  let format: MyFormat;

  beforeEach(() => {
    format = new MyFormat();
  });

  describe('constructor', () => {
    it('should have correct format metadata', () => {
      expect(format.formatId).toBe('myformat');
      expect(format.formatName).toBe('My Format');
    });

    it('should declare capabilities', () => {
      expect(format.capabilities.supportsTextExtraction).toBe(true);
    });
  });

  describe('load', () => {
    it('should load a valid file', async () => {
      const file = new File(['content'], 'test.myext');
      const doc = await format.load(file);
      expect(doc.metadata.format).toBe('myformat');
    });

    it('should handle empty files', async () => {
      const file = new File([''], 'empty.myext');
      const doc = await format.load(file);
      expect(doc.content).toBeDefined();
    });

    it('should reject corrupted files', async () => {
      const file = new File(['\x00\xFF\xFE'], 'bad.myext');
      await expect(format.load(file)).rejects.toThrow();
    });
  });

  describe('extractText', () => {
    it('should extract plain text', async () => {
      const file = new File(['Hello World'], 'test.myext');
      const doc = await format.load(file);
      const result = await format.extractText(doc);
      expect(result.fullText).toContain('Hello World');
    });
  });

  describe('findTextBoxes', () => {
    it('should find single occurrence', async () => {
      // ...
    });

    it('should find multiple occurrences', async () => {
      // ...
    });

    it('should be case-insensitive', async () => {
      // ...
    });

    it('should preserve original case in boxes', async () => {
      // ...
    });
  });

  describe('redact', () => {
    it('should replace text with block characters', async () => {
      // ...
    });

    it('should mark document as modified', async () => {
      // ...
    });

    it('should handle overlapping boxes', async () => {
      // ...
    });
  });

  describe('export', () => {
    it('should export as blob', async () => {
      const file = new File(['test'], 'test.myext');
      const doc = await format.load(file);
      const blob = await format.export(doc);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should export with redactions applied', async () => {
      // ...
    });
  });

  describe('canHandle', () => {
    it('should accept correct MIME type', () => {
      const file = new File([''], 'test.myext', { type: 'application/x-myformat' });
      expect(format.canHandle(file)).toBe(true);
    });

    it('should accept correct extension', () => {
      const file = new File([''], 'test.myext', { type: '' });
      expect(format.canHandle(file)).toBe(true);
    });

    it('should reject unsupported formats', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(format.canHandle(file)).toBe(false);
    });
  });
});
```

### Coverage Requirements

- **Minimum**: 80% line coverage
- **Target**: 90%+ line coverage
- **Critical paths**: 100% coverage (load, redact, export)

Run tests:
```bash
npm test tests/unit/formats/text/MyFormat.test.ts
npm run test:coverage
```

---

## Common Pitfalls

### ❌ Don't: Store UI state in format handler
```typescript
class BadFormat extends DocumentFormat {
  private currentPage = 0; // ❌ UI state doesn't belong here
}
```

### ✅ Do: Use Document.currentPage
```typescript
async render(doc: Document, options: RenderOptions) {
  const page = options.page ?? doc.currentPage ?? 0;
  // ...
}
```

---

### ❌ Don't: Assume monospace fonts
```typescript
const charWidth = 8; // ❌ Won't work with proportional fonts
```

### ✅ Do: Measure actual rendered dimensions
```typescript
const element = content.lineElements.get(lineIndex);
const rect = element.getBoundingClientRect();
const charWidth = rect.width / line.length;
```

---

### ❌ Don't: Forget case sensitivity
```typescript
const index = line.indexOf(term); // ❌ Case-sensitive!
```

### ✅ Do: Use case-insensitive search
```typescript
const index = line.toLowerCase().indexOf(term.toLowerCase());
const matchedText = line.substring(index, index + term.length); // Preserve case
```

---

### ❌ Don't: Use blur or pixelation
```typescript
ctx.filter = 'blur(10px)'; // ❌ Reversible!
```

### ✅ Do: Use solid black rectangles
```typescript
ctx.fillStyle = '#000';
ctx.fillRect(box.x, box.y, box.w, box.h);
```

---

## Examples & References

### Existing Implementations

**Simple format (DOM-based):**
- `src/lib/formats/text/PlainTextFormat.ts`
- Line-based coordinates
- Character replacement redaction
- Good starting point for text formats

**Structured data (DOM-based):**
- `src/lib/formats/structured/CsvFormat.ts`
- Cell-based coordinates
- Table rendering
- Header detection logic

**Complex format (Canvas-based):**
- `src/lib/pdf/` (legacy, to be migrated)
- Coordinate conversion
- Multi-page support
- Flattening for security

---

## Checklist

Before submitting your format handler:

- [ ] Extends `DocumentFormat` base class
- [ ] All required methods implemented
- [ ] Format capabilities correctly declared
- [ ] Registered in `FormatRegistry`
- [ ] MIME types and extensions added to `types.ts`
- [ ] Comprehensive unit tests (80%+ coverage)
- [ ] Security requirements met (no reversible redactions)
- [ ] JSDoc comments on all public methods
- [ ] No UI dependencies (pure business logic)
- [ ] Cleanup method releases all resources
- [ ] Example files for testing
- [ ] Updated `docs/FORMATS.md` with format info

---

## Getting Help

- **Architecture questions**: Review `CLAUDE.md` and existing formats
- **Testing issues**: Check `tests/unit/formats/` for patterns
- **Security concerns**: Consult `docs/FORMATS.md` security sections
- **Integration help**: See `docs/INTEGRATION_GUIDE.md` (if available)

**Need more examples?** Study existing implementations:
- Text formats: `src/lib/formats/text/`
- Structured data: `src/lib/formats/structured/`
- Base classes: `src/lib/formats/base/`

---

**Happy coding! 🚀**
