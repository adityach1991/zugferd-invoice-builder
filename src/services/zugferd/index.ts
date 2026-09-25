import { getConfig } from "@/src/config";
import { HttpZugferdService } from "./http-zugferd-service";
import type { ZugferdService } from "./zugferd-service";

export * from "./types";
export type { ZugferdService } from "./zugferd-service";

/** Factory: the application only ever sees the ZugferdService interface. */
export function createZugferdService(): ZugferdService {
  const config = getConfig();
  return new HttpZugferdService(config.zugferdWorker.baseUrl, config.zugferdWorker.timeoutMs);
}
