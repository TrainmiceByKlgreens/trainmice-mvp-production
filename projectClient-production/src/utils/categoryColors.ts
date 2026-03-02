/**
 * Pastel colors for each course category
 * Each category gets a unique pastel color scheme
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'ISO': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  'Safety': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'Facilities Management & Maintenance': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  'Healthcare & Wellness': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  'Human Resource': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'Logistics & Supply Chain': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Team Building': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'IT & Software': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Hospitality': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  'Sales & Marketing': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Communication & Languages': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'Manufacturing': { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200' },
  'Accounts & Finance': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Leadership & Management Skills': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'Soft Skills': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  'Food Processing': { bg: 'bg-rose-200', text: 'text-rose-800', border: 'border-rose-300' },
  'Property': { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
  'ESG': { bg: 'bg-emerald-200', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Others': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

/**
 * Get pastel color for a category
 */
export function getCategoryColor(category: string | null | undefined) {
  if (!category) {
    return CATEGORY_COLORS['Others'];
  }
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['Others'];
}

