import type { ParsedExpenseRow } from './parser'

/**
 * Keyword-to-category-slug mapping.
 * Keywords are matched case-insensitively against the expense name.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'food-order': [
    'swiggy', 'zomato', 'uber eats', 'dominos', 'pizza hut', 'mcdonalds',
    'kfc', 'burger king', 'food panda', 'dunzo food', 'box8', 'faasos',
    'behrouz', 'eatfit',
  ],
  'grocery': [
    'bigbasket', 'blinkit', 'zepto', 'dmart', 'more megastore', 'jiomart',
    'grofers', 'nature basket', 'fresh', 'vegetables', 'fruits', 'grocery',
    'supermarket', 'reliance fresh', 'star bazaar', 'spar',
  ],
  'cabs': [
    'uber', 'ola', 'rapido', 'meru', 'blu smart', 'namma yatri',
    'auto', 'cab', 'ride',
  ],
  'shopping': [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa',
    'tatacliq', 'snapdeal', 'shoppers stop', 'westside', 'h&m',
    'zara', 'uniqlo', 'decathlon', 'croma', 'reliance digital',
  ],
  'petrol': [
    'hp petrol', 'bharat petroleum', 'iocl', 'indian oil', 'fuel',
    'petrol', 'diesel', 'shell', 'nayara', 'bpcl', 'hpcl',
  ],
  'subscriptions': [
    'netflix', 'spotify', 'hotstar', 'prime video', 'youtube premium',
    'apple', 'google one', 'icloud', 'linkedin premium', 'notion',
    'figma', 'github', 'aws', 'adobe', 'chatgpt', 'claude',
  ],
  'bills': [
    'electricity', 'airtel', 'jio', 'vodafone', 'vi ', 'water bill',
    'broadband', 'wifi', 'gas bill', 'piped gas', 'mahanagar gas',
    'bsnl', 'act fibernet', 'tata play', 'dish tv',
  ],
  'emi': [
    'emi', 'loan', 'bajaj finserv', 'hdfc loan', 'sbi loan',
    'icici loan', 'personal loan', 'home loan', 'car loan',
  ],
  'dining': [
    'restaurant', 'cafe', 'starbucks', 'chai point', 'third wave',
    'blue tokai', 'barista', 'bistro', 'lounge', 'bar ', 'pub ',
  ],
  'medicines': [
    'pharmeasy', 'netmeds', '1mg', 'apollo pharmacy', 'medplus',
    'medicine', 'pharmacy', 'medical', 'wellness forever',
  ],
  'travel': [
    'irctc', 'makemytrip', 'goibibo', 'cleartrip', 'yatra',
    'indigo', 'spicejet', 'air india', 'vistara', 'booking.com',
    'oyo', 'airbnb', 'hotel', 'flight', 'train ticket',
  ],
  'insurance': [
    'lic', 'hdfc life', 'icici prudential', 'max life', 'sbi life',
    'bajaj allianz', 'star health', 'care health', 'insurance',
    'premium', 'policy',
  ],
  'investment': [
    'zerodha', 'groww', 'upstox', 'coin', 'mutual fund', 'sip',
    'nps', 'ppf', 'fixed deposit', 'fd ', 'stocks', 'kuvera',
    'smallcase', 'et money',
  ],
  'credit': [
    'credit card', 'cc payment', 'card payment', 'outstanding',
    'minimum due', 'bill payment credit',
  ],
  'hospital': [
    'hospital', 'clinic', 'doctor', 'diagnostic', 'lab test',
    'pathology', 'x-ray', 'scan', 'consultation',
  ],
  'self-care': [
    'salon', 'spa', 'parlour', 'parlor', 'grooming', 'haircut',
    'facial', 'massage', 'gym', 'fitness', 'yoga',
  ],
  'leisure': [
    'movie', 'pvr', 'inox', 'cinepolis', 'bookmyshow', 'game',
    'bowling', 'entertainment', 'amusement', 'park', 'zoo',
  ],
  'donations': [
    'donation', 'charity', 'ngo', 'temple', 'church', 'mosque',
    'gurudwara', 'religious', 'tithe', 'zakat',
  ],
  'my-home': [
    'rent', 'maintenance', 'society', 'plumber', 'electrician',
    'carpenter', 'furniture', 'ikea', 'home centre', 'pepperfry',
    'urban ladder', 'home repair', 'paint', 'hardware',
  ],
  'my-car': [
    'car service', 'car wash', 'tyre', 'tire', 'parking',
    'toll', 'fastag', 'mechanic', 'garage', 'clutch', 'brake',
  ],
  'cats': [
    'pet', 'vet', 'veterinary', 'cat food', 'pet shop', 'whiskas',
    'royal canin', 'drools', 'meow', 'kitten', 'litter',
  ],
  'family': [
    'family', 'parents', 'mom', 'dad', 'sister', 'brother',
    'wife', 'husband', 'kids', 'children', 'school fee',
  ],
}

/**
 * Match an expense name to a category slug using keyword matching.
 * Returns the best matching slug or 'unknown' if no match found.
 */
export function matchCategory(name: string): string {
  const lower = name.toLowerCase()

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return slug
      }
    }
  }

  return 'unknown'
}

/**
 * Apply auto-categorization to parsed rows.
 * Mutates the suggestedCategorySlug field on each row.
 */
export function categorizeRows(rows: ParsedExpenseRow[]): ParsedExpenseRow[] {
  return rows.map((row) => ({
    ...row,
    suggestedCategorySlug: matchCategory(row.name),
  }))
}
