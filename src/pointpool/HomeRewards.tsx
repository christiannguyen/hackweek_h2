import { useState } from 'react'
import { Button, CloseButton, Drawer, Portal } from '@chakra-ui/react'
import { LuArrowRight } from 'react-icons/lu'
import { CardArt } from './CardArt'
import { fmtPts, fmtUSD, hasEstimates, isCash, isStale, PROGRAMS, type Balance } from './data'
import { homeReward, redemptionSteps } from './redemption'
import { savedGoals } from './useBalances'
import styles from './pointpool.module.css'

export function HomeRewards({ balances, onRewards }: { balances: Balance[]; onRewards: (id: number) => void }) {
  const [open, setOpen] = useState(false)
  const reward = homeReward(balances, savedGoals())
  const balance = reward?.balance ?? balances.find((b) => hasEstimates(PROGRAMS[b.programId])) ?? balances[0]
  if (!balance) return null

  const program = PROGRAMS[balance.programId]
  const cash = isCash(balance)
  const stale = isStale(balance)
  const supported = hasEstimates(program)
  const credit = reward?.example.id === 'credit'
  // Don't promise to reduce a known bill by more than is owed. Unknown/zero bills show the available value.
  const amount = reward && credit && balance.cardBalance != null && balance.cardBalance > 0
    ? reward.estimate.covered : reward?.estimate.value
  const value = `${cash ? '' : '≈'}${fmtUSD(amount ?? 0)}`
  const walletLink = `#wallet/${balance.id}`

  return <>
    <section className={`${styles.card} ${styles.darkCard} ${styles.homeRewards}`} aria-labelledby="home-rewards-title">
      <div className={styles.cardHead}>
        <h2 id="home-rewards-title">{reward ? stale ? 'From your saved balance' : 'Ready to use' : 'Your rewards'}</h2>
        <a className={styles.homeWalletLink} href={walletLink}>Wallet <LuArrowRight aria-hidden="true" /></a>
      </div>
      <div className={styles.homeRewardProduct}>
        <CardArt balance={balance} />
        <span>{balance.cardName} · {cash ? 'cashback' : `${fmtPts(balance.amount)} ${program.unit}`}</span>
      </div>
      {reward ? <>
        <h3 className={styles.homeRewardHeadline}>
          {credit && balance.cardBalance !== 0 ? <>Put <strong>{value}</strong><br />toward your card bill.</>
            : credit ? <><strong>{value}</strong> in rewards<br />you could put to use.</>
            : <>Your {program.unit} could cover<br /><strong>{value}</strong> {reward.example.goal === 'travel' ? 'in travel.' : 'in gift cards.'}</>}
        </h3>
        <p className={styles.homeRewardBody}>
          {stale ? 'Your balance may have changed. Update it to see what you can use.'
            : cash ? 'Your cashback can become a statement credit.'
            : `At an illustrative ${reward.estimate.cpp}¢ per ${program.unit === 'miles' ? 'mile' : 'point'}. Check the final value with your issuer.`}
        </p>
        {stale ? <button className={styles.homeTextLink} onClick={() => onRewards(balance.id)}>Update balance <LuArrowRight aria-hidden="true" /></button>
          : <button className={styles.homeTextLink} onClick={() => setOpen(true)}>See how to redeem <LuArrowRight aria-hidden="true" /></button>}
      </> : <>
        <h3 className={styles.homeRewardHeadline}>{supported ? 'See what your rewards could cover.' : 'Keep your rewards in view.'}</h3>
        <p className={styles.homeRewardBody}>{supported ? 'Update your rewards balance to turn it into something useful.' : 'We don’t have value estimates for this program yet. Check your card’s rewards portal for options.'}</p>
        {supported ? <button className={styles.homeTextLink} onClick={() => onRewards(balance.id)}>Update balance <LuArrowRight aria-hidden="true" /></button>
          : <a className={styles.homeTextLink} href={walletLink}>View your wallet <LuArrowRight aria-hidden="true" /></a>}
      </>}
    </section>

    {reward && <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="bottom">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content className={styles.root} maxW="430px" mx="auto" roundedTop="20px" pb="env(safe-area-inset-bottom)">
            <Drawer.Header pr="12" flexDirection="column" alignItems="flex-start" gap="0">
              <div className={styles.homeRedemptionProgram}>{balance.cardName} · {credit ? 'statement credit' : reward.example.title.toLowerCase()}</div>
              <Drawer.Title fontSize="24px" fontWeight="600">Make those rewards count.</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <p className={styles.body}>
                {cash ? <>Your saved cashback balance is <strong>{fmtUSD(balance.amount)}</strong>.</>
                  : <>Your saved <strong>{fmtPts(balance.amount)} {program.unit}</strong> could be worth about <strong>{fmtUSD(reward.estimate.value)}</strong> in {credit ? 'statement credit' : reward.example.goal === 'travel' ? 'travel' : 'gift cards'}.</>}
              </p>
              <ol className={styles.rewardsSteps}>{redemptionSteps(balance, reward.example.id).map((step) => <li key={step}>{step}</li>)}</ol>
              <p className={styles.homeRedemptionNote}>Confirm your current balance, redemption options, and final value with your issuer. This preview doesn’t redeem anything.</p>
              <a className={styles.homeTextLink} href={walletLink} onClick={() => setOpen(false)}>Explore in Wallet <LuArrowRight aria-hidden="true" /></a>
            </Drawer.Body>
            <Drawer.Footer>
              <Button w="full" rounded="12px" bg="#b2ff4a" color="#182117" onClick={() => setOpen(false)}>Got it</Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild><CloseButton aria-label="Close redemption guide" size="md" /></Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>}
  </>
}
