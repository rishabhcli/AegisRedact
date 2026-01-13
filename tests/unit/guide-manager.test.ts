/**
 * Tests for GuideManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuideManager } from '../../src/lib/ruler/guide-manager';
import type { Box } from '../../src/lib/pdf/find';

describe('GuideManager', () => {
  let guideManager: GuideManager;

  beforeEach(() => {
    guideManager = new GuideManager();
  });

  describe('addGuide', () => {
    it('should add a horizontal guide', () => {
      const guide = guideManager.addGuide('horizontal', 100);

      expect(guide.orientation).toBe('horizontal');
      expect(guide.position).toBe(100);
      expect(guide.id).toBeDefined();
    });

    it('should add a vertical guide', () => {
      const guide = guideManager.addGuide('vertical', 200);

      expect(guide.orientation).toBe('vertical');
      expect(guide.position).toBe(200);
    });

    it('should accept custom color', () => {
      const guide = guideManager.addGuide('horizontal', 100, '#FF0000');

      expect(guide.color).toBe('#FF0000');
    });

    it('should use default color if not specified', () => {
      const guide = guideManager.addGuide('horizontal', 100);

      expect(guide.color).toBe('#00FFFF');
    });

    it('should generate unique IDs', () => {
      const guide1 = guideManager.addGuide('horizontal', 100);
      const guide2 = guideManager.addGuide('horizontal', 200);

      expect(guide1.id).not.toBe(guide2.id);
    });
  });

  describe('removeGuide', () => {
    it('should remove existing guide', () => {
      const guide = guideManager.addGuide('horizontal', 100);
      const result = guideManager.removeGuide(guide.id);

      expect(result).toBe(true);
      expect(guideManager.getGuides()).not.toContain(guide);
    });

    it('should return false for non-existent guide', () => {
      const result = guideManager.removeGuide('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('updateGuidePosition', () => {
    it('should update guide position', () => {
      const guide = guideManager.addGuide('horizontal', 100);
      const result = guideManager.updateGuidePosition(guide.id, 200);

      expect(result).toBe(true);
      expect(guide.position).toBe(200);
    });

    it('should return false for non-existent guide', () => {
      const result = guideManager.updateGuidePosition('non-existent', 200);
      expect(result).toBe(false);
    });
  });

  describe('getGuides', () => {
    it('should return empty array initially', () => {
      const guides = guideManager.getGuides();
      expect(guides).toHaveLength(0);
    });

    it('should return all guides', () => {
      guideManager.addGuide('horizontal', 100);
      guideManager.addGuide('vertical', 200);
      guideManager.addGuide('horizontal', 300);

      const guides = guideManager.getGuides();
      expect(guides).toHaveLength(3);
    });

    it('should return readonly array', () => {
      const guides = guideManager.getGuides();
      expect(Array.isArray(guides)).toBe(true);
    });
  });

  describe('getGuidesByOrientation', () => {
    it('should filter horizontal guides', () => {
      guideManager.addGuide('horizontal', 100);
      guideManager.addGuide('vertical', 200);
      guideManager.addGuide('horizontal', 300);

      const horizontal = guideManager.getGuidesByOrientation('horizontal');
      expect(horizontal).toHaveLength(2);
      expect(horizontal.every(g => g.orientation === 'horizontal')).toBe(true);
    });

    it('should filter vertical guides', () => {
      guideManager.addGuide('horizontal', 100);
      guideManager.addGuide('vertical', 200);
      guideManager.addGuide('vertical', 300);

      const vertical = guideManager.getGuidesByOrientation('vertical');
      expect(vertical).toHaveLength(2);
      expect(vertical.every(g => g.orientation === 'vertical')).toBe(true);
    });
  });

  describe('clearGuides', () => {
    it('should remove all guides', () => {
      guideManager.addGuide('horizontal', 100);
      guideManager.addGuide('vertical', 200);

      guideManager.clearGuides();

      expect(guideManager.getGuides()).toHaveLength(0);
    });
  });

  describe('snap threshold', () => {
    it('should have default snap threshold of 5', () => {
      expect(guideManager.getSnapThreshold()).toBe(5);
    });

    it('should allow setting snap threshold', () => {
      guideManager.setSnapThreshold(10);
      expect(guideManager.getSnapThreshold()).toBe(10);
    });
  });

  describe('snapToGuides', () => {
    it('should snap box to nearby vertical guide (left edge)', () => {
      guideManager.addGuide('vertical', 100);
      guideManager.setSnapThreshold(10);

      const box: Box = { x: 103, y: 50, w: 50, h: 20, text: 'test' };
      const result = guideManager.snapToGuides(box);

      expect(result.snapped).toBe(true);
      expect(result.box.x).toBe(100);
    });

    it('should snap box to nearby horizontal guide (top edge)', () => {
      guideManager.addGuide('horizontal', 100);
      guideManager.setSnapThreshold(10);

      const box: Box = { x: 50, y: 97, w: 50, h: 20, text: 'test' };
      const result = guideManager.snapToGuides(box);

      expect(result.snapped).toBe(true);
      expect(result.box.y).toBe(100);
    });

    it('should not snap if guide is too far', () => {
      guideManager.addGuide('vertical', 100);
      guideManager.setSnapThreshold(5);

      const box: Box = { x: 150, y: 50, w: 50, h: 20, text: 'test' };
      const result = guideManager.snapToGuides(box);

      expect(result.snapped).toBe(false);
      expect(result.box.x).toBe(150);
    });

    it('should return snapped guides', () => {
      const guide = guideManager.addGuide('vertical', 100);
      guideManager.setSnapThreshold(10);

      const box: Box = { x: 103, y: 50, w: 50, h: 20, text: 'test' };
      const result = guideManager.snapToGuides(box);

      expect(result.guides).toContain(guide);
    });

    it('should snap to multiple guides', () => {
      guideManager.addGuide('vertical', 100);
      guideManager.addGuide('horizontal', 50);
      guideManager.setSnapThreshold(10);

      const box: Box = { x: 103, y: 53, w: 50, h: 20, text: 'test' };
      const result = guideManager.snapToGuides(box);

      expect(result.snapped).toBe(true);
      expect(result.box.x).toBe(100);
      expect(result.box.y).toBe(50);
    });
  });

  describe('findGuideAtPosition', () => {
    it('should find horizontal guide near y position', () => {
      const guide = guideManager.addGuide('horizontal', 100);

      const found = guideManager.findGuideAtPosition(50, 105, 10);

      expect(found).toBe(guide);
    });

    it('should find vertical guide near x position', () => {
      const guide = guideManager.addGuide('vertical', 100);

      const found = guideManager.findGuideAtPosition(105, 50, 10);

      expect(found).toBe(guide);
    });

    it('should return null if no guide near position', () => {
      guideManager.addGuide('horizontal', 100);

      const found = guideManager.findGuideAtPosition(50, 200, 10);

      expect(found).toBeNull();
    });
  });

  describe('listeners', () => {
    it('should notify listeners when guide added', () => {
      const listener = vi.fn();
      guideManager.addListener(listener);

      guideManager.addGuide('horizontal', 100);

      expect(listener).toHaveBeenCalled();
    });

    it('should notify listeners when guide removed', () => {
      const guide = guideManager.addGuide('horizontal', 100);
      const listener = vi.fn();
      guideManager.addListener(listener);

      guideManager.removeGuide(guide.id);

      expect(listener).toHaveBeenCalled();
    });

    it('should notify listeners when guide updated', () => {
      const guide = guideManager.addGuide('horizontal', 100);
      const listener = vi.fn();
      guideManager.addListener(listener);

      guideManager.updateGuidePosition(guide.id, 200);

      expect(listener).toHaveBeenCalled();
    });

    it('should remove listener', () => {
      const listener = vi.fn();
      guideManager.addListener(listener);
      guideManager.removeListener(listener);

      guideManager.addGuide('horizontal', 100);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('state export/import', () => {
    it('should export state', () => {
      guideManager.addGuide('horizontal', 100);
      guideManager.addGuide('vertical', 200);
      guideManager.setSnapThreshold(10);

      const state = guideManager.exportState() as any;

      expect(state.guides).toHaveLength(2);
      expect(state.snapThreshold).toBe(10);
    });

    it('should import state', () => {
      const state = {
        guides: [
          { id: 'g1', orientation: 'horizontal', position: 100, color: '#FF0000' },
          { id: 'g2', orientation: 'vertical', position: 200, color: '#00FF00' },
        ],
        nextId: 3,
        snapThreshold: 15,
      };

      guideManager.importState(state);

      expect(guideManager.getGuides()).toHaveLength(2);
      expect(guideManager.getSnapThreshold()).toBe(15);
    });
  });

  describe('renderGuides', () => {
    it('should render guides without error', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        setLineDash: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
      } as unknown as CanvasRenderingContext2D;

      guideManager.addGuide('horizontal', 100);
      guideManager.addGuide('vertical', 200);

      expect(() => {
        guideManager.renderGuides(ctx, 800, 600);
      }).not.toThrow();

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });
});
