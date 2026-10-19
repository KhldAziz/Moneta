import React from 'react';
import {
  UtensilsCrossed,
  Coffee,
  Bike,
  Home,
  Wifi,
  BookOpen,
  ShoppingBag,
  Gamepad2,
  Pill,
  Package,
  Coins,
  Briefcase,
  ArrowDownToLine,
  HelpCircle,
} from 'lucide-react';
import { CategoryKey } from '../types';
import { CATEGORIES } from '../constants/categories';

interface CategoryIconProps {
  category: CategoryKey;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  className = '',
  size = 20,
}) => {
  const meta = CATEGORIES[category] || CATEGORIES.lainnya;

  const iconMap: Record<string, React.ElementType> = {
    UtensilsCrossed,
    Coffee,
    Bike,
    Home,
    Wifi,
    BookOpen,
    ShoppingBag,
    Gamepad2,
    Pill,
    Package,
    Coins,
    Briefcase,
    ArrowDownToLine,
  };

  const IconComponent = iconMap[meta.icon] || HelpCircle;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl p-2 shrink-0 ${className}`}
      style={{
        backgroundColor: `${meta.color}18`, // 10% opacity tint
        color: meta.color,
      }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
};
