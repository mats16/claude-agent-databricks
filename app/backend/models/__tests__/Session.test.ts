import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { Session, SessionDraft } from '../Session.js';

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

describe('SessionDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should generate new TypeID', () => {
      const draft = new SessionDraft();

      expect(draft.id).toMatch(/^session_[0-9a-z]{26}$/);
    });
  });

  describe('id getter', () => {
    it('should return full TypeID string', () => {
      const draft = new SessionDraft();

      expect(draft.id).toMatch(/^session_[0-9a-z]{26}$/);
      expect(draft.id.startsWith('session_')).toBe(true);
    });
  });

  describe('suffix getter', () => {
    it('should return UUIDv7 Base32 without prefix', () => {
      const draft = new SessionDraft();

      expect(draft.suffix).toHaveLength(26);
      expect(draft.id).toBe(`session_${draft.suffix}`);
    });
  });

  describe('shortSuffix getter', () => {
    it('should return last 12 characters of suffix', () => {
      const draft = new SessionDraft();

      expect(draft.shortSuffix).toHaveLength(12);
      expect(draft.suffix.endsWith(draft.shortSuffix)).toBe(true);
    });
  });

  describe('localPath getter', () => {
    it('should use sessionsBase from config', () => {
      const draft = new SessionDraft();

      expect(draft.localPath.startsWith('/home/test/ws/')).toBe(true);
      expect(draft.localPath).toMatch(/\/home\/test\/ws\/[0-9a-z]{12}$/);
    });
  });

  describe('appName getter', () => {
    it('should return dev-{suffix} format', () => {
      const draft = new SessionDraft();

      expect(draft.appName).toMatch(/^dev-[0-9a-z]{26}$/);
    });

    it('should have max length of 30 characters', () => {
      const draft = new SessionDraft();

      // dev- (4 chars) + suffix (26 chars) = 30 chars
      expect(draft.appName.length).toBe(30);
    });
  });

  describe('gitBranch getter', () => {
    it('should return claude/session-{shortSuffix} format', () => {
      const draft = new SessionDraft();

      expect(draft.gitBranch).toMatch(/^claude\/session-[0-9a-z]{12}$/);
    });
  });

  describe('ensureLocalDir', () => {
    it('should create directory with recursive option', () => {
      const draft = new SessionDraft();

      draft.ensureLocalDir();

      expect(fs.mkdirSync).toHaveBeenCalledWith(draft.localPath, {
        recursive: true,
      });
    });
  });
});

describe('Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should require id and claudeCodeSessionId', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const claudeCodeSessionId = 'claude-session-123';
      const session = new Session(existingId, claudeCodeSessionId);

      expect(session.id).toBe(existingId);
      expect(session.claudeCodeSessionId).toBe(claudeCodeSessionId);
    });

    it('should throw error for invalid TypeID format', () => {
      expect(() => new Session('invalid-id', 'claude-123')).toThrow();
    });

    it('should throw error for wrong TypeID prefix', () => {
      expect(
        () => new Session('user_01h455vb4pex5vsknk084sn02q', 'claude-123')
      ).toThrow("Invalid session ID prefix: expected 'session', got 'user'");
    });
  });

  describe('id getter', () => {
    it('should return full TypeID string', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      expect(session.id).toBe(existingId);
    });
  });

  describe('suffix getter', () => {
    it('should return UUIDv7 Base32 without prefix', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      expect(session.suffix).toBe('01h455vb4pex5vsknk084sn02q');
    });
  });

  describe('shortSuffix getter', () => {
    it('should return last 12 characters of suffix', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      // suffix: 01h455vb4pex5vsknk084sn02q (26 chars)
      // slice(-12): sknk084sn02q (12 chars)
      expect(session.shortSuffix).toBe('sknk084sn02q');
    });

    it('should have 12 character length', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      expect(session.shortSuffix).toHaveLength(12);
    });
  });

  describe('localPath getter', () => {
    it('should return path with shortSuffix', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      expect(session.localPath).toBe('/home/test/ws/sknk084sn02q');
    });
  });

  describe('appName getter', () => {
    it('should return dev-{suffix} format', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      expect(session.appName).toBe('dev-01h455vb4pex5vsknk084sn02q');
    });

    it('should have max length of 30 characters', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      // dev- (4 chars) + suffix (26 chars) = 30 chars
      expect(session.appName.length).toBe(30);
    });
  });

  describe('gitBranch getter', () => {
    it('should return claude/session-{shortSuffix} format', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      expect(session.gitBranch).toBe('claude/session-sknk084sn02q');
    });
  });

  describe('claudeCodeSessionId', () => {
    it('should be required and readonly', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const claudeCodeSessionId = 'claude-session-123';
      const session = new Session(existingId, claudeCodeSessionId);

      expect(session.claudeCodeSessionId).toBe(claudeCodeSessionId);
    });
  });

  describe('ensureLocalDir', () => {
    it('should create directory with recursive option', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const session = new Session(existingId, 'claude-123');

      session.ensureLocalDir();

      expect(fs.mkdirSync).toHaveBeenCalledWith('/home/test/ws/sknk084sn02q', {
        recursive: true,
      });
    });
  });

  describe('fromRecord static method', () => {
    it('should create Session from id and claudeCodeSessionId', () => {
      const existingId = 'session_01h455vb4pex5vsknk084sn02q';
      const claudeCodeSessionId = 'claude-session-123';
      const session = Session.fromRecord(existingId, claudeCodeSessionId);

      expect(session.id).toBe(existingId);
      expect(session.claudeCodeSessionId).toBe(claudeCodeSessionId);
    });

    it('should throw error for invalid string', () => {
      expect(() => Session.fromRecord('invalid', 'claude-123')).toThrow();
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
      expect(Session.isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(
        false
      );
    });
  });
});

describe('SessionDraft to Session flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should support draft → session creation flow', () => {
    // Create draft
    const draft = new SessionDraft();
    draft.ensureLocalDir();

    // Simulate SDK init returning claudeCodeSessionId
    const claudeCodeSessionId = 'claude-session-abc123';

    // Create session from draft ID
    const session = Session.fromRecord(draft.id, claudeCodeSessionId);

    // Verify same ID
    expect(session.id).toBe(draft.id);
    expect(session.suffix).toBe(draft.suffix);
    expect(session.shortSuffix).toBe(draft.shortSuffix);
    expect(session.localPath).toBe(draft.localPath);
    expect(session.appName).toBe(draft.appName);
    expect(session.gitBranch).toBe(draft.gitBranch);

    // Session has claudeCodeSessionId
    expect(session.claudeCodeSessionId).toBe(claudeCodeSessionId);
  });

  it('should generate unique IDs for multiple drafts', () => {
    const draft1 = new SessionDraft();
    const draft2 = new SessionDraft();
    const draft3 = new SessionDraft();

    const ids = [draft1.id, draft2.id, draft3.id];
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });

  it('should be sortable by creation time (TypeID property)', () => {
    // TypeID uses UUIDv7 which is time-ordered
    const draft1 = new SessionDraft();
    const draft2 = new SessionDraft();
    const draft3 = new SessionDraft();

    const ids = [draft3.id, draft1.id, draft2.id];
    const sortedIds = [...ids].sort();

    // Sessions created in order should sort in creation order
    expect(sortedIds).toEqual([draft1.id, draft2.id, draft3.id]);
  });

  it('should have consistent suffix extraction', () => {
    const existingId = 'session_01h455vb4pex5vsknk084sn02q';
    const session = new Session(existingId, 'claude-123');

    // Verify suffix relationships
    expect(session.id).toBe(`session_${session.suffix}`);
    expect(session.suffix.endsWith(session.shortSuffix)).toBe(true);
    expect(session.shortSuffix).toHaveLength(12);
  });
});
