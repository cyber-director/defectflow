// Single source of truth for the defect → category mapping.
//
// Every other part of the app (UI labels, priority calculator, RLS
// assumptions, seed/test scripts) must import from here instead of
// redeclaring the mapping. See CLAUDE.md §19.

import type { DefectType, StaffCategory } from '@/types/domain'

export const DEFECTS: Record<
  DefectType,
  { label: string; category: StaffCategory }
> = {
  spalling: {
    label: 'Spalling',
    category: 'Structural',
  },
  stagnant_water: {
    label: 'Stagnant Water',
    category: 'Functional',
  },
  cracked_tiles: {
    label: 'Cracked Tiles',
    category: 'Performance',
  },
  paint_peeling: {
    label: 'Paint Peeling',
    category: 'Performance',
  },
} as const

export const DEFECT_TYPES = Object.keys(DEFECTS) as DefectType[]

export const STAFF_CATEGORIES: StaffCategory[] = [
  'Structural',
  'Functional',
  'Performance',
]

export function categoryFor(defect: DefectType): StaffCategory {
  return DEFECTS[defect].category
}

export function labelFor(defect: DefectType): string {
  return DEFECTS[defect].label
}

/** Model class index → defect type. Must match ml/configs/defects.yaml
 *  and the exported ONNX model's output ordering exactly. */
export const CLASS_INDEX: Record<number, DefectType> = {
  0: 'paint_peeling',
  1: 'stagnant_water',
  2: 'cracked_tiles',
  3: 'spalling',
}
