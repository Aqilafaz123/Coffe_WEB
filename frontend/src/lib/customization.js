export const SUGAR_LEVELS = [
  { id: '0%', label: 'Tanpa Gula (0%)' },
  { id: '50%', label: 'Sedikit (50%)' },
  { id: '100%', label: 'Normal (100%)' },
  { id: '120%', label: 'Extra (120%)' },
];

export const ICE_LEVELS = [
  { id: 'none', label: 'Tanpa Es' },
  { id: 'less', label: 'Sedikit Es' },
  { id: 'normal', label: 'Normal Es' },
  { id: 'extra', label: 'Extra Es' },
];

export const MILK_OPTIONS = [
  { id: 'normal', label: 'Susu Standar', price: 0 },
  { id: 'less', label: 'Sedikit Susu', price: 0 },
  { id: 'extra', label: 'Extra Susu', price: 3000 },
  { id: 'none', label: 'Tanpa Susu', price: 0 },
  { id: 'oat', label: 'Oat Milk', price: 5000 },
];

export const AVAILABLE_ADDONS = [
  { id: 'extra_shot', name: 'Extra Shot Espresso', price: 5000 },
  { id: 'caramel_syrup', name: 'Sirup Karamel', price: 4000 },
  { id: 'whipped_cream', name: 'Whipped Cream', price: 4000 },
];

export function isProductCustomizable(product) {
  if (!product) return false;

  // Explicit flag from DB if available
  if (typeof product.is_customizable === 'boolean' || typeof product.is_customizable === 'number') {
    return Boolean(product.is_customizable);
  }

  // Graceful category-based fallback
  const categorySlug = (product.category?.slug || '').toLowerCase();
  const categoryName = (product.category?.name || '').toLowerCase();
  const productName = (product.name || '').toLowerCase();

  // Non-customizable categories & food/desserts
  if (
    categorySlug === 'dessert' ||
    categoryName.includes('dessert') ||
    categoryName.includes('makanan') ||
    categoryName.includes('food') ||
    productName.includes('ice cream') ||
    productName.includes('es cream') ||
    productName.includes('cake') ||
    productName.includes('croissant') ||
    productName.includes('brownie') ||
    productName.includes('tiramisu')
  ) {
    return false;
  }

  // Customizable categories & drinks
  if (
    categorySlug.includes('coffee') ||
    categoryName.includes('coffee') ||
    categoryName.includes('kopi') ||
    categoryName.includes('minuman') ||
    productName.includes('coffee') ||
    productName.includes('kopi') ||
    productName.includes('latte') ||
    productName.includes('cappuccino') ||
    productName.includes('frappe') ||
    productName.includes('brew') ||
    productName.includes('tea') ||
    productName.includes('teh')
  ) {
    return true;
  }

  return false;
}

export function getDefaultOptions(product) {
  const isHot = (product?.category?.slug || '').includes('hot') || (product?.name || '').toLowerCase().includes('hot');
  return {
    sugar: '100%',
    ice: isHot ? 'none' : 'normal',
    milk: 'normal',
    addons: {}, // { addon_id: quantity }
  };
}

export function calculateCustomizationExtra(options) {
  if (!options) return 0;
  let total = 0;

  // Milk extra
  const milkObj = MILK_OPTIONS.find((m) => m.id === options.milk);
  if (milkObj && milkObj.price) {
    total += milkObj.price;
  }

  // Addons extra
  if (options.addons) {
    Object.entries(options.addons).forEach(([addonId, qty]) => {
      const addon = AVAILABLE_ADDONS.find((a) => a.id === addonId);
      if (addon && qty > 0) {
        total += addon.price * qty;
      }
    });
  }

  return total;
}

export function serializeOptionsForApi(options) {
  if (!options) return null;

  const sugarObj = SUGAR_LEVELS.find((s) => s.id === options.sugar);
  const iceObj = ICE_LEVELS.find((i) => i.id === options.ice);
  const milkObj = MILK_OPTIONS.find((m) => m.id === options.milk);

  const formattedAddons = [];
  if (options.addons) {
    Object.entries(options.addons).forEach(([addonId, qty]) => {
      if (qty > 0) {
        const item = AVAILABLE_ADDONS.find((a) => a.id === addonId);
        if (item) {
          formattedAddons.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: qty,
          });
        }
      }
    });
  }

  return {
    sugar: sugarObj?.label || options.sugar || 'Normal (100%)',
    ice: iceObj?.label || options.ice || 'Normal Es',
    milk: milkObj?.label || options.milk || 'Susu Standar',
    milk_price: milkObj?.price || 0,
    addons: formattedAddons,
  };
}

export function formatOptionsSummary(options) {
  if (!options) return '';

  // If already a backend options object
  if (typeof options === 'object') {
    const parts = [];
    if (options.sugar) parts.push(`Gula: ${options.sugar}`);
    if (options.ice) parts.push(`Es: ${options.ice}`);
    if (options.milk) parts.push(`Susu: ${options.milk}`);
    if (Array.isArray(options.addons)) {
      options.addons.forEach((a) => {
        if (a.quantity > 0) {
          parts.push(`+${a.quantity} ${a.name}`);
        }
      });
    } else if (options.addons && typeof options.addons === 'object') {
      Object.entries(options.addons).forEach(([addonId, qty]) => {
        if (qty > 0) {
          const item = AVAILABLE_ADDONS.find((a) => a.id === addonId);
          parts.push(`+${qty} ${item ? item.name : addonId}`);
        }
      });
    }
    return parts.join(' · ');
  }

  return String(options);
}

