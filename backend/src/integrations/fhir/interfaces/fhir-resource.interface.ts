/**
 * Interfaces para recursos FHIR
 * Baseado na especificação FHIR R4
 */

export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    text?: string;
    family?: string;
    given?: string[];
  }>;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  telecom?: Array<{
    system: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id?: string;
  status:
    | 'registered'
    | 'preliminary'
    | 'final'
    | 'amended'
    | 'corrected'
    | 'cancelled'
    | 'entered-in-error'
    | 'unknown';
  code: {
    coding: Array<{
      system: string; // Ex: 'http://loinc.org'
      code: string; // Ex: '72514-3'
      display: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string; // Ex: 'Patient/123'
    display?: string;
  };
  effectiveDateTime: string; // ISO 8601
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string; // Ex: 'http://unitsofmeasure.org'
    code?: string;
  };
  valueString?: string;
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  note?: Array<{
    text: string;
  }>;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type:
    | 'searchset'
    | 'history'
    | 'transaction'
    | 'batch'
    | 'collection'
    | 'document'
    | 'message';
  total?: number;
  entry?: Array<{
    resource: FHIRPatient | FHIRObservation | any;
  }>;
}

export interface FHIRSearchParams {
  patient?: string;
  code?: string;
  date?: string;
  _lastUpdated?: string;
  _count?: number;
  _offset?: number;
}
