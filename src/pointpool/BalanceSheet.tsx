import { useState } from 'react'
import { Button, Drawer, Field, Input, NativeSelect, Portal, Stack } from '@chakra-ui/react'
import { PROGRAMS, type Balance, type ProgramId } from './data'

interface Props {
  open: boolean
  balance?: Balance
  purpose?: 'rewards'
  onClose: () => void
  onSave: (entry: Omit<Balance, 'id' | 'updatedAt'>, id?: number) => void
  onRemove: (id: number) => void
}

// Bottom sheet for adding / editing a balance. Remount (via key) on each open to reset the form.
export function BalanceSheet({ open, balance, purpose, onClose, onSave, onRemove }: Props) {
  const [programId, setProgramId] = useState<ProgramId>(balance?.programId ?? 'chase_ur')
  const [cardName, setCardName] = useState(balance?.cardName ?? '')
  const [amount, setAmount] = useState(balance ? String(balance.amount) : '')
  const [creditLimit, setCreditLimit] = useState(balance?.creditLimit ? String(balance.creditLimit) : '')
  const [cardBalance, setCardBalance] = useState(balance?.cardBalance ? String(balance.cardBalance) : '')

  const cash = PROGRAMS[programId].type === 'cashback'
  const value = Number(amount)
  const valid = cardName.trim() !== '' && amount.trim() !== '' && Number.isFinite(value) && value >= 0 && (cash || Number.isInteger(value))

  const save = () => {
    if (!valid) return
    onSave({
      programId,
      cardName: cardName.trim(),
      amount: value,
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
      cardBalance: cardBalance ? Number(cardBalance) : undefined,
    }, balance?.id)
    onClose()
  }

  const remove = () => {
    if (balance && confirm('Remove this balance?')) {
      onRemove(balance.id)
      onClose()
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="bottom">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content maxW="430px" mx="auto" roundedTop="20px" pb="env(safe-area-inset-bottom)">
            <Drawer.Header>
              <Drawer.Title fontSize="17px" fontWeight="500">
                {purpose === 'rewards' ? balance ? 'Update rewards balance' : 'Enter your rewards' : balance ? 'Edit balance' : 'Add a card'}
              </Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="4">
                {purpose === 'rewards' && <p style={{fontSize: 13, color: '#626b5e'}}>Find your available points, miles, or cashback in your card’s app and enter them here. This balance won’t update automatically.</p>}
                <Field.Root>
                  <Field.Label fontSize="13px">Rewards program</Field.Label>
                  <NativeSelect.Root size="md">
                    <NativeSelect.Field
                      value={programId}
                      onChange={(e) => setProgramId(e.currentTarget.value as ProgramId)}
                      rounded="12px"
                    >
                      {(Object.keys(PROGRAMS) as ProgramId[]).map((id) => (
                        <option key={id} value={id}>
                          {PROGRAMS[id].name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="13px">Card name</Field.Label>
                  <Input
                    value={cardName}
                    onChange={(e) => setCardName(e.currentTarget.value)}
                    placeholder="e.g. Discover it Secured"
                    rounded="12px"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="13px">{cash ? 'Cashback balance ($)' : PROGRAMS[programId].unit === 'miles' ? 'Miles balance' : 'Points balance'}</Field.Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={cash ? '0.01' : '1'}
                    value={amount}
                    onChange={(e) => setAmount(e.currentTarget.value)}
                    placeholder={cash ? '42.18' : '50000'}
                    rounded="12px"
                  />
                  <Field.HelperText fontSize="12px">Saved in this browser. {cash ? 'Enter dollars and cents.' : 'Enter a whole number of points or miles.'}</Field.HelperText>
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="13px">Credit limit ($)</Field.Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.currentTarget.value)}
                    placeholder="500"
                    rounded="12px"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="13px">Current balance ($)</Field.Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={cardBalance}
                    onChange={(e) => setCardBalance(e.currentTarget.value)}
                    placeholder="142.50"
                    rounded="12px"
                  />
                  <Field.HelperText fontSize="12px">Saved privately in this browser — your card account stays separate.</Field.HelperText>
                </Field.Root>
              </Stack>
            </Drawer.Body>
            <Drawer.Footer justifyContent="space-between">
              {balance ? (
                <Button variant="ghost" color="#f05a1a" onClick={remove}>
                  Remove
                </Button>
              ) : (
                <span />
              )}
              <Button rounded="full" bg="#b2ff4a" color="#182117" px="6" disabled={!valid} onClick={save}>
                {purpose === 'rewards' ? 'Save balance' : 'Save'}
              </Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger />
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
