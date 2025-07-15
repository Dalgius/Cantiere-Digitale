export type UserRole = 'Direttore dei Lavori (DL)' | 'Responsabile del Procedimento (RUP)' | 'Coordinatore per la Sicurezza (CSE)' | 'Impresa Esecutrice' | 'Assistente del DL';

export type Stakeholder = {
  id: string;
  name: string;
  role: UserRole;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  client: string;
  contractor: string;
  stakeholders: Stakeholder[];
};

export type Weather = {
  state: 'Sole' | 'Variabile' | 'Nuvoloso' | 'Pioggia' | 'Neve';
  temperature: number; // Celsius
  precipitation: 'Assenti' | 'Deboli' | 'Moderate' | 'Forti';
};

export type AnnotationType = 'Descrizione Lavori Svolti' | 'Istruzioni / Ordine di Servizio' | 'Osservazioni e Annotazioni' | 'Verbale di Constatazione' | 'Verbale di Accettazione Materiali' | 'Contestazione dell\'Impresa';

export type Attachment = {
  id: string;
  url: string;
  caption: string;
  type: 'image' | 'video' | 'pdf';
};

export type Annotation = {
  id: string;
  author: Stakeholder;
  timestamp: Date;
  type: AnnotationType;
  content: string;
  attachments: Attachment[];
  isSigned: boolean;
};

export type ResourceType = 'Manodopera' | 'Macchinario/Mezzo';

export type Resource = {
  id: string;
  type: ResourceType;
  description: string;
  quantity: number;
  notes?: string;
  company?: string;
};

export type DailyLog = {
  id:string;
  date: Date;
  weather: Weather;
  annotations: Annotation[];
  resources: Resource[];
  isValidated: boolean;
  project?: Project; // Optional, as it's not always present
};
