import { useState } from 'react'
import { Button, Checkbox, CloseButton, Drawer, Portal, Stack } from '@chakra-ui/react'
import { LuLogOut, LuRotateCcw } from 'react-icons/lu'
import styles from './pointpool.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onLogout: (removeCards: boolean) => void
}

// Account menu from the top bar. SIMULATED like sign-up: there's no real session, so logging out just returns to the
// Welcome screen. Cards stay in this browser unless the user chooses to remove them.
export function AccountSheet({ open, onClose, onLogout }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [removeCards, setRemoveCards] = useState(false)

  return (
    <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="bottom">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="430px" mx="auto" roundedTop="20px" pb="env(safe-area-inset-bottom)">
            <Drawer.Header>
              <Drawer.Title fontSize="18px" fontWeight="600">
                {confirming ? 'Log out of Pointpool?' : 'Account'}
              </Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              {!confirming ? (
                <Stack gap="1">
                  <p className={styles.body}>Demo account · signed in on this browser</p>
                  <a className={styles.row} href="#welcome" onClick={onClose}>
                    <div className={`${styles.rowIcon} ${styles.gray}`}><LuRotateCcw aria-hidden="true" /></div>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>Replay onboarding</div>
                      <div className={styles.rowSub}>Add cards and pick where rewards could go</div>
                    </div>
                    <span className={styles.chev}>›</span>
                  </a>
                  <button type="button" className={styles.row} onClick={() => setConfirming(true)}
                    style={{ width: '100%', border: 0, background: 'none', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                    <div className={`${styles.rowIcon} ${styles.gray}`}><LuLogOut aria-hidden="true" /></div>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>Log out</div>
                    </div>
                  </button>
                </Stack>
              ) : (
                <Stack gap="4">
                  <p className={styles.body}>Your cards stay saved in this browser, so they’ll be here when you log back in.</p>
                  <Checkbox.Root checked={removeCards} onCheckedChange={(e) => setRemoveCards(!!e.checked)} colorPalette="green">
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontSize="14px">Also remove my cards from this browser</Checkbox.Label>
                  </Checkbox.Root>
                </Stack>
              )}
            </Drawer.Body>
            {confirming && (
              <Drawer.Footer justifyContent="space-between">
                <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
                <Button rounded="full" bg="#b2ff4a" color="#182117" px="6" onClick={() => onLogout(removeCards)}>
                  Log out
                </Button>
              </Drawer.Footer>
            )}
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Close" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
