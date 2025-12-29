import { describe, it, expect } from '@jest/globals';
import { validateUsername, validateColor, validateBoardName } from '@/lib/utils';

describe('Utils', () => {
  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(validateUsername('john').valid).toBe(true);
      expect(validateUsername('john_doe').valid).toBe(true);
      expect(validateUsername('john-123').valid).toBe(true);
      expect(validateUsername('JohnDoe123').valid).toBe(true);
    });

    it('should reject short usernames', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3');
    });

    it('should reject long usernames', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 20');
    });

    it('should reject usernames with invalid characters', () => {
      expect(validateUsername('john doe').valid).toBe(false);
      expect(validateUsername('john@doe').valid).toBe(false);
      expect(validateUsername('john.doe').valid).toBe(false);
    });

    it('should reject empty usernames', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('validateColor', () => {
    it('should accept valid hex colors', () => {
      expect(validateColor('#000000')).toBe(true);
      expect(validateColor('#FFFFFF')).toBe(true);
      expect(validateColor('#FF5733')).toBe(true);
      expect(validateColor('#ff5733')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateColor('000000')).toBe(false);
      expect(validateColor('#FFF')).toBe(false);
      expect(validateColor('#GGGGGG')).toBe(false);
      expect(validateColor('rgb(255,0,0)')).toBe(false);
    });
  });

  describe('validateBoardName', () => {
    it('should accept valid board names', () => {
      expect(validateBoardName('My Board').valid).toBe(true);
      expect(validateBoardName('Board-123').valid).toBe(true);
      expect(validateBoardName('Board_Name').valid).toBe(true);
    });

    it('should reject short board names', () => {
      const result = validateBoardName('AB');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3');
    });

    it('should reject long board names', () => {
      const result = validateBoardName('a'.repeat(31));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 30');
    });

    it('should reject board names with invalid characters', () => {
      expect(validateBoardName('Board@Name').valid).toBe(false);
      expect(validateBoardName('Board.Name').valid).toBe(false);
    });
  });
});












