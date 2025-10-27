import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { KeepSecret } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("KeepSecretSepolia", function () {
  let signers: Signers;
  let c: KeepSecret;
  let addr: string;

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This test suite can only run on Sepolia`);
      this.skip();
    }
    const dep = await deployments.get("KeepSecret");
    addr = dep.address;
    c = await ethers.getContractAt("KeepSecret", addr);

    const [alice] = await ethers.getSigners();
    signers = { alice };
  });

  it("store and decrypt password on Sepolia", async function () {
    this.timeout(4 * 60000);

    const title = "hello sepolia";
    const data = ethers.randomBytes(24);

    const enc = await fhevm
      .createEncryptedInput(addr, signers.alice.address)
      .addAddress(ethers.Wallet.createRandom().address)
      .encrypt();

    const tx = await c.connect(signers.alice).storeSecret(title, data, enc.handles[0], enc.inputProof);
    await tx.wait();

    const ids = await c.getSecretIdsByOwner(signers.alice.address);
    expect(ids.length).to.be.greaterThan(0);

    const encPwd = await c.getEncryptedPassword(ids[ids.length - 1]);
    const clearAddr = await fhevm.userDecryptEaddress(FhevmType.eaddress, encPwd, addr, signers.alice);
    expect(clearAddr).to.match(/^0x[0-9a-fA-F]{40}$/);
  });
});

