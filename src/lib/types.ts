

export type UserRole = 'Direttore dei Lavori (DL)' | 'Responsabile del Procedimento (RUP)' | 'Coordinatore per la Sicurezza (CSE)' | 'Impresa Esecutrice' | 'Assistente del DL';

export type Stakeholder = {
  id: string;
  name: string;
  role: UserRole;
};

export type ResourceType = 'Manodopera' | 'Macchinario/Mezzo';

// NUOVO TIPO per la risorsa in anagrafica
export type RegisteredResource = {
  id: string; // ID unico per la risorsa
  type: ResourceType; // 'Manodopera' o 'Macchinario/Mezzo'
  description: string; // Es. "Operaio Specializzato"
  name: string; // Es. "Mario Rossi" o "Martello Demolitore BFG 9000"
  company?: string; // Impresa di appartenenza (opzionale)
};

export type Project = {
  id: string;
  name: string;
  description: string;
  client: string;
  contractor: string;
  stakeholders: Stakeholder[];
  ownerId: string; // The UID of the user who created the project
  lastLogDate?: Date; // The date of the most recent log entry
  registeredResources?: RegisteredResource[]; // NUOVO CAMPO: elenco delle risorse pre-registrate
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

export type Resource = {
  id:string;
  registeredResourceId?: string; // ID della risorsa in anagrafica (se applicabile)
  type: ResourceType;
  description: string; // Es. "Operaio Specializzato"
  name: string; // Es. "Mario Rossi" o "Martello Demolitore BFG 9000"
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
