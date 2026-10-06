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
      <div>
        <div className={styles.pageTitle}>Card Coach</div>
        <div className={styles.pageSub}>
          What your everyday spending could earn on each of your cards — and the ways to use it.
        </div>
      </div>

      <div className={styles.card}>
        <h2>Your spending, by category</h2>
        <SpendCoach
          balances={balances}
          category={category}
          onCategory={onCategory}
          onEdit={onEdit}
          variant="full"
        />
        <div className={styles.estimate}>
          <b>How we estimate:</b> your monthly spend × each card’s earn rate × an illustrative value per point for each
          way to use it.
          <div className={styles.assumptions}>
            Illustrative rates for the demo. Caps and categories change — your card issuer has the latest.
          </div>
        </div>
      </div>

      <PointsUses balances={balances} variant="full" onEdit={onEdit} />

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
                <div className={styles.circleBtn}>→</div>
              </a>
            ),
          )}
        </>
      )}

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Coming soon</span>
      </div>
      <div className={`${styles.listItem} ${styles.disabled}`}>
        <div className={styles.rowIcon}>🔔</div>
        <div className={styles.rowMain}>
          <div className={styles.listTitle}>Coach alerts</div>
          <div className={styles.listSub}>A heads-up when a bonus category opens or a balance is ready for a trip</div>
        </div>
      </div>

      <Disclaimer />
    </>
  )
}
