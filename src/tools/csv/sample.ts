import { tableToCsv } from './csvParser';
import type { DataFile, ParsedTable } from './types';

const SAMPLE_TABLE: ParsedTable = {
  headers: ['name', 'category', 'price', 'inStock'],
  rows: [
    { name: 'Trail Runner Jacket', category: 'Outerwear', price: '89.00', inStock: 'true' },
    { name: 'Canvas Tote', category: 'Bags', price: '24.50', inStock: 'true' },
    { name: 'Wool Beanie', category: 'Accessories', price: '18.00', inStock: 'false' },
    { name: 'Leather Wallet', category: 'Accessories', price: '42.00', inStock: 'true' },
    { name: 'Rain Shell', category: 'Outerwear', price: '96.00', inStock: 'false' },
  ],
};

/** Serialized through the same `tableToCsv` a real download uses, so the sample is
 *  never a second, hand-typed CSV format that could quietly drift from what the tool
 *  actually produces. */
export async function createSample(): Promise<DataFile> {
  const csv = tableToCsv(SAMPLE_TABLE);

  return {
    bytes: new TextEncoder().encode(csv),
    name: 'sample-products.csv',
    mimeType: 'text/csv',
  };
}
