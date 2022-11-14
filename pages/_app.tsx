import "@loke/design-system/lib/css/reset";
import { BraidProvider } from "@loke/design-system";
import { fresh } from "@loke/design-system/lib/themes";
import { AppProps } from "next/app";
import "../styles/globals.css";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <BraidProvider theme={fresh}>
      <Component {...pageProps} />{" "}
    </BraidProvider>
  );
};

export default App;
