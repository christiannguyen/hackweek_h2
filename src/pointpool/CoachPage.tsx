import { CardCompare, ScoreGoal, type CompareProps } from "./CardCompare";
import { coachTips, type Balance } from "./data";
import { PointsUses } from "./PointsUses";
import { BackLink, Disclaimer } from "./shared";
import styles from "./pointpool.module.css";

interface Props {
  balances: Balance[];
  onEdit: (id?: number) => void;
  compare: CompareProps;
}

export function CoachPage({ balances, onEdit, compare }: Props) {
  const tips = coachTips(balances);

  return (
    <>
      <BackLink />
      <div className={styles.pageTitle}>Earn more on your spending</div>

      <div className={styles.card}>
        <CardCompare {...compare} variant="full" />
      </div>

      <ScoreGoal
        balances={compare.balances}
        category={compare.category}
        variant="full"
      />

      <PointsUses balances={balances} onEdit={onEdit} />

      {tips.length > 0 && (
        <>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Ideas for your points</span>
          </div>
          {tips.map((t) =>
            // Tips that point back to this page read as plain banners — no link to the page you're on.
            t.href === "#coach" && !t.balanceId ? (
              <div key={t.id} className={styles.tip}>
                <div className={styles.tipIcon}>{t.icon}</div>
                <div className={`${styles.tipText} ${styles.tipMain}`}>
                  {t.text}
                </div>
              </div>
            ) : (
              <a
                key={t.id}
                className={styles.tip}
                href={t.href}
                onClick={
                  t.balanceId
                    ? (e) => {
                        e.preventDefault();
                        onEdit(t.balanceId);
                      }
                    : undefined
                }
              >
                <div className={styles.tipIcon}>{t.icon}</div>
                <div className={`${styles.tipText} ${styles.tipMain}`}>
                  {t.text}
                </div>
                <span className={styles.chev}>›</span>
              </a>
            ),
          )}
        </>
      )}

      <Disclaimer />
    </>
  );
}
