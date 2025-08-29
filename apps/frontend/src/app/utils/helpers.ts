// apps/frontend/src/app/utils/helpers.ts

/**
 * Concatenate conditional classNames.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}

/**
 * Format a number as USD currency.
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(text: string, max = 100): string {
  return text.length > max ? text.slice(0, max) + "…" : text
}
