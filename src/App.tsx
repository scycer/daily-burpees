import { Component, createSignal, createEffect } from 'solid-js'
import styles from './App.module.css'

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import {
  GoogleAuthProvider,
  signInWithRedirect,
  signOut,
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
const TEST_MODE = false
// ####################################################

const collectionName = TEST_MODE ? 'burpees-test' : 'burpees'

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

enum AuthState {
  CHECKING,
  LOGGED_IN,
  LOGGED_OUT
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
  // User
  const [authState, setAuthState] = createSignal<AuthState>(AuthState.CHECKING)

  // Add Burpees Stat
  const defaultCount = 10
  const [count, setCount] = createSignal(defaultCount)
  const [addBurpeeState, setAddBurpeeState] = createSignal(APIState.IDLE)
  const [addBurpeeError, setAddBurpeeError] = createSignal<Error | undefined>(
    undefined
  )

  // Get Burpees State
  const [burpees, setBurpees] = createSignal<BurpeeRecord[]>([])
  const [getBurpeesState, setGetBurpeesState] = createSignal(APIState.IDLE)
  const [getBurpeesError, setGetBurpeesError] = createSignal<Error | undefined>(
    undefined
  )

  // Clear success state after 2 seconds
  createEffect(() => {
    if (addBurpeeState() === APIState.SUCCESS) {
      setTimeout(() => {
        setAddBurpeeState(APIState.IDLE)
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

  // Add Burpees
  const addBurpeeRecord = () => {
    setAddBurpeeState(APIState.LOADING)
    addBurpeeRecordDB(count())
      .then(() => {
        setAddBurpeeState(APIState.SUCCESS)
        setCount(defaultCount)
        getBurpees()
      })
      .catch(err => {
        console.log(err)
        setAddBurpeeState(APIState.ERROR)
        setAddBurpeeError(err)
      })
  }

  // Handle Auth State
  createEffect(() => {
    getRedirectResult(auth)
    onAuthStateChanged(auth, user => {
      if (!user) {
        setAuthState(AuthState.LOGGED_OUT)
      } else {
        setAuthState(AuthState.LOGGED_IN)
      }
    })
  }, [])

  return (
    <div class={styles.App}>
      <div>
        <h1>Daily Burpees</h1>
        <div>
          Signed In: {}
          <button
            onClick={() => {
              signOut(auth)
            }}
          >
            Sign Out
          </button>
        </div>
        <div>Auth State: {authState}</div>

        {authState() === AuthState.LOGGED_OUT && (
          <div>
            <button
              onClick={() => {
                signInWithRedirect(auth, provider)
              }}
            >
              Login
            </button>
          </div>
        )}

        {authState() === AuthState.LOGGED_IN && (
          <div>
            <div>
              {/* Burpee Count UI */}
              How many burpees?
              <div style={{ display: 'flex', padding: '16px' }}>
                <button onClick={() => setCount(prev => prev - 5)}> -5 </button>
                <p style={{ display: 'flex', padding: '16px' }}>{count}</p>
                <button onClick={() => setCount(prev => prev + 5)}> +5 </button>
              </div>
              {/* Save */}
              {(addBurpeeState() === APIState.IDLE ||
                addBurpeeState() === APIState.ERROR) && (
                <div>
                  <button onClick={e => addBurpeeRecord()}>Save</button>
                </div>
              )}
              {addBurpeeState() === APIState.LOADING && <p>Saving...</p>}
              {addBurpeeState() === APIState.SUCCESS && <p>Saved!</p>}
              {addBurpeeState() === APIState.ERROR && (
                <p>Error: {addBurpeeError()?.message}</p>
              )}
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
        )}
      </div>
    </div>
  )
}

export default App
