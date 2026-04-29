import { ComplianceService } from './compliance.service';

describe('ComplianceService helpers', () => {
  const service = new ComplianceService({} as any);

  const interactions = [
    {
      id: 'i1',
      participants: [
        { email: 'a@example.com', contact: { isOptedOut: false, firstName: 'A', lastName: 'One' } },
      ],
    },
    {
      id: 'i2',
      participants: [
        { email: 'b@example.com', contact: { isOptedOut: true, firstName: 'B', lastName: 'Two' } },
      ],
    },
  ];

  it('filters out opted-out interactions in exclude mode', () => {
    const filtered = service.filterOptedOut(interactions as any[]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('i1');
  });

  it('redacts opted-out participant fields in redact mode', () => {
    const redacted = service.redactOptedOut(interactions as any[]);
    expect(redacted[1].participants[0].email).toBe('redacted@privacy.local');
    expect(redacted[1].participants[0].contact.firstName).toBeNull();
  });
});
