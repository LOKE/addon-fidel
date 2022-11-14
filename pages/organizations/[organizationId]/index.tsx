import {
  Button,
  Dropdown,
  TextField,
  Stack,
  Inline,
  Box,
} from "@loke/design-system";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "../../../components/fetcher";
import { Footer } from "../../../components/Footer";
import styles from "../../../styles/Main.module.css";

interface Organization {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  created: string;
  installed: boolean;
  activated: boolean;
  brand?: Brand;
}

interface Transaction {
  transactionId: string;
  locationId: string;
  cardId: string;
  brandId: string;
  programId: string;
  lokeOrganizationId: string;
  lokeCustomerId: string;
  pointsAwarded: number;
  amount: number;
  createdAt: string;
  currency: string;
}
interface Config {
  orgId: string;
  pointsForDollarSpent: number;
}

interface Brand {
  id: string;
  name: string;
  websiteURL: string | null;
}

const OrganizationPage: NextPage = () => {
  const router = useRouter();
  const [config, setConfig] = useState<Omit<Config, "orgId">>({
    pointsForDollarSpent: 1,
  });

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const { data: org, mutate: orgDataMutate } = useSWR<Organization>(
    router.query.organizationId
      ? "/api/organizations/" + router.query.organizationId
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const {
    data: serverConfig,
    isValidating: configIsValidating,
    mutate: configMutate,
  } = useSWR<Config>(
    router.query.organizationId
      ? "/api/organizations/" + router.query.organizationId + "/config"
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: brandsList, isValidating: brandsListValidating } = useSWR(
    "/api/fidel/brands",
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: transactions, isValidating: transactionsValidating } = useSWR(
    router.query.organizationId
      ? "/api/transactions/" + router.query.organizationId
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const saveConfig = async () => {
    await fetch(
      "/api/organizations/" + router.query.organizationId + "/config",
      {
        method: "put",
        body: JSON.stringify(config),
        headers: { "Content-Type": "application/json" },
      }
    );
    configMutate();
  };

  const linkBrand = async () => {
    if (!selectedBrand || !router.query.organizationId) return;

    await fetch(
      "/api/fidel/org/" + router.query.organizationId + "/" + selectedBrand.id,
      {
        method: "put",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBrand.id,
          name: selectedBrand.name,
          websiteURL: selectedBrand.websiteURL,
        }),
      }
    );

    orgDataMutate();
  };

  const onBrandSelect = (id: string) => {
    if (!brandsList || brandsList.length === 0) return;

    const selected = brandsList.find((brand: Brand) => brand.id === id);
    setSelectedBrand(selected);
  };

  useEffect(() => {
    if (serverConfig) setConfig(serverConfig);
  }, [serverConfig]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Organization</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>{org ? org.name : "Organization"}</h1>

        <Stack space="large">
          <Box>
            <h2>Org Details:</h2>
            {org && (
              <dl>
                <p>
                  <strong>Timezone: </strong>
                  {org.timezone}
                </p>
                <p>
                  <strong>Currency: </strong>
                  {org.currency}
                </p>
                <p>
                  <strong>Installed: </strong>
                  {org.installed ? "Yes ✅" : "No"}
                </p>
                <p>
                  <strong>Activated: </strong>
                  {org.activated ? "Yes ✅" : "To activate link it to a brand"}
                </p>
                {org.brand && (
                  <>
                    <p>
                      <strong>Brand name: </strong>
                      {org.brand.name}
                    </p>
                    <p>
                      <strong>Brand ID: </strong>
                      {org.brand.id}
                    </p>
                  </>
                )}
              </dl>
            )}
          </Box>
          <Inline space="small">
            {!org?.activated && (
              <Box>
                <h2>Link to Fidel Brand</h2>
                <Stack space="small">
                  {brandsList && (
                    <Dropdown
                      id="brandsList"
                      label="Brands List"
                      value={selectedBrand?.id || ""}
                      onChange={(e) => {
                        onBrandSelect((e.target as any).value);
                      }}
                    >
                      {[
                        { id: "", name: "No list selected" },
                        ...(brandsList || []),
                      ].map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </Dropdown>
                  )}
                  <Button
                    onClick={linkBrand}
                    variant={selectedBrand ? "solid" : "ghost"}
                    loading={brandsListValidating}
                  >
                    Link
                  </Button>
                </Stack>
              </Box>
            )}
            <Box>
              <h2>Points/Dollar Config</h2>
              <Stack space="small">
                <TextField
                  id="pointsForDollarSpent"
                  label="Points/Dollar spent"
                  placeholder="1"
                  value={config.pointsForDollarSpent || 1}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      pointsForDollarSpent: parseInt((e.target as any).value),
                    });
                  }}
                />
                <Button onClick={saveConfig} variant="solid">
                  Save Config
                </Button>
              </Stack>
            </Box>
          </Inline>
          {transactions && transactions.length !== 0 && (
            <>
              <h2>Transactions</h2>
              <table className={styles.table}>
                <tr>
                  <th className={styles.th}>ID(Fidel)</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th}>Points awarded</th>
                  <th className={styles.th}>Location ID(Fidel)</th>
                  <th className={styles.th}>Card ID(Fidel)</th>
                  <th className={styles.th}>Customer ID(Loke)</th>
                  <th className={styles.th}>Created At</th>
                </tr>
                {transactions.map((transaction: Transaction) => {
                  return (
                    <tr key={transaction.transactionId}>
                      <td className={styles.td}>{transaction.transactionId}</td>
                      <td className={styles.td}>{transaction.amount}</td>
                      <td className={styles.td}>{transaction.pointsAwarded}</td>
                      <td className={styles.td}>{transaction.locationId}</td>
                      <td className={styles.td}>{transaction.cardId}</td>
                      <td className={styles.td}>
                        {transaction.lokeCustomerId}
                      </td>
                      <td className={styles.td}>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </table>
            </>
          )}
        </Stack>
      </main>

      <Footer />
    </div>
  );
};

export default OrganizationPage;
