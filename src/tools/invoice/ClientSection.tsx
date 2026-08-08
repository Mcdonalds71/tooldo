import { Card } from '../../design-system/components/Card';
import { TextField } from '../../design-system/components/TextField';
import type { ClientInfo } from './types';

export interface ClientSectionProps {
  readonly client: ClientInfo;
  readonly onChange: (patch: Partial<ClientInfo>) => void;
}

export function ClientSection({ client, onChange }: ClientSectionProps) {
  return (
    <Card tone="calm" className="invoice-form__section">
      <h3>Bill to</h3>
      <div className="invoice-form__grid">
        <TextField
          label="Client name"
          value={client.name}
          onChange={(name) => onChange({ name })}
          placeholder="Harlow & Finch Co"
        />
        <TextField
          label="Client email"
          value={client.email}
          onChange={(email) => onChange({ email })}
          type="email"
          placeholder="accounts@harlowfinch.com"
        />
        <TextField
          label="Client address"
          value={client.address}
          onChange={(address) => onChange({ address })}
          placeholder="22 Riverside Ave, Denver, CO"
        />
      </div>
    </Card>
  );
}
