export function formatXOF(amount: number) {
  return new Intl.NumberFormat("fr-CI", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + " XOF";
}
