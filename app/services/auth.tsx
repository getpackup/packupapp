import { firebaseAuth } from '~/firebase/config'

export const isAuth = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(!!user)
    })
  })
}
