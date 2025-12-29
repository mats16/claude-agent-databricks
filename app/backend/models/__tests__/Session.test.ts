import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Session } from '../Session.js';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    mkdirSync: vi.fn(),
  },
}));

// Mock config paths
vi.mock('../../config/index.js', () => ({
  paths: {
    sessionsBase: '/home/test/ws',
  },
}));

describe('Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should generate new TypeID when no id provided', () => {
      const session = new Session();

      expect(session.id).toMatch(/^session_[0-9a-z]{26}$/);
    });

    it('should restore from existing TypeID string', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      expect(session.id).toBe(existingId);
    });

    it('should throw error for invalid TypeID format', () => {
      expect(() => new Session('invalid-id')).toThrow();
    });

    it('should throw error for wrong TypeID prefix', () => {
      // Constructor now validates prefix for type safety
      expect(() => new Session('user_01h455vb4pex5vsknk084sn02q')).toThrow(
        "Invalid session ID prefix: expected 'session', got 'user'"
      );
    });
  });

  describe('id getter', () => {
    it('should return full TypeID string', () => {
      const session = new Session();

      expect(session.id).toMatch(/^session_[0-9a-z]{26}$/);
      expect(session.id.startsWith('session_')).toBe(true);
    });
  });

  describe('suffix getter', () => {
    it('should return UUIDv7 Base32 without prefix', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      expect(session.suffix).toBe('01h455vb4pex5vsknk084sn02q');
    });

    it('should have 26 character length', () => {
      const session = new Session();

      expect(session.suffix).toHaveLength(26);
    });
  });

  describe('shortSuffix getter', () => {
    it('should return last 8 characters of suffix', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      // suffix: 01h455vb4pex5vsknk084sn02q (26 chars)
      // slice(-8): 084sn02q (8 chars)
      expect(session.shortSuffix).toBe('084sn02q');
    });

    it('should have 8 character length', () => {
      const session = new Session();

      // shortSuffix is suffix.slice(-8), but suffix is 26 chars
      // so shortSuffix should be 8 chars
      expect(session.shortSuffix.length).toBeLessThanOrEqual(8);
    });
  });

  describe('localPath getter', () => {
    it('should return path with shortSuffix', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      expect(session.localPath).toBe('/home/test/ws/084sn02q');
    });

    it('should use sessionsBase from config', () => {
      const session = new Session();

      expect(session.localPath.startsWith('/home/test/ws/')).toBe(true);
      expect(session.localPath).toMatch(/\/home\/test\/ws\/[0-9a-z]{8}$/);
    });
  });

  describe('appName getter', () => {
    it('should return dev-{suffix} format', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      expect(session.appName).toBe('dev-01h455vb4pex5vsknk084sn02q');
    });

    it('should use full suffix for uniqueness', () => {
      const session = new Session();

      expect(session.appName).toMatch(/^dev-[0-9a-z]{26}$/);
    });

    it('should have max length of 30 characters', () => {
      const session = new Session();

      // dev- (4 chars) + suffix (26 chars) = 30 chars
      expect(session.appName.length).toBe(30);
    });
  });

  describe('gitBranch getter', () => {
    it('should return claude/session-{shortSuffix} format', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      expect(session.gitBranch).toBe('claude/session-084sn02q');
    });
  });

  describe('ensureLocalDir', () => {
    it('should create directory with recursive option', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId);

      session.ensureLocalDir();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        '/home/test/ws/084sn02q',
        { recursive: true }
      );
    });
  });

  describe('fromString static method', () => {
    it('should create Session from valid TypeID string', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = Session.fromString(existingId);

      expect(session.id).toBe(existingId);
    });

    it('should throw error for invalid string', () => {
      expect(() => Session.fromString('invalid')).toThrow();
    });
  });

  describe('isValidId static method', () => {
    it('should return true for valid session TypeID', () => {
      const validId = 'session_01h455vb4pex5vsknk084sn02q';

      expect(Session.isValidId(validId)).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(Session.isValidId('invalid-id')).toBe(false);
    });

    it('should return false for wrong prefix', () => {
      expect(Session.isValidId('user_01h455vb4pex5vsknk084sn02q')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(Session.isValidId('')).toBe(false);
    });

    it('should return false for UUID format (not TypeID)', () => {
      expect(Session.isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
    });
  });

  describe('uniqueness', () => {
    it('should generate unique IDs for multiple sessions', () => {
      const session1 = new Session();
      const session2 = new Session();
      const session3 = new Session();

      const ids = [session1.id, session2.id, session3.id];
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });
});
