/**
 * Tests for history command implementations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Box } from '../../src/lib/pdf/find';
import { BaseCommand } from '../../src/lib/history/command';
import {
  AddBoxCommand,
  RemoveBoxCommand,
  MoveBoxCommand,
  ResizeBoxCommand,
  TransformBoxCommand,
} from '../../src/lib/history/commands/box-commands';
import {
  ToggleDetectionCommand,
  ToggleMultipleDetectionsCommand,
  FilterDetectionsCommand,
} from '../../src/lib/history/commands/detection-commands';
import type { RedactionItem } from '../../src/ui/components/RedactionList';

describe('BaseCommand', () => {
  // Create a concrete implementation for testing
  class TestCommand extends BaseCommand {
    executed = false;
    undone = false;

    execute(): void {
      this.executed = true;
    }

    undo(): void {
      this.undone = true;
    }

    describe(): string {
      return 'Test command';
    }
  }

  it('should set timestamp on construction', () => {
    const before = new Date();
    const command = new TestCommand();
    const after = new Date();

    const timestamp = command.getTimestamp();
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should call execute on redo by default', () => {
    const command = new TestCommand();
    command.redo();

    expect(command.executed).toBe(true);
  });

  it('should return description', () => {
    const command = new TestCommand();
    expect(command.describe()).toBe('Test command');
  });
});

describe('AddBoxCommand', () => {
  let boxes: Box[];
  let newBox: Box;

  beforeEach(() => {
    boxes = [];
    newBox = { x: 100, y: 200, w: 50, h: 30, text: 'test' };
  });

  it('should add box on execute', () => {
    const command = new AddBoxCommand(boxes, newBox);
    command.execute();

    expect(boxes).toContain(newBox);
    expect(boxes).toHaveLength(1);
  });

  it('should remove box on undo', () => {
    const command = new AddBoxCommand(boxes, newBox);
    command.execute();
    command.undo();

    expect(boxes).not.toContain(newBox);
    expect(boxes).toHaveLength(0);
  });

  it('should handle undo when box not in array', () => {
    const command = new AddBoxCommand(boxes, newBox);
    // Don't execute, try to undo
    expect(() => command.undo()).not.toThrow();
  });

  it('should describe the action', () => {
    const command = new AddBoxCommand(boxes, newBox);
    const description = command.describe();

    expect(description).toContain('Add box');
    expect(description).toContain('100');
    expect(description).toContain('200');
  });

  it('should restore box on redo', () => {
    const command = new AddBoxCommand(boxes, newBox);
    command.execute();
    command.undo();
    command.redo();

    expect(boxes).toContain(newBox);
  });
});

describe('RemoveBoxCommand', () => {
  let boxes: Box[];
  let existingBox: Box;

  beforeEach(() => {
    existingBox = { x: 50, y: 75, w: 100, h: 50, text: 'existing' };
    boxes = [existingBox];
  });

  it('should remove box on execute', () => {
    const command = new RemoveBoxCommand(boxes, existingBox);
    command.execute();

    expect(boxes).not.toContain(existingBox);
    expect(boxes).toHaveLength(0);
  });

  it('should restore box on undo', () => {
    const command = new RemoveBoxCommand(boxes, existingBox);
    command.execute();
    command.undo();

    expect(boxes).toContain(existingBox);
    expect(boxes).toHaveLength(1);
  });

  it('should restore box at original index', () => {
    const box1 = { x: 0, y: 0, w: 10, h: 10, text: 'box1' };
    const box2 = { x: 20, y: 20, w: 10, h: 10, text: 'box2' };
    const box3 = { x: 40, y: 40, w: 10, h: 10, text: 'box3' };
    const boxArray = [box1, box2, box3];

    const command = new RemoveBoxCommand(boxArray, box2);
    command.execute();
    expect(boxArray).toEqual([box1, box3]);

    command.undo();
    expect(boxArray).toEqual([box1, box2, box3]);
  });

  it('should handle undo when original index is invalid', () => {
    const command = new RemoveBoxCommand([], existingBox);
    expect(() => command.undo()).not.toThrow();
  });

  it('should describe the action', () => {
    const command = new RemoveBoxCommand(boxes, existingBox);
    const description = command.describe();

    expect(description).toContain('Remove box');
    expect(description).toContain('50');
    expect(description).toContain('75');
  });
});

describe('MoveBoxCommand', () => {
  let box: Box;

  beforeEach(() => {
    box = { x: 100, y: 100, w: 50, h: 50, text: 'movable' };
  });

  it('should move box to new position on execute', () => {
    const command = new MoveBoxCommand(box, 100, 100, 200, 150);
    command.execute();

    expect(box.x).toBe(200);
    expect(box.y).toBe(150);
  });

  it('should restore original position on undo', () => {
    const command = new MoveBoxCommand(box, 100, 100, 200, 150);
    command.execute();
    command.undo();

    expect(box.x).toBe(100);
    expect(box.y).toBe(100);
  });

  it('should describe the action with delta values', () => {
    const command = new MoveBoxCommand(box, 100, 100, 150, 120);
    const description = command.describe();

    expect(description).toContain('Move box');
    expect(description).toContain('+50');
    expect(description).toContain('+20');
  });

  it('should describe negative movement', () => {
    const command = new MoveBoxCommand(box, 100, 100, 80, 90);
    const description = command.describe();

    expect(description).toContain('-20');
    expect(description).toContain('-10');
  });

  it('should merge consecutive moves for same box', () => {
    const command1 = new MoveBoxCommand(box, 100, 100, 120, 110);
    const command2 = new MoveBoxCommand(box, 120, 110, 150, 130);

    const merged = command1.merge(command2);

    expect(merged).toBe(true);
    command1.execute();
    expect(box.x).toBe(150);
    expect(box.y).toBe(130);
  });

  it('should not merge moves for different boxes', () => {
    const otherBox = { x: 0, y: 0, w: 10, h: 10, text: 'other' };
    const command1 = new MoveBoxCommand(box, 100, 100, 120, 110);
    const command2 = new MoveBoxCommand(otherBox, 0, 0, 10, 10);

    const merged = command1.merge(command2);

    expect(merged).toBe(false);
  });

  it('should not merge with non-MoveBoxCommand', () => {
    const command1 = new MoveBoxCommand(box, 100, 100, 120, 110);
    const notMoveCommand = { box, newX: 150, newY: 130 };

    const merged = command1.merge(notMoveCommand);

    expect(merged).toBe(false);
  });
});

describe('ResizeBoxCommand', () => {
  let box: Box;

  beforeEach(() => {
    box = { x: 0, y: 0, w: 100, h: 80, text: 'resizable' };
  });

  it('should resize box on execute', () => {
    const command = new ResizeBoxCommand(box, 100, 80, 150, 120);
    command.execute();

    expect(box.w).toBe(150);
    expect(box.h).toBe(120);
  });

  it('should restore original size on undo', () => {
    const command = new ResizeBoxCommand(box, 100, 80, 150, 120);
    command.execute();
    command.undo();

    expect(box.w).toBe(100);
    expect(box.h).toBe(80);
  });

  it('should describe the action with delta values', () => {
    const command = new ResizeBoxCommand(box, 100, 80, 150, 100);
    const description = command.describe();

    expect(description).toContain('Resize box');
    expect(description).toContain('+50');
    expect(description).toContain('+20');
  });

  it('should describe shrinking', () => {
    const command = new ResizeBoxCommand(box, 100, 80, 80, 60);
    const description = command.describe();

    expect(description).toContain('-20');
    expect(description).toContain('-20');
  });

  it('should merge consecutive resizes for same box', () => {
    const command1 = new ResizeBoxCommand(box, 100, 80, 120, 90);
    const command2 = new ResizeBoxCommand(box, 120, 90, 150, 100);

    const merged = command1.merge(command2);

    expect(merged).toBe(true);
    command1.execute();
    expect(box.w).toBe(150);
    expect(box.h).toBe(100);
  });

  it('should not merge resizes for different boxes', () => {
    const otherBox = { x: 0, y: 0, w: 50, h: 50, text: 'other' };
    const command1 = new ResizeBoxCommand(box, 100, 80, 120, 90);
    const command2 = new ResizeBoxCommand(otherBox, 50, 50, 60, 60);

    const merged = command1.merge(command2);

    expect(merged).toBe(false);
  });
});

describe('TransformBoxCommand', () => {
  let box: Box;

  beforeEach(() => {
    box = { x: 50, y: 50, w: 100, h: 100, text: 'transformable' };
  });

  it('should transform box on execute', () => {
    const command = new TransformBoxCommand(box, 50, 50, 100, 100, 75, 60, 120, 110);
    command.execute();

    expect(box.x).toBe(75);
    expect(box.y).toBe(60);
    expect(box.w).toBe(120);
    expect(box.h).toBe(110);
  });

  it('should restore original state on undo', () => {
    const command = new TransformBoxCommand(box, 50, 50, 100, 100, 75, 60, 120, 110);
    command.execute();
    command.undo();

    expect(box.x).toBe(50);
    expect(box.y).toBe(50);
    expect(box.w).toBe(100);
    expect(box.h).toBe(100);
  });

  it('should describe the action', () => {
    const command = new TransformBoxCommand(box, 50, 50, 100, 100, 75, 60, 120, 110);
    const description = command.describe();

    expect(description).toBe('Transform box');
  });

  it('should merge consecutive transforms for same box', () => {
    const command1 = new TransformBoxCommand(box, 50, 50, 100, 100, 60, 55, 105, 102);
    const command2 = new TransformBoxCommand(box, 60, 55, 105, 102, 75, 70, 120, 115);

    const merged = command1.merge(command2);

    expect(merged).toBe(true);
    command1.execute();
    expect(box.x).toBe(75);
    expect(box.y).toBe(70);
    expect(box.w).toBe(120);
    expect(box.h).toBe(115);
  });

  it('should not merge transforms for different boxes', () => {
    const otherBox = { x: 0, y: 0, w: 50, h: 50, text: 'other' };
    const command1 = new TransformBoxCommand(box, 50, 50, 100, 100, 60, 55, 105, 102);
    const command2 = new TransformBoxCommand(otherBox, 0, 0, 50, 50, 10, 10, 60, 60);

    const merged = command1.merge(command2);

    expect(merged).toBe(false);
  });
});

describe('ToggleDetectionCommand', () => {
  let item: RedactionItem;

  beforeEach(() => {
    item = {
      id: 'item-1',
      text: 'test@example.com',
      type: 'email',
      enabled: true,
      occurrences: 1,
    };
  });

  it('should toggle detection to disabled', () => {
    const command = new ToggleDetectionCommand(item, false);
    command.execute();

    expect(item.enabled).toBe(false);
  });

  it('should toggle detection to enabled', () => {
    item.enabled = false;
    const command = new ToggleDetectionCommand(item, true);
    command.execute();

    expect(item.enabled).toBe(true);
  });

  it('should restore original state on undo', () => {
    const command = new ToggleDetectionCommand(item, false);
    command.execute();
    command.undo();

    expect(item.enabled).toBe(true);
  });

  it('should describe enable action', () => {
    item.enabled = false;
    const command = new ToggleDetectionCommand(item, true);
    const description = command.describe();

    expect(description).toBe('Enable detection');
  });

  it('should describe disable action', () => {
    const command = new ToggleDetectionCommand(item, false);
    const description = command.describe();

    expect(description).toBe('Disable detection');
  });
});

describe('ToggleMultipleDetectionsCommand', () => {
  let items: RedactionItem[];

  beforeEach(() => {
    items = [
      { id: 'item-1', text: 'test@example.com', type: 'email', enabled: true, occurrences: 1 },
      { id: 'item-2', text: '555-1234', type: 'phone', enabled: false, occurrences: 1 },
      { id: 'item-3', text: '123-45-6789', type: 'ssn', enabled: true, occurrences: 1 },
    ];
  });

  it('should enable all items on execute', () => {
    const command = new ToggleMultipleDetectionsCommand(items, true);
    command.execute();

    expect(items.every(item => item.enabled)).toBe(true);
  });

  it('should disable all items on execute', () => {
    const command = new ToggleMultipleDetectionsCommand(items, false);
    command.execute();

    expect(items.every(item => !item.enabled)).toBe(true);
  });

  it('should restore original states on undo', () => {
    const command = new ToggleMultipleDetectionsCommand(items, false);
    command.execute();
    command.undo();

    expect(items[0].enabled).toBe(true);
    expect(items[1].enabled).toBe(false);
    expect(items[2].enabled).toBe(true);
  });

  it('should describe enable multiple action', () => {
    const command = new ToggleMultipleDetectionsCommand(items, true);
    const description = command.describe();

    expect(description).toBe('Enable 3 detections');
  });

  it('should describe disable multiple action', () => {
    const command = new ToggleMultipleDetectionsCommand(items, false);
    const description = command.describe();

    expect(description).toBe('Disable 3 detections');
  });
});

describe('FilterDetectionsCommand', () => {
  let items: RedactionItem[];

  beforeEach(() => {
    items = [
      { id: 'item-1', text: 'test@example.com', type: 'email', enabled: true, occurrences: 1 },
      { id: 'item-2', text: '555-1234', type: 'phone', enabled: true, occurrences: 1 },
      { id: 'item-3', text: 'test2@example.com', type: 'email', enabled: false, occurrences: 1 },
      { id: 'item-4', text: '123-45-6789', type: 'ssn', enabled: true, occurrences: 1 },
    ];
  });

  it('should filter by type when apply is true', () => {
    const command = new FilterDetectionsCommand(items, 'email', true);
    command.execute();

    expect(items[0].enabled).toBe(true);  // email - matches
    expect(items[1].enabled).toBe(false); // phone - doesn't match
    expect(items[2].enabled).toBe(true);  // email - matches
    expect(items[3].enabled).toBe(false); // ssn - doesn't match
  });

  it('should restore original states on undo', () => {
    const command = new FilterDetectionsCommand(items, 'email', true);
    command.execute();
    command.undo();

    expect(items[0].enabled).toBe(true);
    expect(items[1].enabled).toBe(true);
    expect(items[2].enabled).toBe(false);
    expect(items[3].enabled).toBe(true);
  });

  it('should enable all when filter type is null with apply true', () => {
    // First disable some items
    items[0].enabled = false;
    items[1].enabled = false;

    const command = new FilterDetectionsCommand(items, null, true);
    command.execute();

    expect(items.every(item => item.enabled)).toBe(true);
  });

  it('should describe filter action', () => {
    const command = new FilterDetectionsCommand(items, 'email', true);
    const description = command.describe();

    expect(description).toBe('Filter detections: email');
  });

  it('should describe clear filter action', () => {
    const command = new FilterDetectionsCommand(items, null, true);
    const description = command.describe();

    expect(description).toBe('Clear detection filter');
  });

  it('should not change states when apply is false', () => {
    const originalStates = items.map(item => item.enabled);

    const command = new FilterDetectionsCommand(items, 'email', false);
    command.execute();

    items.forEach((item, index) => {
      expect(item.enabled).toBe(originalStates[index]);
    });
  });
});
