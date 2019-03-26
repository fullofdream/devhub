import React from 'react'

import { getGitHubURLForBranch, Omit } from '@devhub/core'
import { useCSSVariablesOrSpringAnimatedTheme } from '../../../../hooks/use-css-variables-or-spring--animated-theme'
import { SpringAnimatedIcon } from '../../../animated/spring/SpringAnimatedIcon'
import { SpringAnimatedText } from '../../../animated/spring/SpringAnimatedText'
import { Avatar } from '../../../common/Avatar'
import { Link } from '../../../common/Link'
import { cardStyles, getCardStylesForTheme } from '../../styles'
import { BaseRow, BaseRowProps } from './partials/BaseRow'
import { cardRowStyles } from './styles'

export interface BranchRowProps
  extends Omit<
    BaseRowProps,
    'containerStyle' | 'contentContainerStyle' | 'left' | 'right'
  > {
  branch: string
  isBranchMainEvent: boolean
  isRead: boolean
  ownerName: string
  repositoryName: string
}

export interface BranchRowState {}

export const BranchRow = React.memo((props: BranchRowProps) => {
  const springAnimatedTheme = useCSSVariablesOrSpringAnimatedTheme()

  const {
    branch: _branch,
    isBranchMainEvent,
    isRead,
    ownerName,
    repositoryName,
    ...otherProps
  } = props

  const branch = (_branch || '').replace('refs/heads/', '')
  if (!branch) return null

  if (branch === 'master' && !isBranchMainEvent) return null

  return (
    <BaseRow
      {...otherProps}
      left={
        <Avatar
          isBot={Boolean(ownerName && ownerName.indexOf('[bot]') >= 0)}
          linkURL=""
          small
          style={cardStyles.avatar}
          username={ownerName}
        />
      }
      right={
        <Link
          href={getGitHubURLForBranch(ownerName, repositoryName, branch)}
          style={cardRowStyles.mainContentContainer}
        >
          <SpringAnimatedText
            numberOfLines={1}
            style={[
              getCardStylesForTheme(springAnimatedTheme).normalText,
              (isRead || !isBranchMainEvent) &&
                getCardStylesForTheme(springAnimatedTheme).mutedText,
            ]}
          >
            <SpringAnimatedIcon
              name="git-branch"
              size={13}
              style={[
                getCardStylesForTheme(springAnimatedTheme).normalText,
                getCardStylesForTheme(springAnimatedTheme).icon,
                isRead && getCardStylesForTheme(springAnimatedTheme).mutedText,
              ]}
            />{' '}
            {branch}
          </SpringAnimatedText>
        </Link>
      }
    />
  )
})
