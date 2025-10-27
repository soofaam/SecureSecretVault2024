import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployed = await deploy("KeepSecret", {
    from: deployer,
    log: true,
  });

  log(`KeepSecret contract: ${deployed.address}`);
};

export default func;
func.id = "deploy_keepsecret"; // id required to prevent reexecution
func.tags = ["KeepSecret"];

