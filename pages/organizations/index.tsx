import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Table } from "reactstrap";
import useSWR from "swr";
import { ButtonLink, Inline, Loader } from "@loke/design-system";
import { fetcher } from "../../components/fetcher";
import { Footer } from "../../components/Footer";
import styles from "../../styles/Main.module.css";
import * as config from "../../src/environment/config";

interface Organization {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  installed: boolean;
  activated: boolean;
}

interface Props {
  installUrl: string;
}

export const getServerSideProps: GetServerSideProps = async () => {
  const installUrl =
    config.lokeIssuerUrl + "install-client?client=" + config.lokeClientId;

  return {
    props: { installUrl },
  };
};

const OrganizationsPage: NextPage<Props> = (props) => {
  const { data: orgs, isValidating } = useSWR<Organization[]>(
    "/api/organizations",
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>Organizations</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Organizations</h1>

        <div className={styles.stack}>
          <Inline space="small" collapseBelow="desktop" align="center">
            <ButtonLink href={props.installUrl}>Install</ButtonLink>
          </Inline>
          <br />
          {isValidating && (
            <Inline space="small" collapseBelow="desktop" align="center">
              <Loader />
            </Inline>
          )}
          <br />

          {orgs && orgs.length !== 0 && (
            <Table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Currency</th>
                  <th scope="col">Time zone</th>
                  <th scope="col">Installed</th>
                  <th scope="col">Activated</th>
                </tr>
              </thead>
              <tbody>
                {orgs
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .sort((a, b) => {
                    if (
                      (!a.installed && !b.installed) ||
                      (a.installed && b.installed)
                    ) {
                      return 0;
                    }

                    if (a.installed) return -1;
                    if (b.installed) return 1;
                    return 0;
                  })
                  .map((o) => (
                    <tr key={o.id}>
                      <td scope="row" align="center">
                        {o.installed ? (
                          <div data-tooltip="To configure points per dollar ratio and link a brand.">
                            <Link href={"/organizations/" + o.id}>
                              <a>{o.name}</a>
                            </Link>
                          </div>
                        ) : (
                          o.name
                        )}
                      </td>
                      <td align="center">{o.currency}</td>
                      <td align="center">{o.timezone}</td>
                      <td align="center">{o.installed ? "✅" : ""}</td>
                      {o.activated ? (
                        <td align="center"> ✅</td>
                      ) : (
                        <td align="center">
                          <Link href={"/organizations/" + o.id}>
                            <a>Activate</a>
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </Table>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrganizationsPage;
