// Brand tints for the CSS-drawn card faces (CardArt.tsx on the wallet tiles, CardFace in
// CardCompare.tsx on the home comparison). No issuer artwork is shipped — the look is brand-tinted
// only, so there's nothing to license and it stays sharp at any density.
//
// Keyed by the two-letter issuer code both halves of the app already use: Program.short on the
// wallet tiles, CardOption.short on the comparison tiles.
const ART: Record<string, { from: string; to: string }> = {
  DI: { from: '#ffa64d', to: '#e2610d' }, // Discover
  CO: { from: '#3156a0', to: '#13224a' }, // Credit One
  AX: { from: '#39a7ec', to: '#00568f' }, // Amex
  CH: { from: '#2f86da', to: '#10406f' }, // Chase
  CI: { from: '#23a3e4', to: '#004b7c' }, // Citi
  C1: { from: '#e4493f', to: '#8c1d18' }, // Capital One
  BA: { from: '#c8102e', to: '#012169' }, // Bank of America
  US: { from: '#2f6fc4', to: '#0c2074' }, // U.S. Bank
  WF: { from: '#d71e28', to: '#7c0d14' }, // Wells Fargo
  PP: { from: '#009cde', to: '#003087' }, // PayPal
  AP: { from: '#a4a8ae', to: '#44484e' }, // Apple
  UP: { from: '#1ab6a4', to: '#0b6e63' }, // Upgrade
  PE: { from: '#7b61ff', to: '#3b2bb5' }, // Petal
  ML: { from: '#5b6ef5', to: '#262c8c' }, // Mission Lane
  AS: { from: '#44a86d', to: '#18613a' }, // Aspire
  FO: { from: '#2a9eae', to: '#0c5460' }, // Fortiva
  BI: { from: '#4a5158', to: '#15181c' }, // Bilt
}

const FALLBACK = { from: '#7b8794', to: '#39424c' }

export const artFor = (short: string) => ART[short] ?? FALLBACK
