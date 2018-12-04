import _ from 'lodash'
import React, { useEffect, useRef, useState } from 'react'

import {
  ActivitySubscription,
  Column,
  ColumnSubscription,
  EnhancedGitHubEvent,
  GitHubEvent,
  LoadState,
  Omit,
} from '@devhub/core/src/types'
import { EventCards, EventCardsProps } from '../components/cards/EventCards'
import { getActivity } from '../libs/github'
import { getFilteredEvents } from '../utils/helpers/filters'

export type EventCardsContainerProps = Omit<
  EventCardsProps,
  'errorMessage' | 'events' | 'fetchNextPage' | 'loadState' | 'refresh'
> & {
  column: Column
  subscriptions: ColumnSubscription[]
}

export const EventCardsContainer = React.memo(
  (props: EventCardsContainerProps) => {
    const { column, subscriptions } = props

    const hasFetchedRef = useRef(false)
    const [_canFetchMore, setCanFetchMore] = useState(false)
    const [events, setEvents] = useState<GitHubEvent[]>([])
    const [filteredEvents, setFilteredEvents] = useState<EnhancedGitHubEvent[]>(
      [],
    )
    const [olderEventDate, setOlderEventDate] = useState<string | undefined>(
      undefined,
    )
    const [loadState, setLoadState] = useState<LoadState>('loading_first')
    const [pagination, setPagination] = useState({ page: 1, perPage: 10 })

    const [error, setError] = useState<{
      [key: string]: any
      message: string
    } | null>(null)

    useEffect(() => {
      fetchData()
    }, [])

    useEffect(() => {
      const timer = setInterval(fetchData, 1000 * 60)
      return () => clearInterval(timer)
    })

    useEffect(
      () => {
        if (!hasFetchedRef.current) return
        setLoadState('loaded')
      },
      [events],
    )

    useEffect(
      () => {
        setFilteredEvents(getFilteredEvents(events, column.filters))
      },
      [events, column.filters],
    )

    const fetchData = async ({
      page: _page,
      perPage: _perPage,
    }: { page?: number; perPage?: number } = {}) => {
      const {
        id: subscriptionId,
        params: _params,
        subtype: activityType,
      } = subscriptions[0] as ActivitySubscription

      const page = Math.max(1, _page || 1)
      const perPage = Math.min(_perPage || pagination.perPage || 10, 50)

      try {
        setLoadState(prevLoadState =>
          page > 1
            ? 'loading_more'
            : !prevLoadState ||
              prevLoadState === 'not_loaded' ||
              prevLoadState === 'loading_first'
            ? 'loading_first'
            : 'loading',
        )

        const params = { ..._params, page, per_page: perPage }
        const response = await getActivity(activityType, params, {
          subscriptionId,
        })

        if (!hasFetchedRef.current) hasFetchedRef.current = true

        if (Array.isArray(response.data) && response.data.length) {
          const olderDateFromThisResponse = getOlderEventDate(response.data)

          setEvents(prevEvents =>
            _.uniqBy(_.concat(response.data, prevEvents), 'id'),
          )
          setPagination(prevPagination => ({ ...prevPagination, page }))
          setLoadState('loaded')

          if (
            !olderEventDate ||
            (olderDateFromThisResponse &&
              olderDateFromThisResponse <= olderEventDate)
          ) {
            setOlderEventDate(olderDateFromThisResponse)

            if (response.data.length >= perPage) {
              const clearedAt = column.filters && column.filters.clearedAt
              if (clearedAt && clearedAt >= olderDateFromThisResponse) {
                setCanFetchMore(false)
              } else {
                setCanFetchMore(true)
              }
            } else {
              setCanFetchMore(false)
            }
          }
        } else {
          setLoadState('loaded')
          setPagination(prevPagination => ({ ...prevPagination, page }))
          setCanFetchMore(false)
        }
        setError(null)
      } catch (error) {
        console.error('Failed to load GitHub activity', error)
        setLoadState('error')
        setError(error)
      }
    }

    const fetchNextPage = ({ perPage }: { perPage?: number } = {}) => {
      const nextPage = (pagination.page || 1) + 1
      fetchData({ page: nextPage, perPage })
    }

    const canFetchMore = (() => {
      const clearedAt = column.filters && column.filters.clearedAt
      const olderDate = getOlderEventDate(events)

      if (clearedAt && olderDate && clearedAt >= olderDate) return false
      return _canFetchMore
    })()

    return (
      <EventCards
        {...props}
        key={`event-cards-${column.id}`}
        errorMessage={(error && error.message) || ''}
        events={filteredEvents}
        fetchNextPage={canFetchMore ? fetchNextPage : undefined}
        loadState={loadState}
        refresh={() => fetchData()}
      />
    )
  },
)

function getOlderEventDate(events: GitHubEvent[]) {
  const olderItem = _.orderBy(events, 'created_at', 'asc')[0]
  return olderItem && olderItem.created_at
}
