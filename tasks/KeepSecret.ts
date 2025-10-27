import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";
import fs from "fs";
import path from "path";

task("keeps:address", "Prints the KeepSecret address").setAction(async (_args, hre) => {
  const d = await hre.deployments.get("KeepSecret");
  console.log("KeepSecret:", d.address);
});

task("keeps:store", "Store a new secret")
  .addParam("title", "Title for the secret")
  .addParam("data", "Ciphertext hex string (e.g. 0x...)")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, fhevm, ethers } = hre as any;
    const [signer] = await ethers.getSigners();
    await fhevm.initializeCLIApi();

    const d = await deployments.get("KeepSecret");
    const contract = await ethers.getContractAt("KeepSecret", d.address);

    // Generate a random address-shaped password
    const wallet = ethers.Wallet.createRandom();
    const passwordAddress = wallet.address;
    console.log("Password address:", passwordAddress);

    const enc = await fhevm
      .createEncryptedInput(d.address, signer.address)
      .addAddress(passwordAddress)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .storeSecret(args.title, args.data, enc.handles[0], enc.inputProof);
    console.log("tx:", tx.hash);
    await tx.wait();
    console.log("Stored secret.");
  });

task("keeps:list", "List secrets for an owner")
  .addParam("owner", "Owner address")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, ethers } = hre as any;
    const d = await deployments.get("KeepSecret");
    const contract = await ethers.getContractAt("KeepSecret", d.address);
    const ids: bigint[] = await contract.getSecretIdsByOwner(args.owner);
    console.log(`Secrets for ${args.owner}: ${ids.length}`);
    for (const id of ids) {
      const [owner, title, createdAt]: [string, string, bigint] = await contract.getSecretMeta(id);
      console.log(`#${id}: owner=${owner} title="${title}" time=${createdAt}`);
    }
  });

task("keeps:decrypt-pwd", "Decrypt password for a secret id")
  .addParam("id", "Secret id")
  .setAction(async (args: TaskArguments, hre) => {
    const { deployments, fhevm, ethers } = hre as any;
    await fhevm.initializeCLIApi();
    const [signer] = await ethers.getSigners();
    const d = await deployments.get("KeepSecret");
    const contract = await ethers.getContractAt("KeepSecret", d.address);
    const encPwd = await contract.getEncryptedPassword(args.id);
    const addr = await fhevm.userDecryptEaddress(
      FhevmType.eaddress,
      encPwd,
      d.address,
      signer,
    );
    console.log("Decrypted password address:", addr);
  });

task("keeps:export-frontend", "Export abi and address into ui/")
  .setAction(async (_args, hre) => {
    const network = hre.network.name;
    const deploymentDir = path.join(hre.config.paths.root, "deployments", network);
    const keepSecretPath = path.join(deploymentDir, "KeepSecret.json");
    const uiDir = path.join(hre.config.paths.root, "ui", "src");
    const abiOut = path.join(uiDir, "abi", "KeepSecretAbi.ts");
    const cfgOut = path.join(uiDir, "config.ts");

    const meta = JSON.parse(fs.readFileSync(keepSecretPath, "utf-8"));
    const abi = meta.abi;
    const address = meta.address as string;

    fs.mkdirSync(path.dirname(abiOut), { recursive: true });
    fs.mkdirSync(path.dirname(cfgOut), { recursive: true });

    const abiTs = `// auto-generated from deployments/${network}/KeepSecret.json\nexport const keepSecretAbi = ${JSON.stringify(abi, null, 2)} as const;\n`;
    fs.writeFileSync(abiOut, abiTs);

    const cfgTs = `// auto-generated from deployments/${network}/KeepSecret.json\nexport const KEEPSECRET_ADDRESS = "${address}";\nexport const CHAIN_ID = ${hre.network.config.chainId ?? 0};\nexport const RELAYER_URL = "https://relayer.testnet.zama.cloud";\n`;
    fs.writeFileSync(cfgOut, cfgTs);

    console.log("Exported:", abiOut);
    console.log("Exported:", cfgOut);
  });
