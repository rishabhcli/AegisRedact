/**
 * Metadata Extractor
 *
 * Extracts metadata from PDFs and images for privacy analysis.
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentMetadata } from './types';

/**
 * Extract metadata from PDF document
 */
export async function extractPDFMetadata(
  pdfDoc: PDFDocumentProxy,
  fileName: string,
  fileSize: number
): Promise<DocumentMetadata> {
  const metadata = await pdfDoc.getMetadata();
  const info = metadata.info;

  const result: DocumentMetadata = {
    fileName,
    fileType: 'application/pdf',
    fileSize
  };

  // Extract standard PDF metadata fields
  if (info.Title) result.title = String(info.Title);
  if (info.Author) result.author = String(info.Author);
  if (info.Subject) result.subject = String(info.Subject);
  if (info.Creator) result.creator = String(info.Creator);
  if (info.Producer) result.producer = String(info.Producer);

  // Parse dates if present
  if (info.CreationDate) {
    result.creationDate = parsePDFDate(String(info.CreationDate));
  }
  if (info.ModDate) {
    result.modificationDate = parsePDFDate(String(info.ModDate));
  }

  return result;
}

/**
 * Extract EXIF metadata from image
 */
export async function extractImageMetadata(
  imageFile: File
): Promise<DocumentMetadata> {
  const metadata: DocumentMetadata = {
    fileName: imageFile.name,
    fileType: imageFile.type,
    fileSize: imageFile.size
  };

  // Try to extract EXIF data
  try {
    const exif = await extractEXIFData(imageFile);
    if (exif && Object.keys(exif).length > 0) {
      metadata.exif = exif;
    }
  } catch (error) {
    console.warn('[extractImageMetadata] Failed to extract EXIF:', error);
  }

  return metadata;
}

/**
 * Extract EXIF data from image file
 */
async function extractEXIFData(file: File): Promise<any> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve({});
        return;
      }

      try {
        const exif = parseEXIF(new Uint8Array(arrayBuffer));
        resolve(exif);
      } catch (error) {
        console.warn('[extractEXIFData] EXIF parse error:', error);
        resolve({});
      }
    };

    reader.onerror = () => {
      resolve({});
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse EXIF data from image buffer
 * Simplified EXIF parser - supports common fields
 */
function parseEXIF(buffer: Uint8Array): any {
  const exif: any = {};

  // Check for JPEG SOI marker (0xFFD8)
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return exif; // Not a JPEG
  }

  // Find APP1 marker (0xFFE1) containing EXIF data
  let offset = 2;
  while (offset < buffer.length - 1) {
    if (buffer[offset] === 0xFF && buffer[offset + 1] === 0xE1) {
      // Found APP1 marker
      const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
      const segmentData = buffer.slice(offset + 4, offset + 4 + segmentLength - 2);

      // Check for "Exif\0\0" header
      if (
        segmentData[0] === 0x45 && // 'E'
        segmentData[1] === 0x78 && // 'x'
        segmentData[2] === 0x69 && // 'i'
        segmentData[3] === 0x66 && // 'f'
        segmentData[4] === 0x00 &&
        segmentData[5] === 0x00
      ) {
        // Parse EXIF tags (simplified - only common tags)
        const tiffHeader = segmentData.slice(6);
        parseEXIFTags(tiffHeader, exif);
      }

      break;
    }

    offset++;
  }

  return exif;
}

/**
 * Parse EXIF tags from TIFF header
 * Simplified parser for common tags
 */
function parseEXIFTags(tiffData: Uint8Array, exif: any): void {
  // Check byte order (II = little-endian, MM = big-endian)
  const littleEndian = tiffData[0] === 0x49 && tiffData[1] === 0x49;

  // For simplicity, we'll just extract common string fields using regex patterns
  // Full EXIF parsing would require handling TIFF structure properly

  const dataStr = String.fromCharCode.apply(null, Array.from(tiffData.slice(0, 1000)));

  // Look for common EXIF strings
  const makeMatch = dataStr.match(/Canon|Nikon|Sony|Apple|Samsung|Fujifilm|Olympus|Panasonic|Leica/);
  if (makeMatch) exif.make = makeMatch[0];

  const softwareMatch = dataStr.match(/Photoshop|Lightroom|GIMP|Paint\.NET|Affinity/);
  if (softwareMatch) exif.software = softwareMatch[0];

  // GPS data extraction - parse GPS IFD if present
  const gpsData = parseGPSData(tiffData, littleEndian);
  if (gpsData) {
    exif.gps = gpsData;
  }

  // Note: A production implementation would use a proper EXIF library
  // For this demo, we're using a simplified parser
}

/**
 * Parse GPS data from EXIF TIFF structure
 * Extracts GPS coordinates (latitude, longitude, altitude) from GPS IFD
 */
function parseGPSData(tiffData: Uint8Array, littleEndian: boolean): any {
  try {
    // Verify minimum TIFF header size
    if (tiffData.length < 8) {
      return null;
    }

    // Read 16-bit value based on endianness
    const read16 = (offset: number): number => {
      if (offset + 1 >= tiffData.length) return 0;
      if (littleEndian) {
        return tiffData[offset] | (tiffData[offset + 1] << 8);
      } else {
        return (tiffData[offset] << 8) | tiffData[offset + 1];
      }
    };

    // Read 32-bit value based on endianness
    const read32 = (offset: number): number => {
      if (offset + 3 >= tiffData.length) return 0;
      if (littleEndian) {
        return (tiffData[offset] | (tiffData[offset + 1] << 8) |
               (tiffData[offset + 2] << 16) | (tiffData[offset + 3] << 24)) >>> 0;
      } else {
        return ((tiffData[offset] << 24) | (tiffData[offset + 1] << 16) |
               (tiffData[offset + 2] << 8) | tiffData[offset + 3]) >>> 0;
      }
    };

    // Read rational value (numerator/denominator) at given offset
    const readRational = (offset: number): number => {
      if (offset + 7 >= tiffData.length) return 0;
      const numerator = read32(offset);
      const denominator = read32(offset + 4);
      return denominator !== 0 ? numerator / denominator : 0;
    };

    // Find GPS IFD offset
    // First, get IFD0 offset (at bytes 4-7 of TIFF header)
    const ifd0Offset = read32(4);
    if (ifd0Offset === 0 || ifd0Offset >= tiffData.length) {
      return null;
    }

    // Parse IFD0 to find GPS IFD pointer (tag 0x8825)
    let gpsIFDOffset = 0;
    const numEntries = read16(ifd0Offset);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0Offset + 2 + (i * 12);
      if (entryOffset + 11 >= tiffData.length) break;

      const tag = read16(entryOffset);

      // GPS IFD Pointer tag is 0x8825
      if (tag === 0x8825) {
        gpsIFDOffset = read32(entryOffset + 8);
        break;
      }
    }

    if (gpsIFDOffset === 0 || gpsIFDOffset >= tiffData.length) {
      return null; // No GPS data
    }

    // Parse GPS IFD
    const numGPSEntries = read16(gpsIFDOffset);
    let latitudeRef = 'N';
    let longitudeRef = 'E';
    let latitude: number | null = null;
    let longitude: number | null = null;
    let altitude: number | null = null;

    for (let i = 0; i < numGPSEntries; i++) {
      const entryOffset = gpsIFDOffset + 2 + (i * 12);
      if (entryOffset + 11 >= tiffData.length) break;

      const tag = read16(entryOffset);
      const type = read16(entryOffset + 2);
      const count = read32(entryOffset + 4);
      let valueOffset = read32(entryOffset + 8);

      // For data larger than 4 bytes, valueOffset is a pointer
      // For data <= 4 bytes, it's inline in the value field
      const dataSize = getDataSize(type, count);

      // GPS tags
      switch (tag) {
        case 0x0001: // GPSLatitudeRef (ASCII, 2 bytes - stored inline)
          latitudeRef = String.fromCharCode(tiffData[entryOffset + 8]);
          break;

        case 0x0002: // GPSLatitude (3 rationals = 24 bytes - uses offset)
          if (count === 3 && valueOffset + 23 < tiffData.length) {
            const degrees = readRational(valueOffset);
            const minutes = readRational(valueOffset + 8);
            const seconds = readRational(valueOffset + 16);
            latitude = degrees + minutes / 60 + seconds / 3600;
          }
          break;

        case 0x0003: // GPSLongitudeRef (ASCII, 2 bytes - stored inline)
          longitudeRef = String.fromCharCode(tiffData[entryOffset + 8]);
          break;

        case 0x0004: // GPSLongitude (3 rationals = 24 bytes - uses offset)
          if (count === 3 && valueOffset + 23 < tiffData.length) {
            const degrees = readRational(valueOffset);
            const minutes = readRational(valueOffset + 8);
            const seconds = readRational(valueOffset + 16);
            longitude = degrees + minutes / 60 + seconds / 3600;
          }
          break;

        case 0x0006: // GPSAltitude (1 rational = 8 bytes - uses offset)
          if (count === 1 && valueOffset + 7 < tiffData.length) {
            altitude = readRational(valueOffset);
          }
          break;
      }
    }

    // Apply reference directions (S and W are negative)
    if (latitude !== null) {
      latitude = latitudeRef === 'S' ? -latitude : latitude;
    }
    if (longitude !== null) {
      longitude = longitudeRef === 'W' ? -longitude : longitude;
    }

    // Return GPS data if we have at least coordinates
    if (latitude !== null && longitude !== null) {
      const gps: any = { latitude, longitude };
      if (altitude !== null) {
        gps.altitude = altitude;
      }
      return gps;
    }

    return null;
  } catch (error) {
    // If parsing fails, return null (don't crash)
    console.warn('[parseGPSData] Failed to parse GPS data:', error);
    return null;
  }
}

/**
 * Get the size in bytes for a TIFF data type
 */
function getDataSize(type: number, count: number): number {
  const typeSizes: { [key: number]: number } = {
    1: 1,   // BYTE
    2: 1,   // ASCII
    3: 2,   // SHORT
    4: 4,   // LONG
    5: 8,   // RATIONAL
    6: 1,   // SBYTE
    7: 1,   // UNDEFINED
    8: 2,   // SSHORT
    9: 4,   // SLONG
    10: 8,  // SRATIONAL
    11: 4,  // FLOAT
    12: 8   // DOUBLE
  };

  const typeSize = typeSizes[type] || 1;
  return typeSize * count;
}

/**
 * Parse PDF date string to JavaScript Date
 * PDF date format: D:YYYYMMDDHHmmSSOHH'mm
 */
function parsePDFDate(dateStr: string): Date {
  // Remove "D:" prefix if present
  if (dateStr.startsWith('D:')) {
    dateStr = dateStr.substring(2);
  }

  // Extract components
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(dateStr.substring(8, 10) || '0');
  const minute = parseInt(dateStr.substring(10, 12) || '0');
  const second = parseInt(dateStr.substring(12, 14) || '0');

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Create empty metadata for text documents
 */
export function createTextDocumentMetadata(
  fileName: string,
  fileType: string,
  fileSize: number
): DocumentMetadata {
  return {
    fileName,
    fileType,
    fileSize
  };
}
