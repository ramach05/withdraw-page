import React from "react";
import Link from "next/link";
import styles from "./page.module.css";

/** Главная страница. */
const HomePage = () => (
  <main>
    <div className={styles.hero}>
      <h1 className={styles.title}>Withdraw</h1>
      <p className={styles.subtitle}>Вывод средств на карту или счёт</p>
      <Link href="/withdraw" className={styles.cta}>
        Перейти к форме вывода средств
      </Link>
    </div>
  </main>
);

export default React.memo(HomePage);
