import type { CategoryId } from './data'

// Photos for the three spending categories, from Unsplash (the Unsplash License allows free
// commercial use without attribution). Served from public/categories/ rather than hotlinked so the
// page doesn't depend on a third-party CDN at runtime. Sources:
//   food      — unsplash.com/photos/1414235077428-338989a2e8c0 (a plated dish at a restaurant)
//   shopping  — unsplash.com/photos/1441986300917-64674bd600d8 (a clothing store interior)
//   transport — unsplash.com/photos/1449965408869-eaa3f722e40d (driving at dusk)

const PHOTOS: Record<CategoryId, { src: string; alt: string }> = {
  food: { src: '/categories/food.jpg', alt: 'A plated dish being served at a restaurant table' },
  shopping: { src: '/categories/shopping.jpg', alt: 'Shelves of clothing inside a shop' },
  transport: { src: '/categories/transport.jpg', alt: 'Hands on a steering wheel, driving at dusk' },
}

export function CategoryArt({ category, className }: { category: CategoryId; className?: string }) {
  const photo = PHOTOS[category]
  return <img className={className} src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
}
