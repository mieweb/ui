import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges conditional classes and dedupes conflicts', () => {
    expect(cn('px-4 py-2', 'px-2')).toBe('py-2 px-2');
    const hidden = false as boolean;
    expect(cn('text-sm', hidden && 'hidden')).toBe('text-sm');
  });

  describe('physical ⇄ logical conflicts (RTL migration compat)', () => {
    it('lets a physical consumer override replace an internal logical class', () => {
      expect(cn('ms-1', 'ml-2')).toBe('ml-2');
      expect(cn('me-1', 'mr-2')).toBe('mr-2');
      expect(cn('ps-1', 'pl-2')).toBe('pl-2');
      expect(cn('pe-1', 'pr-2')).toBe('pr-2');
      expect(cn('start-0', 'left-4')).toBe('left-4');
      expect(cn('end-0', 'right-4')).toBe('right-4');
      expect(cn('rounded-s-md', 'rounded-l-lg')).toBe('rounded-l-lg');
      expect(cn('rounded-e-md', 'rounded-r-lg')).toBe('rounded-r-lg');
      expect(cn('rounded-ss-md', 'rounded-tl-lg')).toBe('rounded-tl-lg');
      expect(cn('border-s-2', 'border-l-4')).toBe('border-l-4');
      expect(cn('border-e-primary-500', 'border-r-primary-700')).toBe(
        'border-r-primary-700'
      );
    });

    it('lets a logical consumer override replace an internal physical class', () => {
      expect(cn('ml-1', 'ms-2')).toBe('ms-2');
      expect(cn('pr-1', 'pe-2')).toBe('pe-2');
      expect(cn('left-0', 'start-4')).toBe('start-4');
    });

    it('still merges text alignment (built-in group)', () => {
      expect(cn('text-start', 'text-left')).toBe('text-left');
      expect(cn('text-left', 'text-start')).toBe('text-start');
    });

    it('does not conflict across different edges', () => {
      expect(cn('ms-1', 'me-2')).toBe('ms-1 me-2');
      expect(cn('ms-1', 'mr-2')).toBe('ms-1 mr-2');
    });
  });
});
