import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  constants,
  EnhancedGitHubIssueOrPullRequest,
  getOlderIssueOrPullRequestDate,
  getOwnerAndRepo,
  IssueOrPullRequestColumnSubscription,
  Omit,
} from '@devhub/core'
import { View } from 'react-native'
import { EmptyCards } from '../components/cards/EmptyCards'
import { GenericMessageWithButtonView } from '../components/cards/GenericMessageWithButtonView'
import {
  IssueOrPullRequestCards,
  IssueOrPullRequestCardsProps,
} from '../components/cards/IssueOrPullRequestCards'
import { NoTokenView } from '../components/cards/NoTokenView'
import { ButtonLink } from '../components/common/ButtonLink'
import { useAppViewMode } from '../hooks/use-app-view-mode'
import { useGitHubAPI } from '../hooks/use-github-api'
import { useReduxAction } from '../hooks/use-redux-action'
import { useReduxState } from '../hooks/use-redux-state'
import { octokit } from '../libs/github'
import * as actions from '../redux/actions'
import * as selectors from '../redux/selectors'
import { contentPadding } from '../styles/variables'
import { getGitHubAppInstallUri } from '../utils/helpers/shared'

export type IssueOrPullRequestCardsContainerProps = Omit<
  IssueOrPullRequestCardsProps,
  | 'cardViewMode'
  | 'errorMessage'
  | 'items'
  | 'fetchNextPage'
  | 'lastFetchedAt'
  | 'loadState'
  | 'refresh'
>

export const IssueOrPullRequestCardsContainer = React.memo(
  (props: IssueOrPullRequestCardsContainerProps) => {
    const { column, ...otherProps } = props

    const [canFetchMore, setCanFetchMore] = useState(false)

    const { cardViewMode } = useAppViewMode()

    const appToken = useReduxState(selectors.appTokenSelector)
    const githubAppToken = useReduxState(selectors.githubAppTokenSelector)
    const githubOAuthToken = useReduxState(selectors.githubOAuthTokenSelector)

    // TODO: Support multiple subscriptions per column.
    const mainSubscription = useReduxState(
      useCallback(
        state => selectors.columnSubscriptionSelector(state, column.id),
        [column.id],
      ),
    ) as IssueOrPullRequestColumnSubscription | undefined

    const data = (mainSubscription && mainSubscription.data) || {}

    const isNotFound = (data.errorMessage || '')
      .toLowerCase()
      .includes('not found')

    const subscriptionOwnerOrOrg =
      getOwnerAndRepo(
        (mainSubscription &&
          mainSubscription.params &&
          mainSubscription.params.repoFullName) ||
          '',
      ).owner || undefined

    const ownerResponse = useGitHubAPI(
      octokit.users.getByUsername,
      isNotFound && subscriptionOwnerOrOrg
        ? { username: subscriptionOwnerOrOrg }
        : null,
    )

    const username = useReduxState(selectors.currentGitHubUsernameSelector)

    const installationsLoadState = useReduxState(
      selectors.installationsLoadStateSelector,
    )

    const installationOwnerNames = useReduxState(
      selectors.installationOwnerNamesSelector,
    )

    const fetchColumnSubscriptionRequest = useReduxAction(
      actions.fetchColumnSubscriptionRequest,
    )

    const subscriptionsDataSelectorRef = useRef(
      selectors.createSubscriptionsDataSelector(),
    )

    const filteredSubscriptionsDataSelectorRef = useRef(
      selectors.createFilteredSubscriptionsDataSelector(cardViewMode),
    )

    useEffect(() => {
      subscriptionsDataSelectorRef.current = selectors.createSubscriptionsDataSelector()
      filteredSubscriptionsDataSelectorRef.current = selectors.createFilteredSubscriptionsDataSelector(
        cardViewMode,
      )
    }, [cardViewMode, ...column.subscriptionIds])

    const allItems = useReduxState(
      useCallback(
        state => {
          return (subscriptionsDataSelectorRef.current(
            state,
            column.subscriptionIds,
          ) as any) as EnhancedGitHubIssueOrPullRequest[]
        },
        [column.subscriptionIds, column.filters],
      ),
    )

    const filteredItems = useReduxState(
      useCallback(
        state => {
          return (filteredSubscriptionsDataSelectorRef.current(
            state,
            column.subscriptionIds,
            column.filters,
          ) as any) as EnhancedGitHubIssueOrPullRequest[]
        },
        [column.subscriptionIds, column.filters],
      ),
    )

    useEffect(() => {
      const clearedAt = column.filters && column.filters.clearedAt
      const olderDate = getOlderIssueOrPullRequestDate(allItems)

      const newValue =
        clearedAt && (!olderDate || (olderDate && clearedAt >= olderDate))
          ? false
          : !!data.canFetchMore

      if (newValue !== canFetchMore) setCanFetchMore(newValue)
    }, [allItems, column.filters, data.canFetchMore, canFetchMore])

    const fetchData = useCallback(
      ({ page }: { page?: number } = {}) => {
        fetchColumnSubscriptionRequest({
          columnId: column.id,
          params: {
            page: page || 1,
            perPage: constants.DEFAULT_PAGINATION_PER_PAGE,
          },
        })
      },
      [fetchColumnSubscriptionRequest, column.id],
    )

    const fetchNextPage = useCallback(() => {
      const size = allItems.length

      const perPage = constants.DEFAULT_PAGINATION_PER_PAGE
      const currentPage = Math.ceil(size / perPage)

      const nextPage = (currentPage || 0) + 1
      fetchData({ page: nextPage })
    }, [fetchData, allItems.length])

    const refresh = useCallback(() => {
      fetchData()
    }, [fetchData])

    if (!mainSubscription) return null

    if (!(appToken && githubOAuthToken)) {
      return <NoTokenView githubAppType={githubAppToken ? 'oauth' : 'both'} />
    }

    if (isNotFound) {
      if (!githubAppToken) return <NoTokenView githubAppType="app" />

      if (ownerResponse.loadingState === 'loading') {
        return (
          <EmptyCards
            clearedAt={undefined}
            columnId={column.id}
            fetchNextPage={undefined}
            loadState="loading"
            refresh={undefined}
          />
        )
      }

      if (ownerResponse.data && ownerResponse.data.id) {
        return (
          <View
            style={{
              flex: 1,
              alignContent: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              padding: contentPadding,
            }}
          >
            <GenericMessageWithButtonView
              buttonView={
                <ButtonLink
                  analyticsLabel="setup_github_app_from_column"
                  children="Install GitHub App"
                  disabled={
                    mainSubscription.data.loadState === 'loading' ||
                    mainSubscription.data.loadState === 'loading_first'
                  }
                  href={getGitHubAppInstallUri({
                    suggestedTargetId: ownerResponse.data.id,
                  })}
                  loading={
                    installationsLoadState === 'loading' ||
                    mainSubscription.data.loadState === 'loading' ||
                    mainSubscription.data.loadState === 'loading_first'
                  }
                  openOnNewTab={false}
                />
              }
              emoji="lock"
              subtitle="Install the GitHub App to unlock private access. No code permission required."
              title="Private repository?"
            />
          </View>
        )
      }
    }

    if (
      username &&
      `${subscriptionOwnerOrOrg || ''}`.toLowerCase() ===
        `${username || ''}`.toLowerCase() &&
      !(installationOwnerNames && installationOwnerNames.length)
    ) {
      return (
        <View
          style={{
            flex: 1,
            alignContent: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            padding: contentPadding,
          }}
        >
          <GenericMessageWithButtonView
            buttonView={
              <ButtonLink
                analyticsLabel="setup_github_app_from_user_repo_column"
                children="Install GitHub App"
                disabled={
                  mainSubscription.data.loadState === 'loading' ||
                  mainSubscription.data.loadState === 'loading_first'
                }
                href={getGitHubAppInstallUri()}
                loading={
                  installationsLoadState === 'loading' ||
                  mainSubscription.data.loadState === 'loading' ||
                  mainSubscription.data.loadState === 'loading_first'
                }
                openOnNewTab={false}
              />
            }
            emoji="sunny"
            subtitle="Please install the GitHub App to continue. No code permission required."
            title="Not installed"
          />
        </View>
      )
    }

    return (
      <IssueOrPullRequestCards
        {...otherProps}
        key={`issue-or-pr-cards-${column.id}`}
        column={column}
        errorMessage={mainSubscription.data.errorMessage || ''}
        fetchNextPage={canFetchMore ? fetchNextPage : undefined}
        lastFetchedAt={mainSubscription.data.lastFetchedAt}
        loadState={
          installationsLoadState === 'loading' && !filteredItems.length
            ? 'loading_first'
            : mainSubscription.data.loadState || 'not_loaded'
        }
        items={filteredItems}
        refresh={refresh}
      />
    )
  },
)
