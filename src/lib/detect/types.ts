export type DetectionType = 'email' | 'phone' | 'ssn' | 'card';

export interface Detection {
  type: DetectionType;
  text: string;
  confidence: number;
}

// Extended type for audit tracking (includes ML-detected entities and manual redactions)
export type PIIType = 'email' | 'phone' | 'ssn' | 'card' | 'name' | 'org' | 'location' | 'manual';
export type DetectionMethod = 'regex' | 'ml' | 'manual';

/**
 * Enhanced box with type metadata for audit tracking
 */
export interface EnhancedBox {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  type: PIIType;
  detectionMethod: DetectionMethod;
  confidence?: number;  // For ML detections (0.0-1.0)
  pageNumber: number;   // Which page this box is on
}

/**
 * Statistics for audit summary display
 */
export interface AuditStats {
  total: number;
  byType: Record<PIIType, number>;
  pagesAffected: number;
  methodsUsed: DetectionMethod[];
}
