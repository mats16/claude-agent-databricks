import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encryptedText } from '../customTypes.js';
import * as encryption from '../../utils/encryption.js';

describe('encryptedText custom type', () => {
  describe('with encryption enabled', () => {
    beforeEach(() => {
      vi.spyOn(encryption, 'isEncryptionAvailable').mockReturnValue(true);
      vi.spyOn(encryption, 'encrypt').mockImplementation((val) => `encrypted:${val}`);
      vi.spyOn(encryption, 'decrypt').mockImplementation((val) => val.replace('encrypted:', ''));
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should encrypt on toDriver', () => {
      const customTypeInstance = encryptedText('test_column');
      const result = customTypeInstance.toDriver('my-token');

      expect(result).toBe('encrypted:my-token');
      expect(encryption.encrypt).toHaveBeenCalledWith('my-token');
    });

    it('should decrypt on fromDriver', () => {
      const customTypeInstance = encryptedText('test_column');
      const result = customTypeInstance.fromDriver('encrypted:my-token');

      expect(result).toBe('my-token');
      expect(encryption.decrypt).toHaveBeenCalledWith('encrypted:my-token');
    });

    it('should handle null values on toDriver', () => {
      const customTypeInstance = encryptedText('test_column');
      const result = customTypeInstance.toDriver(null as any);

      expect(result).toBe(null);
      expect(encryption.encrypt).not.toHaveBeenCalled();
    });

    it('should handle null values on fromDriver', () => {
      const customTypeInstance = encryptedText('test_column');
      const result = customTypeInstance.fromDriver(null as any);

      expect(result).toBe(null);
      expect(encryption.decrypt).not.toHaveBeenCalled();
    });

    it('should handle undefined values on toDriver', () => {
      const customTypeInstance = encryptedText('test_column');
      const result = customTypeInstance.toDriver(undefined as any);

      expect(result).toBe(undefined);
      expect(encryption.encrypt).not.toHaveBeenCalled();
    });

    it('should handle undefined values on fromDriver', () => {
      const customTypeInstance = encryptedText('test_column');
      const result = customTypeInstance.fromDriver(undefined as any);

      expect(result).toBe(undefined);
      expect(encryption.decrypt).not.toHaveBeenCalled();
    });
  });

  describe('with encryption disabled (plaintext mode)', () => {
    beforeEach(() => {
      vi.spyOn(encryption, 'isEncryptionAvailable').mockReturnValue(false);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should pass through plaintext on toDriver', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const customTypeInstance = encryptedText('test_column');

      const result = customTypeInstance.toDriver('my-token');

      expect(result).toBe('my-token'); // Plaintext
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('PLAINTEXT')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should pass through plaintext on fromDriver', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const customTypeInstance = encryptedText('test_column');

      const result = customTypeInstance.fromDriver('my-token');

      expect(result).toBe('my-token'); // Plaintext
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('PLAINTEXT')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should warn about plaintext storage on toDriver', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const customTypeInstance = encryptedText('test_column');

      customTypeInstance.toDriver('sensitive-data');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('production')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should warn about plaintext reading on fromDriver', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const customTypeInstance = encryptedText('test_column');

      customTypeInstance.fromDriver('sensitive-data');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB]')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('PLAINTEXT')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle null values in plaintext mode', () => {
      const customTypeInstance = encryptedText('test_column');

      const resultTo = customTypeInstance.toDriver(null as any);
      const resultFrom = customTypeInstance.fromDriver(null as any);

      expect(resultTo).toBe(null);
      expect(resultFrom).toBe(null);
    });

    it('should handle round-trip in plaintext mode', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const customTypeInstance = encryptedText('test_column');

      const original = 'my-secret-token';
      const stored = customTypeInstance.toDriver(original);
      const retrieved = customTypeInstance.fromDriver(stored);

      expect(stored).toBe(original);
      expect(retrieved).toBe(original);

      consoleWarnSpy.mockRestore();
    });
  });
});
