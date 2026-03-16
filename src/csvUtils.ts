import { Record, db, generateHash } from './db';

export function exportToCSV(records: Record[]): void {
  const headers = ['Jméno', 'Příjmení', 'Pohlaví', 'Datum narození', 'Okres', 'Hash'];
  const csvRows = [headers.join(',')];

  records.forEach(record => {
    const row = [
      escapeCsvValue(record.jmeno),
      escapeCsvValue(record.prijmeni),
      escapeCsvValue(record.pohlavi),
      escapeCsvValue(record.datumNarozeni),
      escapeCsvValue(record.okres),
      escapeCsvValue(record.hash)
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sociolink-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function importFromCSV(file: File): Promise<{ success: number; errors: string[] }> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return { success: 0, errors: ['Soubor neobsahuje žádná data'] };
  }

  const errors: string[] = [];
  let success = 0;

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      if (values.length < 5) {
        errors.push(`Řádek ${i + 1}: Neúplná data`);
        continue;
      }

      const record = {
        jmeno: values[0],
        prijmeni: values[1],
        pohlavi: values[2] as 'muž' | 'žena' | 'neuvedeno',
        datumNarozeni: values[3],
        okres: values[4] as Record['okres']
      };

      const hash = await generateHash(record);

      await db.records.add({
        ...record,
        hash
      });

      success++;
    } catch (error) {
      errors.push(`Řádek ${i + 1}: ${error instanceof Error ? error.message : 'Chyba při importu'}`);
    }
  }

  return { success, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
