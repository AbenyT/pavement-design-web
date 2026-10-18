// Shapes of the data exchanged with the NestJS API (they mirror backend/src/engine/design.ts).

export type LayerKey = 'ac' | 'dbm' | 'base' | 'subbase' | 'capping';
export type UnboundKey = 'subgrade' | 'capping' | 'subbase' | 'base';
export type SupportKey = UnboundKey | 'dbm';

export interface DesignInput {
  reliability: number;
  so: number;
  w18: number;
  dpsi: number;
  useDbmLayer: boolean;
  useCappingLayer: boolean;
  mrMethod: 'cbr' | 'mr';
  cbr: Partial<Record<UnboundKey, number>>;
  mrPsi: Partial<Record<SupportKey, number>>;
  a: Partial<Record<LayerKey, number>>;
  m: Partial<Record<Exclude<LayerKey, 'ac'>, number>>;
  thicknessMm: Partial<Record<LayerKey, number | null>>;
  roundUpToMm: number | null;
  enforceAashtoMinimums: boolean;
}

export interface LayerResult {
  key: LayerKey;
  number: number;
  name: string;
  heading: string;
  coefficientSymbol: string;
  a: number;
  m: number;
  supports: string;
  requiredSn: number;
  minThicknessMm: number;
  suggestedThicknessMm: number;
  thicknessMm: number;
  thicknessIsCustom: boolean;
  snContribution: number;
  cumulativeSn: number;
  checkOk: boolean;
  notes: string[];
}

export interface DesignResult {
  zr: number;
  mrPsi: Partial<Record<SupportKey, number>>;
  cbr: Partial<Record<UnboundKey, number>>;
  cbrIsEstimated: boolean;
  requiredSnOn: Partial<Record<SupportKey, number>>;
  layers: LayerResult[];
  totalSn: number;
  requiredTotalSn: number;
  totalThicknessMm: number;
  totalOk: boolean;
  failedLayers: string[];
  adequate: boolean;
  warnings: string[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface DesignSummary {
  id: string;
  projectId?: string;
  name: string;
  adequate: boolean;
  totalSn: number;
  requiredSn: number;
  totalThicknessMm: number;
  layerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem extends Project {
  designCount: number;
  adequateCount: number;
}

export interface ProjectDetail extends Project {
  designs: DesignSummary[];
}

export interface SavedDesign extends DesignSummary {
  projectId: string;
  inputs: Partial<DesignInput>;
  result: DesignResult;
  project: { id: string; name: string };
}

export interface Dashboard {
  totals: { projects: number; designs: number; adequate: number; notAdequate: number };
  perProject: Array<{
    id: string; name: string; location: string | null; designs: number; adequate: number;
    notAdequate: number; averageThicknessMm: number | null;
  }>;
  recent: Array<DesignSummary & { project: { id: string; name: string } }>;
}
