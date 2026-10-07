import {
  fmtMoney,
  fmtPts,
  fmtUSD,
  isCash,
  PROGRAMS,
  utilization,
  type Balance,
} from './data'
import { Disclaimer, FreshnessTag } from './shared'
import styles from './pointpool.module.css'

interface Props {
  balances: Balance[]
  onEdit: (id?: number) => void
}

export function PointpoolPage({ balances, onEdit }: Props) {
  return (
    <>
      <div className={styles.cardHead} style={{ margin: '4px 2px 0' }}>
        <div className={styles.pageTitle}>Pointpool</div>
        <button className={`${styles.btnText} ${styles.add}`} onClick={() => onEdit()}>
          + Add
        </button>
      </div>

      {balances.length === 0 && (
        <div className={styles.card}>
          <div className={styles.empty}>Add a card to get started.</div>
        </div>
      )}

      {balances.map((b) => (
        <CardTile key={b.id} balance={b} onEdit={onEdit} />
      ))}

      <div className={styles.card} style={{ paddingTop: 4, paddingBottom: 4 }}>
        <a className={styles.row} href="#redeem">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>🎯</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Ways to use your points</div>
            <div className={styles.rowSub}>What they could cover on a trip, everyday buys or as cash</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
        <a className={styles.row} href="#learn">
          <div className={`${styles.rowIcon} ${styles.gray} ${styles.emoji}`}>📘</div>
          <div className={styles.rowMain}>
            <div className={styles.rowTitle}>Rewards 101</div>
            <div className={styles.rowSub}>How points and cashback work, in 2 minutes</div>
          </div>
          <span className={styles.chev}>›</span>
        </a>
      </div>

      <Disclaimer />
    </>
  )
}

function UtilBar({ pct }: { pct: number }) {
  const color = pct > 0.7 ? 'var(--orange)' : pct > 0.3 ? '#f0ad1a' : 'var(--green)'
  return (
    <div className={styles.meterBar} style={{ height: 8, borderRadius: 4 }}>
      <span className={styles.meterFill} style={{ width: `${Math.min(pct * 100, 100)}%`, background: color }} />
    </div>
  )
}

function CardTile({ balance: b, onEdit }: { balance: Balance; onEdit: (id?: number) => void }) {
  const p = PROGRAMS[b.programId]
  const cash = isCash(b)
  const util = utilization(b)
  const utilPct = util !== null ? Math.round(util * 100) : null

  return (
    <div className={styles.card} onClick={() => onEdit(b.id)} style={{ cursor: 'pointer' }}>
      <div className={styles.cardHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div className={styles.rowIcon}>{p.short}</div>
          <div style={{ minWidth: 0 }}>
            <div className={`${styles.rowTitle} ${styles.ellipsis}`}>{b.cardName}</div>
            <div className={styles.rowSub}>{p.name}</div>
          </div>
        </div>
        <FreshnessTag balance={b} />
      </div>

      {(b.cardBalance != null || b.creditLimit != null) && (
        <div className={styles.tileSection}>
          <div className={styles.tileStat}>
            <span className={styles.tileLabel}>Balance</span>
            <span className={styles.tileValue}>{fmtUSD(b.cardBalance ?? 0)}</span>
          </div>
          {b.creditLimit != null && b.creditLimit > 0 && (
            <div className={styles.tileStat}>
              <span className={styles.tileLabel}>Limit</span>
              <span className={styles.tileValue}>{fmtMoney(b.creditLimit)}</span>
            </div>
          )}
          {utilPct !== null && (
            <div className={styles.tileStat}>
              <span className={styles.tileLabel}>Utilization</span>
              <span className={styles.tileValue}>{utilPct}%</span>
            </div>
          )}
          {util !== null && <UtilBar pct={util} />}
        </div>
      )}

      <div className={styles.tileSection}>
        <div className={styles.tileStat}>
          <span className={styles.tileLabel}>{cash ? 'Cashback' : 'Rewards'}</span>
          <span className={styles.tileValue}>
            {cash
              ? fmtUSD(b.amount)
              : `${fmtPts(b.amount)} ${p.unit === 'points' ? 'pts' : p.unit}`}
          </span>
        </div>
        {cash && <div className={styles.rowSub}>Cashback toward your card bill; options vary by card</div>}
      </div>
    </div>
  )
}
