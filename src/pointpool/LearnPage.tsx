import { Accordion } from '@chakra-ui/react'
import { fmtMoney, fmtPts } from './data'
import { BackLink, Disclaimer } from './shared'
import styles from './pointpool.module.css'

// Worked cents-per-point example; the rate is computed, not typed in.
const EXAMPLE = { price: 300, points: 24000 }
const exampleCpp = (EXAMPLE.price * 100) / EXAMPLE.points

const TOPICS: [string, string][] = [
  [
    "Points vs. cashback — what's the difference?",
    'Cashback is a fixed dollar amount. Points are a program currency, so what they’re worth depends on how they’re used — travel, gift cards or a statement credit can each give a point a different value.',
  ],
  [
    'How do points from different banks work?',
    'Each bank’s points are used within its own program — Amex points through Amex, Chase points through Chase. Some programs let you move points between cards from the same bank.',
  ],
  [
    'What is "cents per point"?',
    `A simple way to see what a point is worth for a given use: the cash price in cents ÷ the points needed. If a ${fmtMoney(EXAMPLE.price)} flight uses ${fmtPts(EXAMPLE.points)} points, that's ${fmtPts(EXAMPLE.price * 100)}¢ ÷ ${fmtPts(EXAMPLE.points)} = ${exampleCpp}¢ per point.`,
  ],
  [
    'How are these estimates made?',
    'Your monthly spend × each card’s earn rate × an illustrative value per point for each way to use it. Real availability and pricing vary by program and change over time.',
  ],
  [
    'Do points expire?',
    'It depends on the program. Bank points generally stay available while the account is open, since they’re tied to that account — so before closing a card, it’s worth using your points or moving them to another card from the same bank.',
  ],
]

export function LearnPage() {
  return (
    <>
      <BackLink />
      <div className={styles.pageHead}>
        <div className={styles.pageTitle}>Rewards 101</div>
      </div>
      <div className={styles.card}>
        <Accordion.Root collapsible variant="plain">
          {TOPICS.map(([q, a], i) => (
            <Accordion.Item key={q} value={q} borderTopWidth={i ? '1px' : 0} borderColor="#efefef">
              <Accordion.ItemTrigger py="4" fontSize="15px" fontWeight="500" cursor="pointer">
                <span style={{ flex: 1 }}>{q}</span>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pt="0" pb="4" color="#333" fontSize="14px" lineHeight="1.55">
                  {a}
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
      <Disclaimer />
    </>
  )
}
