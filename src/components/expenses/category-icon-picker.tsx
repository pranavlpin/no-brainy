'use client'

import { useState } from 'react'
import {
  ShoppingBag, Utensils, Landmark, Car, ShoppingCart, MapPin, Pill,
  Users, Cat, Fuel, CreditCard, Plane, Hospital, Receipt, Repeat,
  Heart, Gamepad2, Wine, Home, Shield, TrendingUp, HelpCircle, Tag,
  Gift, Music, Smartphone, Laptop, Baby, Dumbbell, Palette,
  BookOpen, Coffee, Bike, Bus, Train, Scissors, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'shopping-bag', icon: ShoppingBag },
  { name: 'utensils', icon: Utensils },
  { name: 'landmark', icon: Landmark },
  { name: 'car', icon: Car },
  { name: 'shopping-cart', icon: ShoppingCart },
  { name: 'map-pin', icon: MapPin },
  { name: 'pill', icon: Pill },
  { name: 'users', icon: Users },
  { name: 'cat', icon: Cat },
  { name: 'fuel', icon: Fuel },
  { name: 'credit-card', icon: CreditCard },
  { name: 'plane', icon: Plane },
  { name: 'hospital', icon: Hospital },
  { name: 'receipt', icon: Receipt },
  { name: 'repeat', icon: Repeat },
  { name: 'heart', icon: Heart },
  { name: 'gamepad-2', icon: Gamepad2 },
  { name: 'wine', icon: Wine },
  { name: 'home', icon: Home },
  { name: 'shield', icon: Shield },
  { name: 'trending-up', icon: TrendingUp },
  { name: 'help-circle', icon: HelpCircle },
  { name: 'tag', icon: Tag },
  { name: 'gift', icon: Gift },
  { name: 'music', icon: Music },
  { name: 'smartphone', icon: Smartphone },
  { name: 'laptop', icon: Laptop },
  { name: 'baby', icon: Baby },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'palette', icon: Palette },
  { name: 'book-open', icon: BookOpen },
  { name: 'coffee', icon: Coffee },
  { name: 'bike', icon: Bike },
  { name: 'bus', icon: Bus },
  { name: 'train', icon: Train },
  { name: 'scissors', icon: Scissors },
  { name: 'wrench', icon: Wrench },
  { name: 'zap', icon: Zap },
]

interface CategoryIconPickerProps {
  value: string
  onChange: (icon: string) => void
  color?: string
}

export function CategoryIconPicker({ value, onChange, color = '#6B7280' }: CategoryIconPickerProps): React.ReactElement {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
            value === name
              ? 'border-primary bg-primary/10'
              : 'border-border hover:bg-muted'
          )}
          title={name}
        >
          <Icon
            className="h-4 w-4"
            style={{ color: value === name ? color : undefined }}
          />
        </button>
      ))}
    </div>
  )
}
