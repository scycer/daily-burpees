import { Component, createSignal, createEffect } from 'solid-js'
import styles from './App.module.css'

import { initializeApp } from 'firebase/app'
import { getAnalytics, logEvent } from 'firebase/analytics'
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

import Burpees from './pages/Burpees'
import Header from './components/Header'
const firebaseConfig = {
  apiKey: 'AIzaSyDk4Q2tqLWskdKH_Zi9XSjL8bOS0z0SEJ8',
  authDomain: 'daily-burpees.firebaseapp.com',
  projectId: 'daily-burpees',
  storageBucket: 'daily-burpees.appspot.com',
  messagingSenderId: '49413011219',
  appId: '1:49413011219:web:856723f3a0d55e00820ce6',
  measurementId: 'G-FHSDMXMH8Y'
}
// ####################################################
// TEST_MODE
// ####################################################
const TEST_MODE = false

// ###############################
// Logger
// ###############################
const log = (topic: string, message: string) => {
  if (TEST_MODE) {
    console.log(`${topic}: ${message}`)
  } else {
    logEvent(getAnalytics(), topic, { message: message })
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app)

// Firebase Auth
const provider = new GoogleAuthProvider()
const auth = getAuth()

export type BurpeeRecord = {
  id?: string
  count: number
  date: Date
}

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
  log('addBurpeeRecordDB', `count: ${count}, date: ${date}`)
  return await addDoc(collection(db, collectionName), {
    count: count,
    date: date || new Date()
  })
}

const getListOfBurpees = async () => {
  log('getListOfBurpees', 'start')
  return await getDocs(burpeesCollection)
}

enum APIState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR
}

export enum AuthState {
  CHECKING,
  LOGGED_IN,
  LOGGED_OUT
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

  // On Load actions
  createEffect(() => {
    getBurpees()
  }, [])

  // Add Burpees
  const addBurpeeRecord = () => {
    setAddBurpeeState(APIState.LOADING)
    addBurpeeRecordDB(count(), new Date())
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
      {/* TEST_MODE */}
      {TEST_MODE && (
        <div class='absolute text-bold w-full text-center bg-red-500'>
          <h1>TEST MODE</h1>
        </div>
      )}
      <Header
        currentUserName={auth.currentUser?.displayName || ''}
        state={authState()}
        onLogin={() => signInWithRedirect(auth, provider)}
        onLogout={() => signOut(auth)}
      />
      <Burpees
        burpees={burpees()}
        count={count()}
        updateCount={setCount}
        addBurpeeRecord={addBurpeeRecord}
        goal={7849} // Price of my new bike Torque:ON 7
        endDate={new Date('9 Feb 2023')} // My Birthday
        dailyGoal={100}
      />
    </div>
  )
}

export default App
