'use client'

import {
  ShoppingBag, Utensils, Landmark, Car, ShoppingCart, MapPin, Pill,
  Users, Cat, Fuel, CreditCard, Plane, Hospital, Receipt, Repeat,
  Heart, Gamepad2, Wine, Home, Shield, TrendingUp, HelpCircle, Tag,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'utensils': Utensils,
  'landmark': Landmark,
  'car': Car,
  'shopping-cart': ShoppingCart,
  'map-pin': MapPin,
  'pill': Pill,
  'users': Users,
  'cat': Cat,
  'fuel': Fuel,
  'credit-card': CreditCard,
  'plane': Plane,
  'hospital': Hospital,
  'receipt': Receipt,
  'repeat': Repeat,
  'heart': Heart,
  'gamepad-2': Gamepad2,
  'wine': Wine,
  'hand-heart': Heart,
  'home': Home,
  'shield': Shield,
  'trending-up': TrendingUp,
  'help-circle': HelpCircle,
  'tag': Tag,
}

interface CategoryBadgeProps {
  name: string
  icon: string
  color: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({ name, icon, color, size = 'sm' }: CategoryBadgeProps): React.ReactElement {
  const IconComponent = ICON_MAP[icon] || Tag
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${padding} ${textSize} font-medium`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      <IconComponent className={iconSize} />
      {name}
    </span>
  )
}

export { ICON_MAP }
