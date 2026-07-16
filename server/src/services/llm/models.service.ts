import axios from 'axios';
import { config } from '../../config/env';
import { llmConfig } from '../../config/llm';
import { ChatModel } from '../../types';

const CATALOG_URL = 'https://openrouter.ai/api/v1/models';
const CATALOG_TTL_MS = 10 * 60 * 1000;
// OpenRouter reports its own retry_after; this only covers responses that omit it.
const DEFAULT_COOLDOWN_MS = 60 * 1000;

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { output_modalities?: string[] };
}

const isFree = (m: OpenRouterModel): boolean =>
  Number(m.pricing?.prompt ?? NaN) === 0 && Number(m.pricing?.completion ?? NaN) === 0;

// Text out and nothing else: image/audio generators (e.g. Lyria) are priced free
// and list "text" among their outputs, but they are not chat models.
const isTextOnlyOut = (m: OpenRouterModel): boolean => {
  const out = m.architecture?.output_modalities;
  if (!out) {
    return true;
  }
  return out.includes('text') && out.every((modality) => modality === 'text');
};

// "NVIDIA: Nemotron 3 Super (free)" -> "Nemotron 3 Super"
const toDisplayName = (m: OpenRouterModel): string =>
  (m.name || m.id)
    .replace(/^[^:]+:\s*/, '')
    .replace(/\s*\(free\)\s*$/i, '')
    .trim();

export class ModelsService {
  private catalog: ChatModel[] = [];
  private fetchedAt = 0;
  private inFlight: Promise<ChatModel[]> | null = null;
  /** model id -> epoch ms until which it is known to be rate-limited upstream */
  private cooldowns = new Map<string, number>();

  /** Free, text-producing models, longest context first. Cached; never throws. */
  async getCatalog(): Promise<ChatModel[]> {
    const fresh = Date.now() - this.fetchedAt < CATALOG_TTL_MS;
    if (fresh && this.catalog.length > 0) {
      return this.catalog;
    }
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.fetchCatalog()
      .then((models) => {
        this.catalog = models;
        this.fetchedAt = Date.now();
        return models;
      })
      .catch((error: unknown) => {
        console.error('🔴 Failed to refresh the OpenRouter catalog:', error);
        // Serving a stale catalog beats failing the chat outright.
        return this.catalog;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  private async fetchCatalog(): Promise<ChatModel[]> {
    const headers = config.openrouterApiKey
      ? { Authorization: `Bearer ${config.openrouterApiKey}` }
      : undefined;
    const response = await axios.get(CATALOG_URL, { headers, timeout: 15000 });
    const models: OpenRouterModel[] = response.data?.data || [];

    return models
      .filter((m) => isFree(m) && isTextOnlyOut(m))
      .map((m) => ({
        id: m.id,
        name: toDisplayName(m),
        provider: m.id.split('/')[0] || 'unknown',
        contextLength: m.context_length || 0,
      }))
      .sort((a, b) => {
        // The router is the safest pick, so it leads and becomes the client's default.
        if (a.id === llmConfig.model) {
          return -1;
        }
        if (b.id === llmConfig.model) {
          return 1;
        }
        return b.contextLength - a.contextLength;
      });
  }

  /** Catalog minus models we know are rate-limited right now. */
  async getAvailable(): Promise<ChatModel[]> {
    const catalog = await this.getCatalog();
    const available = catalog.filter((m) => !this.isCoolingDown(m.id));
    // If everything is cooling down, offering the full list beats offering nothing.
    return available.length > 0 ? available : catalog;
  }

  isCoolingDown(modelId: string): boolean {
    const until = this.cooldowns.get(modelId);
    if (until === undefined) {
      return false;
    }
    if (Date.now() >= until) {
      this.cooldowns.delete(modelId);
      return false;
    }
    return true;
  }

  /** Called when a model answers 429, so it stops being offered until it recovers. */
  markRateLimited(modelId: string, retryAfterSeconds?: number): void {
    const ms = retryAfterSeconds ? retryAfterSeconds * 1000 : DEFAULT_COOLDOWN_MS;
    this.cooldowns.set(modelId, Date.now() + ms);
  }
}

export const modelsService = new ModelsService();
