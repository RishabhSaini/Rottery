import { useState, useContext, useEffect } from "react";
import Lottery from "./components/Lottery";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import TabPanel from "./components/TabPanel";
import { getEthereumContract } from "./context/ContractContext";
import { TransactionContext } from "./context/ContractContext";

function App() {
  const {
    connectWallet,
    connectedAccount,
    createLottery,
    infoLot,
    setInfoLot,
  } = useContext(TransactionContext);
  const [value, setValue] = useState(0);

  // useEffect(() => {
  //   (async () => {
  //     console.log("useeffect");
  //     const txContract = await getEthereumContract();
  //     txContract.once("LotteryCreated", eventLotteryCreatedSol);
  //   })();
  // }, [clickedCreate]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };

  function a11yProps(index) {
    return {
      id: `vertical-tab-${index}`,
      "aria-controls": `vertical-tabpanel-${index}`,
    };
  }

  return (
    <div className="App">
      <div>Current Account: {connectedAccount}</div>
      {!connectedAccount && (
        <button onClick={connectWallet}>Connect to Wallet</button>
      )}
      <button onClick={createLottery}>Create Lottery</button>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "background.paper",
          display: "flex",
          height: "100vh",
        }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: "divider" }}
        >
          {[...infoLot.keys()].map((k, index) => (
            <Tab label={"Lottery " + k} {...a11yProps(index)} />
          ))}
        </Tabs>
        {[...infoLot.keys()].map((k, index) => (
          <TabPanel value={value} index={index}>
            <Lottery
              index={k}
              prize={infoLot.get(k).prize}
              prevPrize={infoLot.get(k).prevPrize}
              winner={infoLot.get(k).winner}
              price={infoLot.get(k).price}
              lockedUntil={infoLot.get(k).lockedUntil}
            />
          </TabPanel>
        ))}
      </Box>
    </div>
  );
}

export default App;
