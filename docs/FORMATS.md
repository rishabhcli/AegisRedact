# Supported Document Formats

AegisRedact (Share-Safe Toolkit) now supports multiple document formats beyond PDFs and images. This guide explains what formats are supported, their capabilities, and any format-specific limitations.

## Quick Reference

| Format | Extensions | Detection | Redaction Method | Export Formats | Notes |
|--------|-----------|-----------|-----------------|----------------|-------|
| **PDF** | `.pdf` | ✅ Auto + Manual | Black boxes | PDF (flattened) | Original format |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp` | ✅ Auto + Manual | Black boxes | Same format | EXIF removed |
| **Plain Text** | `.txt`, `.md` | ✅ Auto + Manual | Character replacement | `.txt` | New! |
| **CSV/TSV** | `.csv`, `.tsv` | ✅ Auto + Manual | Cell replacement | `.csv`, `.tsv` | New! |

**Legend:**
- ✅ = Fully supported
- 🔮 = Planned for future release

## Format Details

### PDF Documents

**Extensions:** `.pdf`

**What works:**
- Automatic PII detection in text-based PDFs
- OCR support for scanned PDFs (enable "Use OCR" in toolbar)
- Manual redaction boxes
- Multi-page support
- Export as flattened PDF (no hidden layers or selectable text)

**Limitations:**
- Forms and fillable fields are treated as images (OCR required)
- Annotations and comments are not extracted for detection
- Large PDFs (>50 pages) may take longer to process

**Security:**
- Exported PDFs contain only rasterized images
- No text layers or metadata
- Black boxes cannot be removed or undone after export

**Best for:** Official documents, reports, contracts, forms

---

### Images

**Extensions:** `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`

**What works:**
- Automatic PII detection with OCR (enable "Use OCR" in toolbar)
- Manual redaction boxes
- Automatic EXIF/GPS metadata removal
- Export in original format

**Limitations:**
- OCR required for text detection (10MB download on first use)
- OCR accuracy depends on image quality and text clarity
- Single image per file (no multi-page TIFF support yet)

**Security:**
- EXIF metadata (GPS coordinates, camera info) automatically removed
- Image is re-encoded through canvas (strips all metadata)
- Black boxes are permanently applied

**Best for:** Screenshots, photos of documents, scanned images

---

### Plain Text & Markdown

**Extensions:** `.txt`, `.md`, `.markdown`

**What works:**
- Automatic PII detection (emails, phones, SSNs, credit cards)
- Manual redaction via text selection
- Line-by-line display with line numbers
- Export as plain text with redactions applied

**Limitations:**
- No rich formatting preserved in export
- Markdown is treated as plain text (no rendering)
- Visual redaction boxes are approximate (char-width based)

**Security:**
- Redacted terms are replaced with block characters (`█`)
- No hidden data or metadata
- Text file format is inherently secure after replacement

**Best for:** Log files, configuration files, plain text documents, markdown notes

**Example:**
```
Before: My email is john@example.com
After:  My email is ████████████████
```

---

### CSV & TSV Files

**Extensions:** `.csv`, `.tsv`

**What works:**
- Automatic PII detection across all cells
- Whole-cell redaction (if any PII detected in cell, entire cell is redacted)
- Column-based redaction (redact entire column by name)
- Header detection (automatic)
- Export as CSV/TSV with redactions applied

**Special Features:**
- **Column redaction:** Right-click column header → "Redact entire column"
- **Header preservation:** First row detected as headers if it contains unique, non-numeric text
- **Batch operations:** Redact multiple columns at once

**Limitations:**
- Cell-level precision only (cannot redact part of a cell)
- Large CSV files (>10,000 rows) may slow down rendering
- Complex formulas or macros not supported (use Excel export instead)

**Security:**
- Redacted cells replaced with block characters
- Proper CSV escaping applied (quotes, delimiters preserved)
- No hidden data or metadata

**Best for:** Data exports, contact lists, financial records, database dumps

**Example:**
```csv
Before:
Name,Email,Phone
John Doe,john@example.com,555-1234

After:
Name,Email,Phone
John Doe,████████████████,████████
```

---

## Planned Formats

The following formats are planned for future releases:

### Office Documents (Phase 3)
- **Word:** `.docx` - Full text extraction, paragraph-level redaction
- **Excel:** `.xlsx` - Sheet-based redaction, formula preservation
- **PowerPoint:** `.pptx` - Slide-based redaction, notes extraction

### Rich Text (Phase 4)
- **RTF:** `.rtf` - Formatted text with style preservation
- **HTML:** `.html`, `.htm` - Web page redaction

### E-books (Phase 4)
- **EPUB:** `.epub` - Chapter-based navigation
- **MOBI:** `.mobi` - Kindle format support

---

## Choosing the Right Format

### For Maximum Security
**Use:** PDF or Image formats
- Flattened output with no hidden layers
- Most thorough metadata removal

### For Editability
**Use:** Plain Text or CSV formats
- Exported files remain editable
- Easy to verify redactions manually

### For Collaboration
**Use:** CSV format
- Standard format for data exchange
- Easy to import into other tools

### For Compliance
**Use:** PDF format
- Industry standard for official documents
- Permanent, verifiable redactions

---

## Format Conversion

AegisRedact does not currently convert between formats. If you need to redact a Word document:

1. **Option A:** Export as PDF from Word, then redact the PDF
2. **Option B:** Wait for `.docx` support (coming soon!)

For Excel spreadsheets:

1. **Option A:** Export as CSV, redact, then re-import
2. **Option B:** Wait for `.xlsx` support (coming soon!)

---

## Performance Tips

### Large PDFs
- Process in batches (split PDF into smaller files)
- Disable ML detection if not needed (faster processing)
- Use "Auto-detect All" sparingly on large documents

### High-Resolution Images
- Resize images before uploading (recommended: max 2000x2000px)
- OCR speed depends on image size and text density
- Consider compressing images first

### Large CSV Files
- Files with >10,000 rows may render slowly
- Consider splitting into smaller files
- Use column redaction for efficiency

---

## Troubleshooting

### "Format not supported" error
**Solution:** Check that file extension matches one of the supported formats. Some files may have incorrect extensions (e.g., `.txt` file renamed to `.pdf`).

### OCR not detecting text in images/scanned PDFs
**Possible causes:**
- Text is too small or blurry
- Image quality is poor
- Non-Latin script (OCR currently optimized for English)

**Solutions:**
- Increase image resolution
- Enable contrast enhancement (in image editor)
- Wait for multi-language OCR support

### CSV file not parsing correctly
**Possible causes:**
- Non-standard delimiter (e.g., semicolon instead of comma)
- Inconsistent quote escaping
- Mixed line endings

**Solutions:**
- Open in Excel and save as standard CSV
- Check delimiter (comma for CSV, tab for TSV)
- Ensure consistent UTF-8 encoding

### Redactions not aligned properly (text files)
**Cause:** Monospace font assumption may not match actual rendering

**Solution:** Use "Expand Padding" option in settings to increase redaction box size

---

## Format FAQ

**Q: Can I redact password-protected PDFs?**
A: No, PDFs must be unlocked first. Use Adobe Acrobat or similar to remove password protection.

**Q: Will redacting a CSV break my spreadsheet formulas?**
A: CSV export does not preserve formulas. If you need formula preservation, wait for `.xlsx` support.

**Q: Can I undo redactions after exporting?**
A: **No.** Redactions are permanent after export. Always keep a copy of the original file.

**Q: Does the app send my files to a server?**
A: **No.** All processing happens entirely in your browser. No uploads, no tracking, no external APIs.

**Q: What about office files (.docx, .xlsx, .pptx)?**
A: Coming soon! These formats are planned for Phase 3 implementation.

**Q: Can I batch process multiple files at once?**
A: Currently, files must be processed one at a time. Batch processing is planned for v1.1.

---

## Getting Help

If you encounter issues with a specific file format:

1. Check this documentation for known limitations
2. Try a different export format (e.g., Word → PDF → redact)
3. Verify file is not corrupted (open in native application first)
4. Report issues on GitHub: [github.com/youruser/AegisRedact/issues](https://github.com/youruser/AegisRedact/issues)

---

**Last updated:** 2025-11-10
**Version:** 1.1.0 (Format expansion release)
