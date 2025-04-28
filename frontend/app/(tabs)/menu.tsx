import { MenuScreen } from '@/components/screens'
import { MoveBack, SafeAreaViews } from '@/components/ui'
import React from 'react'

const Menu = () => {
  return (
    <SafeAreaViews style={{ padding: 0 }}>
      <MoveBack path={'/'} />
      <MenuScreen />
    </SafeAreaViews>
  )
}

export default Menu