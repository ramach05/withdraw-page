"use client";

import React from "react";
import Link from "next/link";
import { WithdrawForm } from "@/components/WithdrawForm";
import styles from "./page.module.css";

/** Страница вывода. */
const WithdrawPage = () => (
  <main>
    <nav className={styles.nav}>
      <Link href="/">На главную</Link>
    </nav>
    <WithdrawForm />
  </main>
);

export default React.memo(WithdrawPage);
