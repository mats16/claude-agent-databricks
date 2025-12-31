import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserSettings,
  updateUserSettings,
  DEFAULT_USER_SETTINGS,
} from './user-settings.service.js';
import * as settingsRepo from '../db/settings.js';
import type { SelectSettings } from '../db/schema.js';

// Mock database to avoid DATABASE_URL requirement
vi.mock('../db/index.js', () => ({
  db: {},
}));

// Mock dependencies
vi.mock('../db/settings.js');

describe('user-settings.service', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DEFAULT_USER_SETTINGS', () => {
    it('should have claudeConfigAutoPush enabled by default', () => {
      expect(DEFAULT_USER_SETTINGS.claudeConfigAutoPush).toBe(true);
    });

    it('should be a const object', () => {
      // This verifies the "as const" type assertion is working
      const settings: typeof DEFAULT_USER_SETTINGS = DEFAULT_USER_SETTINGS;
      expect(settings).toEqual({ claudeConfigAutoPush: true });
    });
  });

  describe('getUserSettings', () => {
    it('should return user settings when they exist', async () => {
      // Arrange
      const mockSettings: SelectSettings = {
        userId: mockUserId,
        claudeConfigAutoPush: false,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      vi.mocked(settingsRepo.getSettings).mockResolvedValue(mockSettings);

      // Act
      const result = await getUserSettings(mockUserId);

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        claudeConfigAutoPush: false,
      });

      expect(settingsRepo.getSettings).toHaveBeenCalledWith(mockUserId);
    });

    it('should return default settings when user settings do not exist', async () => {
      // Arrange
      vi.mocked(settingsRepo.getSettings).mockResolvedValue(null);

      // Act
      const result = await getUserSettings(mockUserId);

      // Assert
      expect(result).toEqual({
        userId: mockUserId,
        claudeConfigAutoPush: true, // DEFAULT_USER_SETTINGS value
      });

      expect(settingsRepo.getSettings).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle user with auto-push enabled', async () => {
      // Arrange
      const mockSettings: SelectSettings = {
        userId: mockUserId,
        claudeConfigAutoPush: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      vi.mocked(settingsRepo.getSettings).mockResolvedValue(mockSettings);

      // Act
      const result = await getUserSettings(mockUserId);

      // Assert
      expect(result.claudeConfigAutoPush).toBe(true);
    });

    it('should only include relevant fields in response', async () => {
      // Arrange
      const mockSettings: SelectSettings = {
        userId: mockUserId,
        claudeConfigAutoPush: false,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T12:00:00Z'),
      };

      vi.mocked(settingsRepo.getSettings).mockResolvedValue(mockSettings);

      // Act
      const result = await getUserSettings(mockUserId);

      // Assert
      // Should not include createdAt/updatedAt in response
      expect(result).toEqual({
        userId: mockUserId,
        claudeConfigAutoPush: false,
      });
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const dbError = new Error('Database read failed');
      vi.mocked(settingsRepo.getSettings).mockRejectedValue(dbError);

      // Act & Assert
      await expect(getUserSettings(mockUserId)).rejects.toThrow('Database read failed');
    });
  });

  describe('updateUserSettings', () => {
    it('should update claudeConfigAutoPush to false', async () => {
      // Arrange
      vi.mocked(settingsRepo.upsertSettings).mockResolvedValue(undefined);

      // Act
      await updateUserSettings(mockUserId, { claudeConfigAutoPush: false });

      // Assert
      expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(mockUserId, {
        claudeConfigAutoPush: false,
      });
    });

    it('should update claudeConfigAutoPush to true', async () => {
      // Arrange
      vi.mocked(settingsRepo.upsertSettings).mockResolvedValue(undefined);

      // Act
      await updateUserSettings(mockUserId, { claudeConfigAutoPush: true });

      // Assert
      expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(mockUserId, {
        claudeConfigAutoPush: true,
      });
    });

    it('should throw error when no fields provided', async () => {
      // Act & Assert
      await expect(updateUserSettings(mockUserId, {})).rejects.toThrow(
        'At least one setting field must be provided'
      );

      // Should not call repository
      expect(settingsRepo.upsertSettings).not.toHaveBeenCalled();
    });

    it('should validate that at least one field is provided', async () => {
      // Arrange
      const emptyUpdates = {};

      // Act & Assert
      await expect(updateUserSettings(mockUserId, emptyUpdates)).rejects.toThrow(
        'At least one setting field must be provided'
      );
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const dbError = new Error('Database write failed');
      vi.mocked(settingsRepo.upsertSettings).mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        updateUserSettings(mockUserId, { claudeConfigAutoPush: false })
      ).rejects.toThrow('Database write failed');
    });

    it('should work when called with partial updates', async () => {
      // Arrange
      vi.mocked(settingsRepo.upsertSettings).mockResolvedValue(undefined);

      // Act - Only update one field
      await updateUserSettings(mockUserId, {
        claudeConfigAutoPush: false,
      });

      // Assert
      expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(mockUserId, {
        claudeConfigAutoPush: false,
      });
    });

    it('should create settings if they do not exist (via upsert)', async () => {
      // Arrange - Repository's upsertSettings handles both create and update
      vi.mocked(settingsRepo.upsertSettings).mockResolvedValue(undefined);

      // Act
      await updateUserSettings(mockUserId, { claudeConfigAutoPush: true });

      // Assert - Service just calls upsert, repository handles create vs update logic
      expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(mockUserId, {
        claudeConfigAutoPush: true,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should use defaults for new user, then allow updates', async () => {
      // Scenario 1: New user gets defaults
      vi.mocked(settingsRepo.getSettings).mockResolvedValue(null);

      const defaultSettings = await getUserSettings(mockUserId);
      expect(defaultSettings.claudeConfigAutoPush).toBe(true);

      // Scenario 2: User updates settings
      vi.mocked(settingsRepo.upsertSettings).mockResolvedValue(undefined);

      await updateUserSettings(mockUserId, { claudeConfigAutoPush: false });
      expect(settingsRepo.upsertSettings).toHaveBeenCalledWith(mockUserId, {
        claudeConfigAutoPush: false,
      });

      // Scenario 3: User retrieves updated settings
      const updatedSettingsDb: SelectSettings = {
        userId: mockUserId,
        claudeConfigAutoPush: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(settingsRepo.getSettings).mockResolvedValue(updatedSettingsDb);

      const updatedSettings = await getUserSettings(mockUserId);
      expect(updatedSettings.claudeConfigAutoPush).toBe(false);
    });

    it('should handle toggling auto-push on and off', async () => {
      // Start with auto-push enabled
      const settingsEnabled: SelectSettings = {
        userId: mockUserId,
        claudeConfigAutoPush: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(settingsRepo.getSettings).mockResolvedValue(settingsEnabled);

      let settings = await getUserSettings(mockUserId);
      expect(settings.claudeConfigAutoPush).toBe(true);

      // Disable auto-push
      vi.mocked(settingsRepo.upsertSettings).mockResolvedValue(undefined);
      await updateUserSettings(mockUserId, { claudeConfigAutoPush: false });

      // Verify disabled
      const settingsDisabled: SelectSettings = {
        userId: mockUserId,
        claudeConfigAutoPush: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(settingsRepo.getSettings).mockResolvedValue(settingsDisabled);

      settings = await getUserSettings(mockUserId);
      expect(settings.claudeConfigAutoPush).toBe(false);

      // Re-enable auto-push
      await updateUserSettings(mockUserId, { claudeConfigAutoPush: true });

      vi.mocked(settingsRepo.getSettings).mockResolvedValue(settingsEnabled);
      settings = await getUserSettings(mockUserId);
      expect(settings.claudeConfigAutoPush).toBe(true);
    });
  });
});
