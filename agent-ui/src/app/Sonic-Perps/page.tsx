import "@orderly.network/ui/dist/styles.css";

import React, { FC, ReactNode } from "react";
import { OrderlyAppProvider } from "@orderly.network/react-app";

const App: FC<{ children: ReactNode }> = (props) => {
  return (
    <OrderlyAppProvider brokerId="orderly" brokerName="Orderly" networkId="testnet" appIcons={""}>
      {props.children}
    </OrderlyAppProvider>
  );
};