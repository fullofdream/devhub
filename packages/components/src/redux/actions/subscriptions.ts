import { createAction, createErrorActionWithPayload } from '../helpers'

export function fetchColumnSubscriptionRequest(payload: {
  columnId: string
  params: {
    [key: string]: string | number | undefined
    page: number
    perPage?: number
  }
}) {
  return createAction('FETCH_COLUMN_SUBSCRIPTIONS', payload)
}

export function deleteColumnSubscriptions(subscriptionIds: string[]) {
  return createAction('DELETE_COLUMN_SUBSCRIPTIONS', subscriptionIds)
}

export function fetchSubscriptionRequest(payload: {
  subscriptionId: string
  params: {
    [key: string]: string | number | undefined
    page: number
    perPage?: number
  }
}) {
  return createAction('FETCH_SUBSCRIPTION_REQUEST', payload)
}

export function fetchSubscriptionSuccess(payload: {
  subscriptionId: string
  data: any
  canFetchMore: boolean
}) {
  return createAction('FETCH_SUBSCRIPTION_SUCCESS', payload)
}

export function fetchSubscriptionFailure<E extends Error>(
  payload: { subscriptionId: string },
  error: E,
) {
  return createErrorActionWithPayload(
    'FETCH_SUBSCRIPTION_FAILURE',
    payload,
    error,
  )
}
