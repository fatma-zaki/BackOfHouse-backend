import { ISODateString, UUID } from '../common/types';

/** One flexible model instead of three parallel systems. */
export enum OpportunityType {
  Job = 'job',
  Project = 'project',
  SupplierRequest = 'supplier_request',
}

export enum OpportunityStatus {
  Draft = 'draft',
  Open = 'open',
  Closed = 'closed',
  Archived = 'archived',
}

export interface OpportunityEntity {
  id: UUID;
  company_id: UUID | null;
  title: string;
  description: string | null;
  type: OpportunityType;
  location: string | null;
  deadline: ISODateString | null;
  status: OpportunityStatus;
  created_by: UUID;
  created_at: ISODateString;
  updated_at: ISODateString;
}
