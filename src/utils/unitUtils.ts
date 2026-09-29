import { MasterUnit, ServiceRequest } from '../types';

export interface CanonicalUnitResult {
  id: string;
  code: string;
  name: string;
  displayName: string;
  matchedUnit?: MasterUnit;
}

// Built-in standard canonical definitions for Lazuardi GCS
const DEFAULT_CANONICAL_UNITS: Array<{ code: string; name: string; aliases: string[] }> = [
  {
    code: 'TK',
    name: 'TK Lazuardi',
    aliases: ['tk', 'tk lazuardi', 'unit tk', 'kindergarten', 'paud', 'toddler', 'pg', 'taman kanak-kanak', 'taman kanak kanak']
  },
  {
    code: 'SD',
    name: 'SD Lazuardi',
    aliases: ['sd', 'sd lazuardi', 'unit sd', 'primary', 'elementary', 'sekolah dasar', 'sd lazuardi gcs']
  },
  {
    code: 'SMP',
    name: 'SMP Lazuardi',
    aliases: ['smp', 'smp lazuardi', 'unit smp', 'junior', 'jhs', 'sekolah menengah pertama', 'smp lazuardi gcs']
  },
  {
    code: 'SMA',
    name: 'SMA Lazuardi',
    aliases: ['sma', 'sma lazuardi', 'unit sma', 'senior', 'shs', 'smk', 'sekolah menengah atas', 'sma lazuardi gcs']
  },
  {
    code: 'GA',
    name: 'General Affairs',
    aliases: ['ga', 'general affairs', 'sarpras', 'fasilitas & maintenance', 'fasilitas', 'maintenance', 'sarana prasarana', 'umum']
  },
  {
    code: 'FIN',
    name: 'Finance & Accounting',
    aliases: ['fin', 'finance', 'finance & accounting', 'keuangan', 'kasir', 'pembukuan', 'accounting']
  },
  {
    code: 'HR',
    name: 'Human Resources',
    aliases: ['hr', 'human resources', 'kepegawaian', 'sdm', 'personalia']
  },
  {
    code: 'IT',
    name: 'Information Technology',
    aliases: ['it', 'information technology', 'teknologi', 'edutech', 'komputer', 'lab komputer', 'ti']
  },
  {
    code: 'SEC',
    name: 'Security & Safety',
    aliases: ['sec', 'security', 'security & safety', 'satpam', 'keamanan', 'safety']
  },
  {
    code: 'RR',
    name: 'Resources Room',
    aliases: ['rr', 'resources room', 'resources', 'loket rr', 'ruang resources']
  },
  {
    code: 'MGT',
    name: 'Management / Yayasan',
    aliases: ['mgt', 'management', 'yayasan', 'manajemen', 'direksi', 'yayasan lazuardi', 'management / yayasan']
  }
];

/**
 * Resolves any raw unit input (e.g., "SD", "SD Lazuardi", "Unit SD", "primary")
 * into its single canonical MasterUnit representation.
 */
export const resolveCanonicalUnit = (
  unitIdentifier?: string | null,
  units: MasterUnit[] = []
): CanonicalUnitResult => {
  const raw = (unitIdentifier || '').trim();
  if (!raw) {
    return {
      id: 'unit-unknown',
      code: 'Umum',
      name: 'Umum / Lainnya',
      displayName: 'Umum / Lainnya'
    };
  }

  const norm = raw.toLowerCase().trim();

  // 1. Check exact match by MasterUnit code
  if (units.length > 0) {
    const byCode = units.find(u => u.code.toLowerCase().trim() === norm);
    if (byCode) {
      return {
        id: byCode.id,
        code: byCode.code,
        name: byCode.name,
        displayName: `${byCode.code} - ${byCode.name}`,
        matchedUnit: byCode
      };
    }

    // 2. Check exact match by MasterUnit name
    const byName = units.find(u => u.name.toLowerCase().trim() === norm);
    if (byName) {
      return {
        id: byName.id,
        code: byName.code,
        name: byName.name,
        displayName: `${byName.code} - ${byName.name}`,
        matchedUnit: byName
      };
    }
  }

  // 3. Check alias map against registered units or fallback list
  for (const def of DEFAULT_CANONICAL_UNITS) {
    const isAliasMatch = def.aliases.some(alias => {
      if (norm === alias) return true;
      if (norm.startsWith(`${alias} `) || norm.endsWith(` ${alias}`)) return true;
      return false;
    });

    if (isAliasMatch) {
      // Find corresponding unit from live context if available
      const matched = units.find(u => u.code.toUpperCase() === def.code.toUpperCase());
      if (matched) {
        return {
          id: matched.id,
          code: matched.code,
          name: matched.name,
          displayName: `${matched.code} - ${matched.name}`,
          matchedUnit: matched
        };
      }
      return {
        id: `unit-${def.code.toLowerCase()}`,
        code: def.code,
        name: def.name,
        displayName: `${def.code} - ${def.name}`
      };
    }
  }

  // 4. Word-boundary code match (e.g. "Unit SD", "Guru SMP")
  if (units.length > 0) {
    const byRegex = units.find(u => {
      const c = u.code.toLowerCase().trim();
      if (!c) return false;
      const regex = new RegExp(`(^|[^a-z0-9])${c}([^a-z0-9]|$)`, 'i');
      return regex.test(norm);
    });

    if (byRegex) {
      return {
        id: byRegex.id,
        code: byRegex.code,
        name: byRegex.name,
        displayName: `${byRegex.code} - ${byRegex.name}`,
        matchedUnit: byRegex
      };
    }

    // 5. Containment check on unit name (min length 4 to avoid greedy matches)
    const byContainment = units.find(u => {
      const n = u.name.toLowerCase().trim();
      return (n.length >= 4 && norm.includes(n)) || (norm.length >= 4 && n.includes(norm));
    });

    if (byContainment) {
      return {
        id: byContainment.id,
        code: byContainment.code,
        name: byContainment.name,
        displayName: `${byContainment.code} - ${byContainment.name}`,
        matchedUnit: byContainment
      };
    }
  }

  // Fallback for custom or unrecognized unit names
  return {
    id: `unit-custom-${norm.replace(/[^a-z0-9]/g, '')}`,
    code: raw.toUpperCase(),
    name: raw,
    displayName: raw
  };
};

/**
 * Checks if two unit strings point to the exact same canonical unit.
 * E.g., isSameUnit("SD", "SD Lazuardi") === true
 */
export const isSameUnit = (
  unitA?: string | null,
  unitB?: string | null,
  units: MasterUnit[] = []
): boolean => {
  if (!unitA || !unitB) return false;
  const aNorm = unitA.trim().toLowerCase();
  const bNorm = unitB.trim().toLowerCase();
  if (aNorm === bNorm) return true;
  if (aNorm === 'all' || bNorm === 'all') return false;

  const canonicalA = resolveCanonicalUnit(unitA, units);
  const canonicalB = resolveCanonicalUnit(unitB, units);

  return canonicalA.code.toUpperCase() === canonicalB.code.toUpperCase();
};

/**
 * Normalizes requests list so that every request has a standardized unit code.
 */
export const normalizeRequestUnit = (
  req: ServiceRequest,
  units: MasterUnit[] = []
): ServiceRequest => {
  const canonical = resolveCanonicalUnit(req.unit, units);
  if (req.unit === canonical.code) {
    return req;
  }
  return {
    ...req,
    unit: canonical.code
  };
};
