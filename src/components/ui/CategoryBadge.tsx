import type { StaffCategory } from '@/types/domain'

const STYLES: Record<StaffCategory, string> = {
  Structural: 'bg-category-structural/10 text-category-structural border-category-structural/20',
  Functional: 'bg-category-functional/10 text-category-functional border-category-functional/20',
  Performance: 'bg-category-performance/10 text-category-performance border-category-performance/20',
}

export function CategoryBadge({ category }: { category: StaffCategory }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${STYLES[category]}`}
    >
      {category}
    </span>
  )
}
