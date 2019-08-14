import _ from 'lodash'
import { REHYDRATE } from 'redux-persist'

import { User } from '@devhub/core'
import { Reducer } from '../types'

export interface AuthError {
  name: string
  message: string
  status?: number
  response?: any
}

export interface State {
  appToken: string | null
  error: AuthError | null
  isDeletingAccount: boolean
  isLoggingIn: boolean
  user: Pick<
    User,
    '_id' | 'plan' | 'lastLoginAt' | 'createdAt' | 'updatedAt'
  > | null
}

const initialState: State = {
  appToken: null,
  error: null,
  isDeletingAccount: false,
  isLoggingIn: false,
  user: null,
}

export const authReducer: Reducer<State> = (state = initialState, action) => {
  switch (action.type) {
    case REHYDRATE as any: {
      const { err, payload } = action as any

      const auth: State = err ? state : payload && payload.auth

      return {
        ...auth,
        ..._.pick(initialState, ['error', 'isDeletingAccount', 'isLoggingIn']),
      }
    }

    case 'LOGIN_REQUEST':
      return {
        ...state,
        appToken: action.payload.appToken,
        error: null,
        isDeletingAccount: false,
        isLoggingIn: true,
        user: state.user,
      }

    case 'LOGIN_SUCCESS':
      return {
        appToken: action.payload.appToken || state.appToken,
        error: null,
        isDeletingAccount: false,
        isLoggingIn: false,
        user: action.payload.user && {
          _id: action.payload.user._id,
          plan: action.payload.user.plan,
          lastLoginAt:
            action.payload.user.lastLoginAt || new Date().toISOString(),
          createdAt: action.payload.user.createdAt,
          updatedAt: action.payload.user.updatedAt,
        },
      }

    case 'LOGIN_FAILURE':
      return {
        ...initialState,
        error: action.error,
      }

    case 'UPDATE_USER_DATA':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        } as State['user'],
      }

    case 'DELETE_ACCOUNT_REQUEST':
      return {
        ...state,
        isDeletingAccount: true,
      }

    case 'DELETE_ACCOUNT_SUCCESS':
      return {
        ...state,
        isDeletingAccount: false,
      }

    case 'DELETE_ACCOUNT_FAILURE':
      return {
        ...state,
        isDeletingAccount: false,
      }

    default:
      return state
  }
}
