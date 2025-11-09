/**
 * Table Detection and Extraction
 * Detects tabular data from OCR word positions and extracts structured data
 */

import type { OCRWord } from './form-detector';

export interface TableCell {
  text: string;
  rowIndex: number;
  columnIndex: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface TableRow {
  rowIndex: number;
  cells: TableCell[];
  y: number;  // Vertical position
  height: number;
}

export interface TableColumn {
  columnIndex: number;
  header: string | null;
  cells: TableCell[];
  x: number;  // Horizontal position
  width: number;
}

export interface DetectedTable {
  rows: TableRow[];
  columns: TableColumn[];
  headers: string[];  // Column headers if detected
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Detect if words form a table structure
 * Looks for aligned text in rows and columns
 *
 * @param words - OCR words with bounding boxes
 * @param minColumns - Minimum number of columns to consider it a table (default: 2)
 * @param minRows - Minimum number of rows to consider it a table (default: 3)
 * @returns Array of detected tables
 */
export function detectTables(
  words: OCRWord[],
  minColumns: number = 2,
  minRows: number = 3
): DetectedTable[] {
  if (words.length < minRows * minColumns) {
    return []; // Not enough words for a table
  }

  // Step 1: Group words into horizontal rows
  const rows = groupIntoRows(words);

  if (rows.length < minRows) {
    return []; // Not enough rows
  }

  // Step 2: Detect vertical column alignment
  const columnPositions = detectColumnPositions(rows, minColumns);

  if (columnPositions.length < minColumns) {
    return []; // Not enough aligned columns
  }

  // Step 3: Build table structure
  const table = buildTableStructure(rows, columnPositions);

  if (table.rows.length < minRows) {
    return [];
  }

  return [table];
}

/**
 * Group words into horizontal rows based on Y-position
 * @param words - OCR words
 * @param yTolerance - Vertical tolerance for considering words on same row (default: 10px)
 * @returns Array of word groups representing rows
 */
function groupIntoRows(words: OCRWord[], yTolerance: number = 10): OCRWord[][] {
  // Sort by Y position
  const sorted = [...words].sort((a, b) => a.bbox.y - b.bbox.y);

  const rows: OCRWord[][] = [];
  let currentRow: OCRWord[] = [];
  let currentY = -Infinity;

  for (const word of sorted) {
    // Check if word is on a new row
    if (Math.abs(word.bbox.y - currentY) > yTolerance) {
      if (currentRow.length > 0) {
        // Sort row by X position
        currentRow.sort((a, b) => a.bbox.x - b.bbox.x);
        rows.push(currentRow);
      }
      currentRow = [word];
      currentY = word.bbox.y;
    } else {
      currentRow.push(word);
    }
  }

  // Add last row
  if (currentRow.length > 0) {
    currentRow.sort((a, b) => a.bbox.x - b.bbox.x);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Detect vertical column positions from row data
 * Looks for consistent X-positions across rows
 *
 * @param rows - Word groups representing rows
 * @param minColumns - Minimum columns to detect
 * @param xTolerance - Horizontal tolerance for column alignment (default: 20px)
 * @returns Array of X-positions representing column boundaries
 */
function detectColumnPositions(rows: OCRWord[][], minColumns: number, xTolerance: number = 20): number[] {
  // Collect all X-positions from first word of each cell
  const xPositions: number[] = [];

  for (const row of rows) {
    for (const word of row) {
      xPositions.push(word.bbox.x);
    }
  }

  // Cluster X-positions to find column boundaries
  const clusters = clusterPositions(xPositions, xTolerance);

  // Filter clusters that appear in multiple rows (likely column positions)
  const columnPositions = clusters.filter(cluster => {
    // Count how many rows have a word near this X-position
    const rowCount = rows.filter(row =>
      row.some(word => Math.abs(word.bbox.x - cluster.center) < xTolerance)
    ).length;

    // Column should appear in at least 50% of rows
    return rowCount >= rows.length * 0.5;
  }).map(c => c.center);

  // Sort by X-position
  columnPositions.sort((a, b) => a - b);

  return columnPositions;
}

/**
 * Cluster positions into groups
 * @param positions - Array of positions
 * @param tolerance - Clustering tolerance
 * @returns Array of clusters with center positions
 */
function clusterPositions(positions: number[], tolerance: number): Array<{ center: number; count: number }> {
  const sorted = [...positions].sort((a, b) => a - b);
  const clusters: Array<{ center: number; positions: number[] }> = [];

  for (const pos of sorted) {
    // Find existing cluster within tolerance
    const cluster = clusters.find(c =>
      Math.abs(c.center - pos) < tolerance
    );

    if (cluster) {
      cluster.positions.push(pos);
      // Recalculate center
      cluster.center = cluster.positions.reduce((sum, p) => sum + p, 0) / cluster.positions.length;
    } else {
      clusters.push({ center: pos, positions: [pos] });
    }
  }

  return clusters.map(c => ({ center: c.center, count: c.positions.length }));
}

/**
 * Build table structure from rows and column positions
 */
function buildTableStructure(rows: OCRWord[][], columnPositions: number[]): DetectedTable {
  const tableRows: TableRow[] = [];
  const tableColumns: TableColumn[] = columnPositions.map((x, i) => ({
    columnIndex: i,
    header: null,
    cells: [],
    x,
    width: i < columnPositions.length - 1 ? columnPositions[i + 1] - x : 100
  }));

  // Process each row
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowWords = rows[rowIndex];
    const rowCells: TableCell[] = [];

    // Assign words to columns
    for (const word of rowWords) {
      // Find closest column
      let closestColumnIndex = 0;
      let minDistance = Infinity;

      for (let colIndex = 0; colIndex < columnPositions.length; colIndex++) {
        const distance = Math.abs(word.bbox.x - columnPositions[colIndex]);
        if (distance < minDistance) {
          minDistance = distance;
          closestColumnIndex = colIndex;
        }
      }

      const cell: TableCell = {
        text: word.text,
        rowIndex,
        columnIndex: closestColumnIndex,
        bbox: word.bbox,
        confidence: word.confidence
      };

      rowCells.push(cell);
      tableColumns[closestColumnIndex].cells.push(cell);
    }

    // Calculate row position and height
    const y = Math.min(...rowWords.map(w => w.bbox.y));
    const maxY = Math.max(...rowWords.map(w => w.bbox.y + w.bbox.height));

    tableRows.push({
      rowIndex,
      cells: rowCells,
      y,
      height: maxY - y
    });
  }

  // Detect headers (first row if it's different from others)
  const headers: string[] = [];
  if (tableRows.length > 0) {
    const firstRow = tableRows[0];

    // Group cells by column for first row
    for (let colIndex = 0; colIndex < columnPositions.length; colIndex++) {
      const cellsInColumn = firstRow.cells.filter(c => c.columnIndex === colIndex);
      const headerText = cellsInColumn.map(c => c.text).join(' ');
      headers.push(headerText);
      tableColumns[colIndex].header = headerText;
    }
  }

  // Calculate table bounding box
  const allWords = rows.flat();
  const minX = Math.min(...allWords.map(w => w.bbox.x));
  const minY = Math.min(...allWords.map(w => w.bbox.y));
  const maxX = Math.max(...allWords.map(w => w.bbox.x + w.bbox.width));
  const maxY = Math.max(...allWords.map(w => w.bbox.y + w.bbox.height));

  // Calculate confidence (average of all cells)
  const avgConfidence = allWords.reduce((sum, w) => sum + w.confidence, 0) / allWords.length;

  return {
    rows: tableRows,
    columns: tableColumns,
    headers,
    confidence: avgConfidence,
    bbox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  };
}

/**
 * Get cells from a specific column
 * @param table - Detected table
 * @param columnIndex - Column index (0-based)
 * @returns Array of cells in the column
 */
export function getColumnCells(table: DetectedTable, columnIndex: number): TableCell[] {
  return table.columns[columnIndex]?.cells || [];
}

/**
 * Get cells from a specific row
 * @param table - Detected table
 * @param rowIndex - Row index (0-based)
 * @returns Array of cells in the row
 */
export function getRowCells(table: DetectedTable, rowIndex: number): TableCell[] {
  return table.rows[rowIndex]?.cells || [];
}

/**
 * Find column by header text
 * @param table - Detected table
 * @param headerText - Header text to search for (case-insensitive, partial match)
 * @returns Column index or -1 if not found
 */
export function findColumnByHeader(table: DetectedTable, headerText: string): number {
  const lowerHeader = headerText.toLowerCase();

  for (let i = 0; i < table.headers.length; i++) {
    if (table.headers[i].toLowerCase().includes(lowerHeader)) {
      return i;
    }
  }

  return -1;
}

/**
 * Extract text from a specific column
 * @param table - Detected table
 * @param columnIndex - Column index
 * @param skipHeader - Whether to skip the first row (header)
 * @returns Array of text values from the column
 */
export function extractColumnText(
  table: DetectedTable,
  columnIndex: number,
  skipHeader: boolean = true
): string[] {
  const cells = getColumnCells(table, columnIndex);

  // Group cells by row
  const cellsByRow = new Map<number, string[]>();
  for (const cell of cells) {
    if (!cellsByRow.has(cell.rowIndex)) {
      cellsByRow.set(cell.rowIndex, []);
    }
    cellsByRow.get(cell.rowIndex)!.push(cell.text);
  }

  // Convert to array and skip header if requested
  const rowIndices = Array.from(cellsByRow.keys()).sort((a, b) => a - b);
  const startIndex = skipHeader ? 1 : 0;

  return rowIndices.slice(startIndex).map(rowIndex => {
    const rowTexts = cellsByRow.get(rowIndex) || [];
    return rowTexts.join(' ');
  });
}

/**
 * Get table as 2D array (for export or processing)
 * @param table - Detected table
 * @returns 2D array of cell text
 */
export function tableToArray(table: DetectedTable): string[][] {
  const result: string[][] = [];

  for (const row of table.rows) {
    const rowData: string[] = new Array(table.columns.length).fill('');

    for (const cell of row.cells) {
      if (!rowData[cell.columnIndex]) {
        rowData[cell.columnIndex] = cell.text;
      } else {
        rowData[cell.columnIndex] += ' ' + cell.text;
      }
    }

    result.push(rowData);
  }

  return result;
}
