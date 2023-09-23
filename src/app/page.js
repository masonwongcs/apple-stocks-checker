import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <h3>Apple Store Stock Availability Checker</h3>
      <p>To consume the API, just provide the `partID` and `email` as parameters.</p>
      <code>
        /?partID=PART_ID&email=YOUR_EMAIL
      </code>
    </main>
  )
}
