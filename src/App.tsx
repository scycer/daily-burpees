import { Component } from 'solid-js'

import styles from './App.module.css'

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>Daily Burpees</h1>
      </header>
    </div>
  )
}

export default App
