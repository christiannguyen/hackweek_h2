import { useState } from 'react'
import { Button, Heading, Stack, Text } from '@chakra-ui/react'
import { ColorModeButton } from '@/components/ui/color-mode'
import styles from './App.module.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className={styles.page}>
      <ColorModeButton className={styles.colorModeToggle} />
      <Stack gap="4" align="center">
        <Heading size="3xl">hackweek_h2</Heading>
        <Text color="fg.muted">
          React + Vite + TypeScript + Chakra UI + CSS Modules
        </Text>
        <Button onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </Button>
      </Stack>
    </main>
  )
}

export default App
