import { coachTips, type Balance, type CategoryId } from './data'
import { PointsUses } from './PointsUses'
import { BackLink, Disclaimer } from './shared'
import { SpendCoach } from './SpendCoach'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  category: CategoryId
  onCategory: (c: CategoryId) => void
  onEdit: (id?: number) => void
}

export function CoachPage({ balances, category, onCategory, onEdit }: Props) {
  const tips = coachTips(balances)

  return (
    <>
      <BackLink />
      <div className={styles.pageTitle}>Card Coach</div>

      <div className={styles.card}>
        <h2>Your spending, by category</h2>
        <SpendCoach
          balances={balances}
          category={category}
          onCategory={onCategory}
          onEdit={onEdit}
          variant="full"
        />
        <div className={styles.sample}>
          Estimates use monthly spend × earn rate × illustrative point value. Your card issuer has the latest.
        </div>
      </div>

      <PointsUses balances={balances} onEdit={onEdit} />

      {tips.length > 0 && (
        <>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Ideas for your points</span>
          </div>
          {tips.map((t) =>
            // Tips that point back to this page read as plain banners — no link to the page you're on.
            t.href === '#coach' && !t.balanceId ? (
              <div key={t.id} className={styles.tip}>
                <div className={styles.tipIcon}>{t.icon}</div>
                <div className={`${styles.tipText} ${styles.tipMain}`}>{t.text}</div>
              </div>
            ) : (
              <a
                key={t.id}
                className={styles.tip}
                href={t.href}
                onClick={
                  t.balanceId
                    ? (e) => {
                        e.preventDefault()
                        onEdit(t.balanceId)
                      }
                    : undefined
                }
              >
                <div className={styles.tipIcon}>{t.icon}</div>
                <div className={`${styles.tipText} ${styles.tipMain}`}>{t.text}</div>
                <span className={styles.chev}>›</span>
              </a>
            ),
          )}
        </>
      )}

      <Disclaimer />
    </>
  )
}
