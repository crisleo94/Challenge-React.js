import { useEffect, useReducer, useRef } from 'react'
import { useDebounce } from './useDebounce'

export function useFetch(url, options) {
  const cache = useRef({})
  const cancelRequest = useRef(false)
  const initialState = {
    error: undefined,
    data: undefined
  }

  const fetchReducer = (state, action) => {
    switch (action.type) {
      case 'loading':
        return { ...initialState }
      case 'fetched':
        return { ...initialState, data: action.payload }
      case 'error':
        return { ...initialState, error: action.payload }
      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(fetchReducer, initialState)
  const debounceValue = useDebounce(state, 500)

  useEffect(() => {
    if (!url) return

    cancelRequest.current = false

    const fetchData = async () => {
      dispatch({ type: 'loading' })

      if (cache.current[url]) {
        dispatch({ type: 'fetched', payload: cache.current[url] })
        return
      }

      try {
        const response = await fetch(url, options)
        if (!response.ok) throw new Error(response.statusText)

        const data = await response.json()
        cache.current[url] = data
        if (cancelRequest.current) return

        dispatch({ type: 'fetched', payload: data })
      } catch (error) {
        if (cancelRequest.current) return

        dispatch({ type: 'error', payload: error.message })
      }
    }

    fetchData()

    return () => {
      cancelRequest.current = true
    }
  }, [debounceValue])

  return state
}