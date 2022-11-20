require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("hardhat-deploy");

task("create-lottery", "Creates a lottery")
  .addParam("contract", "The contract address")
  .setAction(async (taskArgs) => {
    const contractAddr = taskArgs.contract;
    const LotteryContract = await ethers.getContractFactory("LotteryGame");
    const [deployer] = await ethers.getSigners();
    const lotteryContract = new ethers.Contract(
      contractAddr,
      LotteryContract.interface,
      deployer
    );
    const lotteryTx = await lotteryContract.createLottery();
    await lotteryTx.wait();
    console.log("Created Lottery");
  });

module.exports = {
  solidity: "0.8.17",
  // networks: {
  //   goerli: {
  //     url: "https://eth-goerli.g.alchemy.com/v2/yqMqS5G-VA3HJWcduj3n8k0Kn964qso_",
  //     accounts: [`0x${process.env.PRIVATE_KEY_OWNER}`],
  //   },
  // },
};
