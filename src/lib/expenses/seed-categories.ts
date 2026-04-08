import { prisma } from '@/lib/prisma'

interface DefaultCategory {
  name: string
  slug: string
  icon: string
  color: string
  sortOrder: number
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Shopping', slug: 'shopping', icon: 'shopping-bag', color: '#F59E0B', sortOrder: 0 },
  { name: 'Food Order', slug: 'food-order', icon: 'utensils', color: '#EF4444', sortOrder: 1 },
  { name: 'EMI', slug: 'emi', icon: 'landmark', color: '#8B5CF6', sortOrder: 2 },
  { name: 'My Car', slug: 'my-car', icon: 'car', color: '#3B82F6', sortOrder: 3 },
  { name: 'Grocery', slug: 'grocery', icon: 'shopping-cart', color: '#10B981', sortOrder: 4 },
  { name: 'Cabs', slug: 'cabs', icon: 'map-pin', color: '#F97316', sortOrder: 5 },
  { name: 'Medicines', slug: 'medicines', icon: 'pill', color: '#EC4899', sortOrder: 6 },
  { name: 'Family', slug: 'family', icon: 'users', color: '#6366F1', sortOrder: 7 },
  { name: 'Cats', slug: 'cats', icon: 'cat', color: '#A855F7', sortOrder: 8 },
  { name: 'Petrol', slug: 'petrol', icon: 'fuel', color: '#64748B', sortOrder: 9 },
  { name: 'Credit', slug: 'credit', icon: 'credit-card', color: '#DC2626', sortOrder: 10 },
  { name: 'Travel', slug: 'travel', icon: 'plane', color: '#0EA5E9', sortOrder: 11 },
  { name: 'Hospital', slug: 'hospital', icon: 'hospital', color: '#F43F5E', sortOrder: 12 },
  { name: 'Bills', slug: 'bills', icon: 'receipt', color: '#84CC16', sortOrder: 13 },
  { name: 'Subscriptions', slug: 'subscriptions', icon: 'repeat', color: '#7C3AED', sortOrder: 14 },
  { name: 'Self Care', slug: 'self-care', icon: 'heart', color: '#FB923C', sortOrder: 15 },
  { name: 'Leisure', slug: 'leisure', icon: 'gamepad-2', color: '#22D3EE', sortOrder: 16 },
  { name: 'Dining', slug: 'dining', icon: 'wine', color: '#E11D48', sortOrder: 17 },
  { name: 'Donations', slug: 'donations', icon: 'hand-heart', color: '#059669', sortOrder: 18 },
  { name: 'My Home', slug: 'my-home', icon: 'home', color: '#D97706', sortOrder: 19 },
  { name: 'Insurance', slug: 'insurance', icon: 'shield', color: '#4F46E5', sortOrder: 20 },
  { name: 'Investment', slug: 'investment', icon: 'trending-up', color: '#16A34A', sortOrder: 21 },
  { name: 'Unknown', slug: 'unknown', icon: 'help-circle', color: '#9CA3AF', sortOrder: 22 },
]

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const existingCount = await prisma.expenseCategory.count({
    where: { userId },
  })

  if (existingCount > 0) return

  await prisma.expenseCategory.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({
      userId,
      ...cat,
      isDefault: true,
    })),
  })
}

export { DEFAULT_CATEGORIES }
