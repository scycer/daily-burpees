import { Component } from 'solid-js'
import { AuthState } from '../App'

const Header: Component<{
  currentUserName: string
  state: AuthState
  onLogin: () => void
  onLogout: () => void
}> = ({ currentUserName, state, onLogin, onLogout }) => {
  return (
    <div class='bg-[#14204A] shadow'>
      <div class='max-w-xl flex justify-between items-center mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Title */}
        <h1 class='text-3xl font-bold'>Daily Burpees</h1>
        {/* Current User's Name */}
        <div class='flex gap-4'>
          <h1 class='m-auto font-bold'>{currentUserName}</h1>
          {/* Login / Logout */}
          <button
            class='bg-[#3B94CB] text-white px-4 py-2 rounded-md shadow-sm hover:bg-[#2A669F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9CD7E5]'
            onClick={() => {
              if (state === AuthState.LOGGED_IN) {
                onLogout()
              } else {
                onLogin()
              }
            }}
          >
            {state === AuthState.LOGGED_IN ? 'Logout' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header
