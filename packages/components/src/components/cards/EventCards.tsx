import React, { useCallback, useMemo, useRef } from 'react'
import { FlatList, FlatListProps, View } from 'react-native'

import {
  Column,
  constants,
  EnhancedGitHubEvent,
  EnhancedLoadState,
  getDateSmallText,
  isItemRead,
  Omit,
} from '@devhub/core'
import { useAppViewMode } from '../../hooks/use-app-view-mode'
import useKeyPressCallback from '../../hooks/use-key-press-callback'
import { useKeyboardScrolling } from '../../hooks/use-keyboard-scrolling'
import { useReduxAction } from '../../hooks/use-redux-action'
import { bugsnag, ErrorBoundary } from '../../libs/bugsnag'
import * as actions from '../../redux/actions'
import { Button } from '../common/Button'
import { fabSize } from '../common/FAB'
import { RefreshControl } from '../common/RefreshControl'
import { Spacer } from '../common/Spacer'
import { useFocusedColumn } from '../context/ColumnFocusContext'
import { useAppLayout } from '../context/LayoutContext'
import { useTheme } from '../context/ThemeContext'
import { fabSpacing, shouldRenderFAB } from '../layout/FABRenderer'
import { EmptyCards, EmptyCardsProps } from './EmptyCards'
import { EventCard, EventCardProps } from './EventCard'
import {
  CardItemSeparator,
  getCardItemSeparatorThemeColor,
} from './partials/CardItemSeparator'
import { SwipeableEventCard } from './SwipeableEventCard'

export interface EventCardsProps
  extends Omit<EventCardProps, 'event' | 'isFocused'> {
  column: Column
  columnIndex: number
  errorMessage: EmptyCardsProps['errorMessage']
  events: EnhancedGitHubEvent[]
  fetchNextPage: (() => void) | undefined
  lastFetchedAt: string | undefined
  loadState: EnhancedLoadState
  refresh: EmptyCardsProps['refresh']
  repoIsKnown: boolean
  swipeable?: boolean
}

function keyExtractor(event: EnhancedGitHubEvent, _index: number) {
  return `event-card-${event.id}`
}

export const EventCards = React.memo((props: EventCardsProps) => {
  const {
    cardViewMode,
    column,
    columnIndex,
    enableCompactLabels,
    errorMessage,
    events,
    fetchNextPage,
    lastFetchedAt,
    loadState,
    refresh,
  } = props

  const flatListRef = React.useRef<FlatList<EnhancedGitHubEvent>>(null)

  const { appViewMode } = useAppViewMode()
  const theme = useTheme()

  const visibleItemIndexesRef = useRef<number[]>([])

  const getVisibleItemIndex = useCallback(() => {
    if (
      !(visibleItemIndexesRef.current && visibleItemIndexesRef.current.length)
    )
      return

    return visibleItemIndexesRef.current[0]
  }, [])

  const [selectedItemId] = useKeyboardScrolling(flatListRef, {
    columnId: column.id,
    getVisibleItemIndex,
    items: events,
  })
  const { focusedColumnId } = useFocusedColumn()
  const _hasSelectedItem = !!selectedItemId && column.id === focusedColumnId
  const selectedItem =
    _hasSelectedItem && events.find(event => event.id === selectedItemId)

  const markItemsAsReadOrUnread = useReduxAction(
    actions.markItemsAsReadOrUnread,
  )
  const saveItemsForLater = useReduxAction(actions.saveItemsForLater)

  useKeyPressCallback(
    's',
    useCallback(() => {
      if (!selectedItem) return

      saveItemsForLater({
        itemIds: [selectedItemId!],
        save: !selectedItem.saved,
      })
    }, [selectedItem, selectedItemId]),
  )

  useKeyPressCallback(
    'r',
    useCallback(() => {
      if (!selectedItem) return

      markItemsAsReadOrUnread({
        type: 'activity',
        itemIds: [selectedItemId!],
        unread: isItemRead(selectedItem),
      })
    }, [selectedItem, selectedItemId]),
  )

  const setColumnClearedAtFilter = useReduxAction(
    actions.setColumnClearedAtFilter,
  )

  const _handleViewableItemsChanged: FlatListProps<
    EnhancedGitHubEvent
  >['onViewableItemsChanged'] = ({ viewableItems }) => {
    visibleItemIndexesRef.current = viewableItems
      .filter(v => v.isViewable && typeof v.index === 'number')
      .map(v => v.index!)
  }
  const handleViewableItemsChanged = useCallback(
    _handleViewableItemsChanged,
    [],
  )

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 100,
    }),
    [],
  )

  const _renderItem: FlatListProps<EnhancedGitHubEvent>['renderItem'] = ({
    item: event,
  }) => {
    if (props.swipeable) {
      return (
        <SwipeableEventCard
          cardViewMode={cardViewMode}
          enableCompactLabels={enableCompactLabels}
          event={event}
          repoIsKnown={props.repoIsKnown}
          isFocused={
            column.id === focusedColumnId && event.id === selectedItemId
          }
        />
      )
    }

    return (
      <ErrorBoundary>
        <EventCard
          cardViewMode={cardViewMode}
          enableCompactLabels={enableCompactLabels}
          event={event}
          isFocused={
            column.id === focusedColumnId && event.id === selectedItemId
          }
          repoIsKnown={props.repoIsKnown}
        />
      </ErrorBoundary>
    )
  }

  const renderItem = useCallback(_renderItem, [
    cardViewMode,
    column.id === focusedColumnId && selectedItemId,
    enableCompactLabels,
    props.swipeable,
    props.repoIsKnown,
  ])

  const renderFooter = useCallback(() => {
    const { sizename } = useAppLayout()

    return (
      <>
        <CardItemSeparator />

        {fetchNextPage ? (
          <View>
            <Button
              analyticsLabel={loadState === 'error' ? 'try_again' : 'load_more'}
              children={loadState === 'error' ? 'Oops. Try again' : 'Load more'}
              disabled={loadState !== 'loaded'}
              loading={
                loadState === 'loading_first' || loadState === 'loading_more'
              }
              onPress={fetchNextPage}
              round={false}
            />
          </View>
        ) : column.filters && column.filters.clearedAt ? (
          <View>
            <Button
              analyticsLabel="show_cleared"
              borderOnly
              children="Show cleared items"
              disabled={loadState !== 'loaded'}
              onPress={() => {
                setColumnClearedAtFilter({
                  clearedAt: null,
                  columnId: column.id,
                })

                if (refresh) refresh()
              }}
              round={false}
            />
          </View>
        ) : null}

        {shouldRenderFAB({ sizename }) && (
          <Spacer height={fabSize + 2 * fabSpacing} />
        )}
      </>
    )
  }, [
    fetchNextPage,
    loadState,
    column.id,
    column.filters && column.filters.clearedAt,
    refresh,
  ])

  const _onScrollToIndexFailed: FlatListProps<
    string
  >['onScrollToIndexFailed'] = (info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => {
    console.error(info)
    bugsnag.notify({
      name: 'ScrollToIndexFailed',
      message: 'Failed to scroll to index',
      ...info,
    })
  }
  const onScrollToIndexFailed = useCallback(_onScrollToIndexFailed, [])

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        intervalRefresh={lastFetchedAt}
        onRefresh={refresh}
        refreshing={loadState === 'loading' || loadState === 'loading_first'}
        title={
          lastFetchedAt
            ? `Last updated ${getDateSmallText(lastFetchedAt, true)}`
            : 'Pull to refresh'
        }
      />
    ),
    [lastFetchedAt, refresh, loadState],
  )

  const rerender = useMemo(() => ({}), [renderItem, renderFooter])

  const contentContainerStyle = useMemo(
    () => ({
      borderWidth: appViewMode === 'single-column' ? 1 : 0,
      borderColor:
        theme[getCardItemSeparatorThemeColor(theme.backgroundColor, true)],
    }),
    [theme],
  )

  if (columnIndex && columnIndex >= constants.COLUMNS_LIMIT) {
    return (
      <EmptyCards
        clearedAt={column.filters && column.filters.clearedAt}
        columnId={column.id}
        errorMessage={`You have reached the limit of ${
          constants.COLUMNS_LIMIT
        } columns. This is to maintain a healthy usage of the GitHub API.`}
        errorTitle="Too many columns"
        fetchNextPage={undefined}
        loadState="error"
        refresh={undefined}
      />
    )
  }

  if (!(events && events.length)) {
    return (
      <EmptyCards
        clearedAt={column.filters && column.filters.clearedAt}
        columnId={column.id}
        errorMessage={errorMessage}
        fetchNextPage={fetchNextPage}
        loadState={loadState}
        refresh={refresh}
      />
    )
  }

  return (
    <FlatList
      ref={flatListRef}
      ItemSeparatorComponent={CardItemSeparator}
      ListFooterComponent={renderFooter}
      alwaysBounceVertical
      bounces
      contentContainerStyle={contentContainerStyle}
      data={events}
      extraData={rerender}
      initialNumToRender={15}
      keyExtractor={keyExtractor}
      maxToRenderPerBatch={3}
      onScrollToIndexFailed={onScrollToIndexFailed}
      onViewableItemsChanged={handleViewableItemsChanged}
      refreshControl={refreshControl}
      removeClippedSubviews
      renderItem={renderItem}
      viewabilityConfig={viewabilityConfig}
      windowSize={2}
    />
  )
})
