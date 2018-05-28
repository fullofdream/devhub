import React, { PureComponent } from 'react'

import SwipeableRow from '../../libs/swipeable'
import theme from '../../styles/themes/dark'
import NotificationCard, { NotificationCardProps } from './NotificationCard'

export interface SwipeableNotificationCardProps extends NotificationCardProps {}

export interface SwipeableNotificationCardState {}

export default class SwipeableNotificationCard extends PureComponent<
  SwipeableNotificationCardProps,
  SwipeableNotificationCardState
> {
  handleArchive = () => {
    // alert('Archive')
  }

  handleMarkAsRead = () => {
    // alert('Mark as read')
  }

  handleSnooze = () => {
    // alert('Snooze')
  }

  render() {
    return (
      <SwipeableRow
        leftActions={[
          {
            color: theme.blue,
            icon: 'isRead',
            key: 'isRead',
            label: 'Read',
            onPress: this.handleMarkAsRead,
            type: 'FULL',
          },
        ]}
        rightActions={[
          {
            color: theme.orange,
            icon: 'snooze',
            key: 'snooze',
            label: 'Snooze',
            onPress: this.handleSnooze,
          },
          {
            color: theme.base01,
            icon: 'archive',
            key: 'archive',
            label: 'Archive',
            onPress: this.handleArchive,
          },
        ]}
      >
        <NotificationCard {...this.props} />
      </SwipeableRow>
    )
  }
}
