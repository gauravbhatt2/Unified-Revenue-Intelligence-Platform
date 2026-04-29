export interface NormalizedParticipant {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface NormalizedInteraction {
  type: string;
  timestamp: Date;
  summary?: string;
  subject?: string;
  direction?: string;
  sourceId?: string;
  participants: NormalizedParticipant[];
}
