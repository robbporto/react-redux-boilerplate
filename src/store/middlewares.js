import { once } from 'lodash'

import axiosInstance from '../utils/http'
import { SIGN_IN_SUCCESSFUL } from '../store/auth/constants'
import { logout } from '../store/auth/actions'

const clearUserOnAuthErrors = once((next) => {
  axiosInstance.interceptors.response.use(
    response => response,
    /**
    * This is a central point to handle all
    * error messages generated by HTTP
    * requests
    */
    (error) => {
      const { response } = error
      /**
      * If token is either expired, not provided or invalid
      * then redirect to login. On server side the error
      * messages can be changed on app/Providers/EventServiceProvider.php
      */
      const isUnauthorizedError = [401, 400].indexOf(response.status) > -1
      const isAuthEndpoint = error.config.url.includes('auth')

      if (isUnauthorizedError && !isAuthEndpoint) next(logout())

      return Promise.reject(error)
    }
  )
})

export const onAuthErrors = store => next => action => {
  clearUserOnAuthErrors(next)
  next(action)
}

/**
 * This set the token on two moments: On localStorage rehydrate
 * and on user sign in.
 * TODO: Set the token on signup too
 */
export const addTokenToRequest = store => next => action => {
  const isStorageRehydrate = action.type === 'persist/REHYDRATE'
  const isUserSignedIn = action.type === SIGN_IN_SUCCESSFUL

  if (isStorageRehydrate && action.payload) {
    axiosInstance.defaults.headers.common['X-TOKEN'] = action.payload.auth.user.token
  }

  if (isUserSignedIn && action.payload) {
    axiosInstance.defaults.headers.common['X-TOKEN'] = action.payload.token
  }

  next(action)
}
