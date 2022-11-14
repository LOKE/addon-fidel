import type { NextPageContext } from "next";
import Head from "next/head";
import Script from "next/script";
import styles from "../../../../styles/Main.module.css";

const CustomerPage = ({
  organizationId,
  customerId,
}: {
  organizationId: string;
  customerId: string;
}) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Link your card</title>
        <meta name="description" content="Secure card linking process" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script
        type="text/javascript"
        src="https://resources.fidel.uk/sdk/js/v3/fidel.js"
        data-id="fidel-sdk"
      />
      <main className={styles.main}>
        <i>
          Linking card to Fidel is a secure process and you can earn points by
          using your card at participating merchants!
        </i>
        <div className={styles.grid}>
          <button
            onClick={() => {
              Fidel.openForm({
                companyName: "Fidel",
                sdkKey: process.env.NEXT_PUBLIC_FIDEL_SDK_KEY ?? "",
                programId: process.env.NEXT_PUBLIC_FIDEL_PROGRAM_ID ?? "",
                metadata: {
                  customerId: customerId,
                  organizationId: organizationId,
                },
                onCardEnrolledCallback() {
                  console.log("onCardEnrolledCallback called");
                  console.log(arguments);
                },
                onCardEnrollFailedCallback() {
                  console.log("onCardEnrollFailedCallback called");
                  console.log(arguments);
                },
                onCardVerifiedCallback() {
                  console.log("onCardVerifiedCallback called");
                  console.log(arguments);
                },
                onCardVerifyFailedCallback() {
                  console.log("onCardVerifyFailedCallback called");
                  console.log(arguments);
                },
              });
            }}
          >
            Add Card
          </button>
        </div>
      </main>
    </div>
  );
};

CustomerPage.getInitialProps = (ctx: NextPageContext) => {
  return {
    organizationId: ctx.query.organizationId as string,
    customerId: ctx.query.customerId as string,
  };
};

export default CustomerPage;
