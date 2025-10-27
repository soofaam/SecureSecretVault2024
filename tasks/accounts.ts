import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(`${account.address}`);
  }
});

task("print:env", "Prints whether PRIVATE_KEY is set").setAction(async (_args, _hre) => {
  console.log("PRIVATE_KEY set:", !!process.env.PRIVATE_KEY, process.env.PRIVATE_KEY?.startsWith("0x"));
});

task("print:cfg", "Prints sepolia accounts config").setAction(async (_args, hre) => {
  console.log("network:", hre.network.name);
  console.log("accounts cfg:", hre.network.config.accounts);
});
