import { balanceUses, fmtBalance, fmtMoney, hasEstimates, isCash, PROGRAMS, type Balance } from './data'
import { Disclaimer } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
}

interface Offer {
  id: string
  emoji: string
  title: string
  desc: string
  tag?: string
}

function offersForBalance(b: Balance): Offer[] {
  const p = PROGRAMS[b.programId]
  if (!hasEstimates(p)) return []
  const uses = balanceUses(b)
  const travel = uses.find((u) => u.id === 'travel')
  const credit = uses.find((u) => u.id === 'cashback')
  const offers: Offer[] = []

  if (isCash(b)) {
    if (b.amount >= 25) {
      offers.push({
        id: `${b.id}-statement`,
        emoji: '💵',
        title: 'Statement credit',
        desc: `Apply ${fmtMoney(b.amount)} to your next statement.`,
        tag: 'Best value',
      })
    }
    if (b.amount >= 10) {
      offers.push({
        id: `${b.id}-deposit`,
        emoji: '🏦',
        title: 'Bank deposit',
        desc: `Deposit ${fmtMoney(b.amount)} to your bank account.`,
      })
    }
    offers.push({
      id: `${b.id}-checkout`,
      emoji: '🛍️',
      title: 'Pay at checkout',
      desc: 'Use cashback at Amazon or PayPal checkout.',
    })
  } else {
    if (travel && b.amount > 0) {
      offers.push({
        id: `${b.id}-travel`,
        emoji: '✈️',
        title: 'Book travel',
        desc: `${fmtBalance(b)} could cover ≈${fmtMoney(travel.value)} of flights or hotels.`,
        tag: 'Best value',
      })
    }
    if (b.amount > 0) {
      offers.push({
        id: `${b.id}-giftcard`,
        emoji: '🎁',
        title: 'Gift cards',
        desc: `Redeem for gift cards at popular retailers.`,
      })
    }
    if (credit && b.amount > 0) {
      offers.push({
        id: `${b.id}-credit`,
        emoji: '💵',
        title: 'Statement credit',
        desc: `Get ≈${fmtMoney(credit.value)} back on your bill.`,
      })
    }
    if (p.brand === 'Chase' || p.brand === 'Amex') {
      offers.push({
        id: `${b.id}-transfer`,
        emoji: '🔄',
        title: 'Transfer to airlines',
        desc: `Move ${p.brand} points to airline or hotel partners for premium redemptions.`,
        tag: 'High value',
      })
    }
  }
  return offers
}

export function OffersPage({ balances, onEdit }: Props) {
  const cardsWithOffers = balances
    .map((b) => ({ balance: b, offers: offersForBalance(b) }))
    .filter((c) => c.offers.length > 0)

  return (
    <>
      <div className={styles.pageTitle}>Offers</div>

      {cardsWithOffers.length === 0 && (
        <div className={styles.card}>
          <div className={styles.empty}>
            Add a card to see personalized offers.
            <div>
              <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
                + Add a card
              </button>
            </div>
          </div>
        </div>
      )}

      {cardsWithOffers.map(({ balance: b, offers }) => (
        <div key={b.id} className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.ellipsis}>{b.cardName}</h2>
            <span className={`${styles.tag} ${styles.sm}`}>{fmtBalance(b)}</span>
          </div>
          <div className={styles.mt}>
            {offers.map((o) => (
              <div key={o.id} className={styles.row}>
                <div className={`${styles.rowIcon} ${styles.gray}`}>{o.emoji}</div>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitleLine}>
                    <span className={styles.rowTitle}>{o.title}</span>
                    {o.tag && <span className={`${styles.tag} ${styles.sm}`}>{o.tag}</span>}
                  </div>
                  <div className={styles.rowSub}>{o.desc}</div>
                </div>
                <span className={styles.chev}>›</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Disclaimer />
    </>
  )
}
