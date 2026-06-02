import { BadRequestException, Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingDto } from './dto/update-setting.dto';

const ALLOWED_TYPES = new Set(['string', 'json', 'number', 'boolean']);

// Keys that must be present and non-empty
const REQUIRED_KEYS = new Set([
  'site.name',
  'site.description',
  'contact.email',
  'social.links',
  'shipping.origin',
  'tax.rate',
  'currency',
  'email.smtp',
  'payment.gateway',
]);

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  findByKey(key: string) {
    return this.repo.findByKey(key);
  }

  private isEmptyValueForType(value: string, type: string) {
    if (type === 'json') {
      try {
        const parsed = JSON.parse(value);
        if (parsed === null) return true;
        if (typeof parsed === 'object') return Object.keys(parsed).length === 0;
        if (typeof parsed === 'string') return parsed.trim().length === 0;
      } catch (e) {
        return true;
      }
      return false;
    }
    return value == null || String(value).trim().length === 0;
  }

  private sanitizeString(v: string) {
    if (v == null) return '';
    // trim, remove control chars, escape angle brackets
    const trimmed = String(v)
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '');
    return trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private sanitizeJsonString(v: string) {
    try {
      const parsed = JSON.parse(v);
      const sanitizeRec = (obj: any): any => {
        if (obj == null) return obj;
        if (typeof obj === 'string') return this.sanitizeString(obj);
        if (Array.isArray(obj)) return obj.map(sanitizeRec);
        if (typeof obj === 'object') {
          const out: any = {};
          for (const k of Object.keys(obj)) out[k] = sanitizeRec(obj[k]);
          return out;
        }
        return obj;
      };
      return JSON.stringify(sanitizeRec(parsed));
    } catch (e) {
      throw new BadRequestException('Invalid JSON payload');
    }
  }

  private validateAndSanitize(key: string, dto: UpdateSettingDto) {
    // Determine target type: prefer provided dto.type, else existing setting type
    const providedType = dto.type?.toLowerCase();

    if (providedType && !ALLOWED_TYPES.has(providedType)) {
      throw new BadRequestException(`Unsupported type: ${dto.type}`);
    }

    return this.repo.findByKey(key).then((existing) => {
      const type = providedType ?? existing?.type ?? 'string';

      if (!ALLOWED_TYPES.has(type))
        throw new BadRequestException(`Unsupported type: ${type}`);

      let sanitizedValue: string;

      if (type === 'string') {
        sanitizedValue = this.sanitizeString(dto.value);
        // If email-like key, simple email check
        if (key.includes('email') && sanitizedValue.length > 0) {
          const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
          if (!emailRe.test(sanitizedValue))
            throw new BadRequestException('Invalid email address');
        }
      } else if (type === 'json') {
        sanitizedValue = this.sanitizeJsonString(dto.value);
      } else if (type === 'number') {
        const n = Number(dto.value);
        if (!Number.isFinite(n))
          throw new BadRequestException('Invalid number value');
        sanitizedValue = String(n);
      } else if (type === 'boolean') {
        const v = String(dto.value).toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes') sanitizedValue = 'true';
        else if (v === 'false' || v === '0' || v === 'no')
          sanitizedValue = 'false';
        else throw new BadRequestException('Invalid boolean value');
      } else {
        throw new BadRequestException('Unsupported type');
      }

      // Required keys cannot be empty
      if (
        REQUIRED_KEYS.has(key) &&
        this.isEmptyValueForType(sanitizedValue, type)
      ) {
        throw new BadRequestException(`${key} is required and cannot be empty`);
      }

      const out: UpdateSettingDto = {
        value: sanitizedValue,
      } as any;
      if (dto.type) out.type = dto.type;
      if (dto.description)
        out.description = this.sanitizeString(dto.description);
      return out;
    });
  }

  async upsertByKey(key: string, dto: UpdateSettingDto) {
    const cleaned = await this.validateAndSanitize(key, dto);
    return this.repo.upsertByKey(key, cleaned as UpdateSettingDto);
  }
}
