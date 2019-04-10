import React from 'react'

import { EventColumn } from '../components/columns/EventColumn'
import { IssueOrPullRequestColumn } from '../components/columns/IssueOrPullRequestColumn'
import { NotificationColumn } from '../components/columns/NotificationColumn'
import { useColumn } from '../hooks/use-column'
import { bugsnag } from '../libs/bugsnag'

export interface ColumnContainerProps {
  columnId: string
  disableColumnOptions?: boolean
  pagingEnabled?: boolean
  swipeable?: boolean
}

export const ColumnContainer = React.memo((props: ColumnContainerProps) => {
  const { columnId, disableColumnOptions, pagingEnabled, swipeable } = props

  const { column, columnIndex, subscriptions } = useColumn(columnId)

  if (!column) return null

  switch (column.type) {
    case 'activity': {
      return (
        <EventColumn
          key={`event-column-${column.id}`}
          column={column}
          columnIndex={columnIndex}
          disableColumnOptions={disableColumnOptions}
          pagingEnabled={pagingEnabled}
          subscriptions={subscriptions}
          swipeable={swipeable}
        />
      )
    }

    case 'issue_or_pr': {
      return (
        <IssueOrPullRequestColumn
          key={`issue-or-pr-column-${column.id}`}
          column={column}
          columnIndex={columnIndex}
          disableColumnOptions={disableColumnOptions}
          pagingEnabled={pagingEnabled}
          subscriptions={subscriptions}
          swipeable={swipeable}
        />
      )
    }

    case 'notifications': {
      return (
        <NotificationColumn
          key={`notification-column-${column.id}`}
          column={column}
          columnIndex={columnIndex}
          disableColumnOptions={disableColumnOptions}
          pagingEnabled={pagingEnabled}
          subscriptions={subscriptions}
          swipeable={swipeable}
        />
      )
    }

    default: {
      const message = `Invalid Column type: ${(column as any).type}`
      console.error(message)
      bugsnag.notify(new Error(message))
      return null
    }
  }
})
