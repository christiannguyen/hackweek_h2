import {
  catName,
  coachTips,
  fmtMoney,
  fmtPts,
  fmtUSD,
  hasEstimates,
  isCash,
  marketplaceCategory,
  PROGRAMS,
  SPEND,
  type Balance,
  type CategoryId,
} from './data'
import { PointsUses } from './PointsUses'
import { Disclaimer, FreshnessTag } from './shared'
import { SpendCoach } from './SpendCoach'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
}

const LESSONS = [
  { title: 'Points and cashback', sub: 'How a point’s value can change with each use — and what shapes it.', tone: '' },
  { title: 'One balance, many uses', sub: 'Travel, gift cards or cash — what the same points can cover.', tone: 'peach' },
  { title: 'Cents per point, simply', sub: 'A quick way to see what a point is worth for each use.', tone: 'blue' },
]

export function HomePage({ balances, category, onCategory, onEdit }: Props) {
  // "Ways to use" tips repeat the "Where your points could go" section right below, so Home leads with another kind.
  const tips = coachTips(balances)
  const tip = tips.find((t) => t.kind !== 'uses') ?? tips[0]
  const market = marketplaceCategory(balances)

  return (
    <>
      <div className={styles.pageTitle}>Pointpool</div>

      {/* Card Coach leads: personal, built from the user's (sample) spending */}
      <div className={`${styles.card} ${styles.coachHero}`}>
        <div className={styles.eyebrow}>Card Coach</div>
        <div className={styles.cardHead} style={{ marginTop: 2 }}>
          <h2>Your month in rewards</h2>
          <a className={styles.chev} href="#coach" aria-label="Open Card Coach">
            ›
          </a>
        </div>
        <SpendCoach balances={balances} category={category} onCategory={onCategory} onEdit={onEdit} />
        <a className={styles.moreLink} href="#coach">
          See every category →
        </a>
      </div>

      {tip && (
        <a
          className={styles.tip}
          href={tip.href}
          onClick={
            tip.balanceId
              ? (e) => {
                  e.preventDefault()
                  onEdit(tip.balanceId)
                }
              : undefined
          }
        >
          <div className={styles.tipIcon}>{tip.icon}</div>
          <div className={styles.tipMain}>
            <div className={styles.eyebrow}>Coach tip</div>
            <div className={styles.tipText}>{tip.text}</div>
          </div>
          <div className={styles.circleBtn}>→</div>
        </a>
      )}

      <PointsUses balances={balances} moreHref="#redeem" onEdit={onEdit} />

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h2>Your cards</h2>
          <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
            + Add
          </button>
        </div>
        <div className={styles.mt}>
          {balances.length === 0 && <div className={styles.empty}>Add a card to get started.</div>}
          {balances.map((b) => {
            const p = PROGRAMS[b.programId]
            return (
              <div key={b.id} className={styles.row} onClick={() => onEdit(b.id)}>
                <div className={styles.rowIcon}>{p.short}</div>
                <div className={styles.rowMain}>
                  <div className={`${styles.rowTitle} ${styles.ellipsis}`}>{b.cardName}</div>
                  <div className={`${styles.rowSub} ${styles.ellipsis}`}>
                    {hasEstimates(p) ? p.name : 'Estimates coming soon'}
                  </div>
                </div>
                <div className={styles.rowEnd}>
                  <div className={styles.rowAmount}>
                    {isCash(b) ? fmtUSD(b.amount) : `${fmtPts(b.amount)} ${p.unit === 'points' ? 'pts' : p.unit}`}
                  </div>
                  <FreshnessTag balance={b} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Learn with Coach</span>
        <a className={styles.chev} href="#learn" aria-label="Rewards 101">
          ›
        </a>
      </div>
      <div className={styles.carousel}>
        {LESSONS.map((l) => (
          <a key={l.title} href="#learn" className={`${styles.feature} ${l.tone ? styles[l.tone] : ''}`}>
            <span className={`${styles.tag} ${styles.sm} ${styles.readTag}`}>2 min read</span>
            <div className={styles.featureTitle}>{l.title}</div>
            <div className={styles.featureSub}>{l.sub}</div>
            <span className={styles.pillBtn}>Read now →</span>
          </a>
        ))}
      </div>

      <a className={styles.listItem} href="#redeem">
        <div className={styles.rowIcon}>🎯</div>
        <div className={styles.rowMain}>
          <div className={styles.listTitle}>Ways to use your points</div>
          <div className={styles.listSub}>See what your points could cover on a flight, everyday buys, or as cash</div>
        </div>
      </a>

      <a className={styles.promo} href="#" onClick={(e) => e.preventDefault()}>
        <div className={styles.rowMain}>
          {market ? (
            <>
              <div className={styles.promoTitle}>Rewards ideas for {catName(market)}</div>
              <div className={styles.promoSub}>
                Kikoff Marketplace has cards with bonus rewards on {catName(market)} — a fit for spending like your{' '}
                {fmtMoney(SPEND[market])} a month.
              </div>
            </>
          ) : (
            <div className={styles.promoTitle}>Explore cards on Kikoff Marketplace</div>
          )}
        </div>
        <div className={`${styles.circleBtn} ${styles.black}`}>→</div>
      </a>

      <Disclaimer />
    </>
  )
}
