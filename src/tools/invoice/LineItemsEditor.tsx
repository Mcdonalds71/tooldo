import { PlusIcon, TrashIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '../../design-system/components/Button';
import { IconButton } from '../../design-system/components/IconButton';
import { formatMoney, lineItemAmount } from './money';
import type { LineItem } from './types';

export interface LineItemsEditorProps {
  readonly lineItems: readonly LineItem[];
  readonly onAdd: () => void;
  readonly onUpdate: (id: string, patch: Partial<LineItem>) => void;
  readonly onRemove: (id: string) => void;
}

export function LineItemsEditor({ lineItems, onAdd, onUpdate, onRemove }: LineItemsEditorProps) {
  return (
    <div className="line-items">
      <div className="line-items__head" aria-hidden>
        <span>Description</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span>Amount</span>
        <span />
      </div>

      <ul className="line-items__list">
        {lineItems.map((item, index) => (
          <li className="line-items__row" key={item.id}>
            <label className="sr-only" htmlFor={`item-description-${item.id}`}>
              Line {index + 1} description
            </label>
            <input
              id={`item-description-${item.id}`}
              className="field__control line-items__description"
              value={item.description}
              onChange={(event) => onUpdate(item.id, { description: event.target.value })}
              placeholder="Website homepage build"
            />

            <label className="sr-only" htmlFor={`item-qty-${item.id}`}>
              Line {index + 1} quantity
            </label>
            <input
              id={`item-qty-${item.id}`}
              className="field__control line-items__qty"
              type="number"
              min="0"
              step="1"
              value={item.quantity}
              onChange={(event) => onUpdate(item.id, { quantity: event.target.value })}
            />

            <label className="sr-only" htmlFor={`item-price-${item.id}`}>
              Line {index + 1} unit price
            </label>
            <input
              id={`item-price-${item.id}`}
              className="field__control line-items__price"
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(event) => onUpdate(item.id, { unitPrice: event.target.value })}
              placeholder="0.00"
            />

            <span className="line-items__amount">{formatMoney(lineItemAmount(item))}</span>

            <IconButton
              icon={TrashIcon}
              label={`Remove line ${index + 1}`}
              variant="ghost"
              size="sm"
              disabled={lineItems.length <= 1}
              onClick={() => onRemove(item.id)}
            />
          </li>
        ))}
      </ul>

      <Button variant="secondary" size="sm" icon={PlusIcon} onClick={onAdd}>
        Add line item
      </Button>
    </div>
  );
}
