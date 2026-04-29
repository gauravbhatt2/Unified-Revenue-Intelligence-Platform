import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HubspotSync } from './hubspot-sync';
import * as api from '../lib/api';

describe('HubspotSync component', () => {
  it('renders button and triggers sync mutation', async () => {
    const spy = vi.spyOn(api, 'syncHubspot').mockResolvedValue({ ingested: 1, failed: 0 });
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <HubspotSync tenantId="tenant-1" />
      </QueryClientProvider>,
    );

    const button = screen.getByRole('button', { name: /sync hubspot/i });
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalledWith('tenant-1', 20);
    });
  });
});
