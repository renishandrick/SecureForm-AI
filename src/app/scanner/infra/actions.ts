"use server";

import { scanInfrastructure } from "@/lib/infra-scanner";
import { InfraScannerResult } from "@/types";

export async function runInfraScan(target: string): Promise<InfraScannerResult> {
  return await scanInfrastructure(target);
}
