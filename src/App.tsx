import { Component, createSignal } from 'solid-js'
import styles from './App.module.css'

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDk4Q2tqLWskdKH_Zi9XSjL8bOS0z0SEJ8',
  authDomain: 'daily-burpees.firebaseapp.com',
  projectId: 'daily-burpees',
  storageBucket: 'daily-burpees.appspot.com',
  messagingSenderId: '49413011219',
  appId: '1:49413011219:web:856723f3a0d55e00820ce6',
  measurementId: 'G-FHSDMXMH8Y'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app)

const addBurpeeRecordDB = async (count: number) => {
  const docRef = await addDoc(collection(db, 'burpees'), {
    count: count,
    date: new Date()
  })
}

enum APIState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}

const App: Component = () => {
  const defaultCount = 10
  const [count, setCount] = createSignal(defaultCount)
  const [saveState, setSaveState] = createSignal(APIState.IDLE)
  const [error, setError] = createSignal('')

  const addBurpeeRecord = () => {
    setSaveState(APIState.LOADING)
    addBurpeeRecordDB(count())
      .then(() => {
        setSaveState(APIState.SUCCESS)
        setCount(defaultCount)
      })
      .catch(() => {
        setSaveState(APIState.ERROR)
      })
  }

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>Daily Burpees</h1>
        {/* Burpee Count UI */}
        How many burpees?
        <div style={{ display: 'flex', padding: '16px' }}>
          <button onClick={() => setCount(prev => prev - 5)}> -5 </button>
          <p style={{ display: 'flex', padding: '16px' }}>{count}</p>
          <button onClick={() => setCount(prev => prev + 5)}> +5 </button>
        </div>
        <div>
          <button onClick={e => addBurpeeRecord()}>Save</button>
        </div>
        {/* Saving States */}
        {saveState() === APIState.LOADING && <p>Saving...</p>}
        {saveState() === APIState.SUCCESS && <p>Saved!</p>}
        {saveState() === APIState.ERROR && <p>Error: {error()}</p>}
      </header>
    </div>
  )
}

export default App
