export interface ResolvedContact {
  contactId: string;
  email: string;
  accountId: string | null;
  isNew: boolean;
  role?: string;
}
