import { Component, createSignal, createEffect } from 'solid-js'
import styles from './App.module.css'

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getAuth,
  getRedirectResult,
  onAuthStateChanged
} from 'firebase/auth'

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

// Firebase Auth
const provider = new GoogleAuthProvider()
const auth = getAuth()

type BurpeeRecord = {
  id?: string
  count: number
  date: Date
}

// ####################################################
const MOCK_MODE = false
// ####################################################

const collectionName = MOCK_MODE ? 'burpees-test' : 'burpees'

const burpeesCollection = collection(db, collectionName).withConverter({
  toFirestore: (burpee: BurpeeRecord) => burpee,
  fromFirestore: (snapshot: any, options: any): BurpeeRecord => {
    const data: any = snapshot.data(options)
    var d = new Date(0) // 0 sets the date to the epoch
    d.setUTCSeconds(data.date.seconds)
    return {
      id: snapshot.id,
      date: d,
      count: data.count
    }
  }
})

// Add a new document for a burpee session
const addBurpeeRecordDB = async (count: number, date?: Date) => {
  return await addDoc(collection(db, collectionName), {
    count: count,
    date: date || new Date()
  })
}

const getListOfBurpees = async () => {
  return await getDocs(burpeesCollection)
}

enum APIState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}

// group BurpeeRecords by day date in an array, each day has the count of burpees and original counts
const groupBurpeesByDay = (
  burpees: BurpeeRecord[]
): { day: string; sum: number; burpees: BurpeeRecord[] }[] => {
  const groupedBurpees: {
    day: string
    sum: number
    burpees: BurpeeRecord[]
  }[] = []
  burpees.forEach(burpee => {
    const day = burpee.date.toLocaleDateString()
    const dayIndex = groupedBurpees.findIndex(gb => gb.day === day)
    if (dayIndex === -1) {
      groupedBurpees.push({ day: day, sum: burpee.count, burpees: [burpee] })
    } else {
      groupedBurpees[dayIndex].sum += burpee.count
      groupedBurpees[dayIndex].burpees.push(burpee)
    }
  })
  return groupedBurpees
}

const App: Component = () => {
  // Add Burpees Stat
  const defaultCount = 10
  const [count, setCount] = createSignal(defaultCount)
  const [saveState, setSaveState] = createSignal(APIState.IDLE)
  const [error, setError] = createSignal('')

  // Get Burpees State
  const [burpees, setBurpees] = createSignal<BurpeeRecord[]>([])
  const [getBurpeesState, setGetBurpeesState] = createSignal(APIState.IDLE)
  const [getBurpeesError, setGetBurpeesError] = createSignal('')

  // Clear success state after 2 seconds
  createEffect(() => {
    if (saveState() === APIState.SUCCESS) {
      setTimeout(() => {
        setSaveState(APIState.IDLE)
      }, 2000)
    }
  })

  // Get Burpees
  const getBurpees = () => {
    setGetBurpeesState(APIState.LOADING)
    getListOfBurpees()
      .then(querySnapshot => {
        setBurpees(() =>
          querySnapshot.docs
            // get the data from the document
            .map(doc => doc.data())
            // Sort by date descending
            .sort((a, b) => b.date.getTime() - a.date.getTime())
        )
        setGetBurpeesState(APIState.SUCCESS)
      })
      .catch(error => {
        setGetBurpeesState(APIState.ERROR)
        setGetBurpeesError(error)
      })
  }

  // Get Burpees on load
  createEffect(() => {
    getBurpees()
  }, [])

  const addBurpeeRecord = () => {
    setSaveState(APIState.LOADING)
    addBurpeeRecordDB(count())
      .then(() => {
        setSaveState(APIState.SUCCESS)
        setCount(defaultCount)
        getBurpees()
      })
      .catch(() => {
        setSaveState(APIState.ERROR)
      })
  }

  createEffect(() => {
    onAuthStateChanged(auth, user => {
      if (!user) {
        signInWithRedirect(auth, provider)
      }
    })
  }, [])

  return (
    <div class={styles.App}>
      <div>
        <h1>Daily Burpees</h1>
        <div>Signed In: {auth.currentUser?.displayName}</div>
        {/* Burpee Count UI */}
        How many burpees?
        <div style={{ display: 'flex', padding: '16px' }}>
          <button onClick={() => setCount(prev => prev - 5)}> -5 </button>
          <p style={{ display: 'flex', padding: '16px' }}>{count}</p>
          <button onClick={() => setCount(prev => prev + 5)}> +5 </button>
        </div>
        {/* Save */}
        {(saveState() === APIState.IDLE || saveState() === APIState.ERROR) && (
          <div>
            <button onClick={e => addBurpeeRecord()}>Save</button>
          </div>
        )}
        {saveState() === APIState.LOADING && <p>Saving...</p>}
        {saveState() === APIState.SUCCESS && <p>Saved!</p>}
        {saveState() === APIState.ERROR && <p>Error: {error()}</p>}
      </div>
      <div>
        {/* List of Burpees */}
        <h2>History</h2>
        {getBurpeesState() === APIState.LOADING && <p>Loading...</p>}
        {getBurpeesState() === APIState.SUCCESS && (
          <div>
            {groupBurpeesByDay(burpees()).map((burpeeGroup, index) => (
              <div>
                <h3>{burpeeGroup.day}</h3>
                <p>Total: {burpeeGroup.sum}</p>
                <ul>
                  {burpeeGroup.burpees.map((burpee, index) => (
                    <span>{burpee.count},</span>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          // Boring table
          // <div>
          //   <ul>
          //     {burpees().map(burpee => (
          //       <li>
          //         {burpee.count} on {burpee.date.toLocaleString()}
          //       </li>
          //     ))}
          //   </ul>
          // </div>
        )}
        {getBurpeesState() === APIState.ERROR && (
          <p>Error: {getBurpeesError()}</p>
        )}
      </div>
    </div>
  )
}

export default App
