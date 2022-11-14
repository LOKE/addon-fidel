import { Loader } from "@loke/design-system";
import useSWR from "swr";
import styles from "../styles/Footer.module.css";
import { fetcher } from "./fetcher";

export const Footer = () => {
  const { data: me } = useSWR("/api/me", fetcher);
  return (
    <footer className={styles.footer}>
      &copy; LOKE
      {me ? (
        <>
          {"  |  "}
          <small>Logged in as {me.sub}</small>
        </>
      ) : (
        <Loader />
      )}
    </footer>
  );
};
