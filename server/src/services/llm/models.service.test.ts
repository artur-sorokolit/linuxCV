import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ModelsService, MAX_COOLDOWN_MS } from './models.service';
import { llmConfig } from '../../config/llm';

vi.mock('axios');

const catalogEntry = (
  id: string,
  contextLength: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  name: id,
  context_length: contextLength,
  pricing: { prompt: '0', completion: '0' },
  architecture: { output_modalities: ['text'] },
  ...overrides,
});

const respondWith = (models: unknown[]) => {
  vi.mocked(axios.get).mockResolvedValue({ data: { data: models } });
};

describe('ModelsService', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when building the catalog of offerable models', () => {
    it('keeps only models that are free of charge', async () => {
      respondWith([
        catalogEntry('vendor/free-one:free', 100),
        catalogEntry('vendor/paid', 100, { pricing: { prompt: '0.001', completion: '0' } }),
      ]);

      const catalog = await new ModelsService().getCatalog();

      expect(catalog.map((m) => m.id)).toEqual(['vendor/free-one:free']);
    });

    it('drops models that emit anything other than text', async () => {
      respondWith([
        catalogEntry('vendor/chat:free', 100),
        catalogEntry('vendor/image:free', 100, {
          architecture: { output_modalities: ['text', 'image'] },
        }),
      ]);

      const catalog = await new ModelsService().getCatalog();

      expect(catalog.map((m) => m.id)).toEqual(['vendor/chat:free']);
    });

    it('drops safety classifiers that answer with verdicts instead of prose', async () => {
      respondWith([
        catalogEntry('vendor/chat:free', 100),
        catalogEntry('vendor/llama-guard:free', 100),
        catalogEntry('vendor/content-safety:free', 100),
      ]);

      const catalog = await new ModelsService().getCatalog();

      expect(catalog.map((m) => m.id)).toEqual(['vendor/chat:free']);
    });

    it('leads with the preferred model so the client defaults to it', async () => {
      respondWith([catalogEntry('vendor/huge:free', 900000), catalogEntry(llmConfig.model, 1000)]);

      const catalog = await new ModelsService().getCatalog();

      expect(catalog[0]?.id).toBe(llmConfig.model);
    });

    it('orders the rest by context length, widest first', async () => {
      respondWith([
        catalogEntry('vendor/small:free', 8000),
        catalogEntry('vendor/large:free', 128000),
      ]);

      const catalog = await new ModelsService().getCatalog();

      expect(catalog.map((m) => m.id)).toEqual(['vendor/large:free', 'vendor/small:free']);
    });

    it('serves the cached catalog rather than refetching within the ttl', async () => {
      respondWith([catalogEntry('vendor/chat:free', 100)]);
      const service = new ModelsService();

      await service.getCatalog();
      await service.getCatalog();

      expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(1);
    });

    it('serves the stale catalog when the upstream refresh fails', async () => {
      respondWith([catalogEntry('vendor/chat:free', 100)]);
      const service = new ModelsService();
      await service.getCatalog();

      vi.mocked(axios.get).mockRejectedValue(new Error('upstream down'));
      vi.advanceTimersByTime(11 * 60 * 1000);
      const catalog = await service.getCatalog();

      expect(catalog.map((m) => m.id)).toEqual(['vendor/chat:free']);
    });
  });

  describe('when a model is rate limited upstream', () => {
    it('withholds it from the models offered for a chat attempt', async () => {
      respondWith([catalogEntry('vendor/a:free', 200), catalogEntry('vendor/b:free', 100)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markRateLimited('vendor/a:free', 30);
      const servable = await service.getServable();

      expect(servable.map((m) => m.id)).toEqual(['vendor/b:free']);
    });

    it('returns nothing to try when every model is cooling down', async () => {
      respondWith([catalogEntry('vendor/a:free', 200)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markRateLimited('vendor/a:free', 30);

      expect(await service.getServable()).toEqual([]);
    });

    it('still offers the full list to the model picker so the UI is never empty', async () => {
      respondWith([catalogEntry('vendor/a:free', 200)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markRateLimited('vendor/a:free', 30);
      const available = await service.getAvailable();

      expect(available.map((m) => m.id)).toEqual(['vendor/a:free']);
    });

    it('offers it again once the cooldown has elapsed', async () => {
      respondWith([catalogEntry('vendor/a:free', 200)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markRateLimited('vendor/a:free', 30);
      vi.advanceTimersByTime(31 * 1000);

      expect((await service.getServable()).map((m) => m.id)).toEqual(['vendor/a:free']);
    });

    it('clamps an implausibly long retry hint so a model is never lost for good', () => {
      const service = new ModelsService();

      service.markRateLimited('vendor/a:free', 60 * 60 * 24 * 365);
      vi.advanceTimersByTime(MAX_COOLDOWN_MS + 1000);

      expect(service.isCoolingDown('vendor/a:free')).toBe(false);
    });
  });

  describe('when the account free quota is spent', () => {
    it('withholds every model, because the cap is not per model', async () => {
      respondWith([catalogEntry('vendor/a:free', 200), catalogEntry('vendor/b:free', 100)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markFreeTierLimited(300);

      expect(await service.getServable()).toEqual([]);
    });

    it('still offers the full list to the model picker so the UI is never empty', async () => {
      respondWith([catalogEntry('vendor/a:free', 200)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markFreeTierLimited(300);
      const available = await service.getAvailable();

      expect(available.map((m) => m.id)).toEqual(['vendor/a:free']);
    });

    it('offers them again once the quota window has passed', async () => {
      respondWith([catalogEntry('vendor/a:free', 200)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markFreeTierLimited(300);
      vi.advanceTimersByTime(301 * 1000);

      expect((await service.getServable()).map((m) => m.id)).toEqual(['vendor/a:free']);
    });

    it('clamps a reset hint pointing at tomorrow so the chat is never dark all day', async () => {
      respondWith([catalogEntry('vendor/a:free', 200)]);
      const service = new ModelsService();
      await service.getCatalog();

      service.markFreeTierLimited(60 * 60 * 24);
      vi.advanceTimersByTime(MAX_COOLDOWN_MS + 1000);

      expect((await service.getServable()).map((m) => m.id)).toEqual(['vendor/a:free']);
    });
  });

  describe('when asked for a context window', () => {
    it('reports the width of a known model', async () => {
      respondWith([catalogEntry('vendor/a:free', 128000)]);
      const service = new ModelsService();
      await service.getCatalog();

      expect(await service.getContextLength('vendor/a:free')).toBe(128000);
    });

    it('falls back to a conservative width for a model missing from the catalog', async () => {
      respondWith([catalogEntry('vendor/a:free', 128000)]);
      const service = new ModelsService();
      await service.getCatalog();

      expect(await service.getContextLength('vendor/unknown:free')).toBe(8192);
    });
  });
});
