// Public API of the settings module (nest-module-map.md §2.1 rule 1).
export { SettingsModule } from './settings.module';
export { SettingsService, PLATFORM_SETTINGS_ENTITY_ID } from './services/settings.service';
export {
  defaultSettings,
  settingsSchema,
  SETTING_KEYS,
  type PlatformSettings,
  type SettingKey,
} from './domain/settings.schema';
