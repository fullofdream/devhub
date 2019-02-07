import React, { useImperativeHandle, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { config, ReactSpringHook, useTransition } from 'react-spring/native'

import { Platform } from '../../libs/platform/index.web'
import { SpringAnimatedView } from '../animated/spring/SpringAnimatedView'

export type Transition = ReactSpringHook

export interface AccordionViewProps {
  children: React.ReactNode
  fixedSize?: number
  property: 'width' | 'height'
}

export interface AccordionView {
  setOnFinishListener: (callback: null | (() => void)) => void
  isLocked: () => boolean
  lock: () => void
  unlock: () => void
}

export const AccordionView = React.forwardRef(
  (props: AccordionViewProps, ref) => {
    const { children, fixedSize, property } = props

    const onFinishRef = useRef<null | (() => void)>(null)

    const contentSize = useRef({ width: 0, height: 0 })
    const [size, setSize] = useState<number | 'auto'>(fixedSize || 0)

    const transitions = useTransition(
      children ? [children] : [],
      () => 'accordion-view',
      {
        from: { [property]: 0 },
        enter: { [property]: children ? size : 0 },
        update: {
          [property]: children ? size : 0,
        },
        leave: { [property]: 0 },
        config: { ...config.default, precision: 1 },
        force: false,
        unique: true,
        // TODO: API was changed on v8.
        // Reimplement this or make this hack unnecessary,
        // fix the nested accordion animation use case in a different way
        // @see https://github.com/react-spring/react-spring/issues/512
        /*
        onRest: (
          _e: any,
          state: string,
          p: { width?: number | 'auto'; height?: number | 'auto' },
        ) => {
          if (!onFinishRef.current) return

          if (size !== 'auto' && p[property] && p[property]! > 0) {
            onFinishRef.current()
          } else if (state === 'leave' && p[property] === 0) {
            onFinishRef.current()
          }
        },
        */
      },
    )

    useImperativeHandle(ref, () => ({
      setOnFinishListener: (callback: null | (() => void)) => {
        onFinishRef.current = callback
      },
      isLocked: () => {
        return size === 'auto'
      },
      lock: () => {
        if (size !== 'auto') setSize('auto')
      },
      unlock: () => {
        if (size !== contentSize.current[property])
          setSize(contentSize.current[property])
      },
    }))

    const handleContentSizeChange = (width: number, height: number) => {
      contentSize.current = { width, height }

      const nextSize = property === 'width' ? width : height
      if (size !== nextSize && size !== 'auto' && nextSize > 0) {
        if (!fixedSize) setSize(nextSize)
      }
    }

    return (
      <>
        {transitions.map(({ key, item, props: animatedStyle }) => (
          <SpringAnimatedView
            key={key}
            style={{
              ...(animatedStyle as any),
              overflow: 'hidden',
            }}
          >
            {Platform.OS === 'web' ? (
              <View
                onLayout={e => {
                  const { width, height } = e.nativeEvent.layout
                  handleContentSizeChange(width, height)
                }}
              >
                {item}
              </View>
            ) : (
              <ScrollView
                bounces={false}
                onContentSizeChange={handleContentSizeChange}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                {item}
              </ScrollView>
            )}
          </SpringAnimatedView>
        ))}
      </>
    )
  },
)
