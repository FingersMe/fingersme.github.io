// Regenerate frontend/src/abi/index.ts from compiled artifacts, keeping all ABIs in sync.
const fs = require("fs");
const path = require("path");

const MAP = {
  FingersMeABI: "FingersMe",
  FingersTokenABI: "FingersToken",
  FingersWinnerNFTABI: "FingersWinnerNFT",
  FingersLoserNFTABI: "FingersLoserNFT",
  FingersNFTStakingABI: "FingersNFTStaking",
  FingersClaimABI: "FingersClaim",
  FingersStakingABI: "FingersStaking",
  FingersZapABI: "FingersZap",
  FingersHookABI: "FingersHook",
  FingersLPMigratorABI: "FingersLPMigrator",
};

const root = path.join(__dirname, "..");
const out = path.join(root, "..", "frontend", "src", "abi", "index.ts");

let lines = ["// Auto-generated contract ABIs (from hardhat artifacts). Do not edit by hand. Run: npx hardhat run scripts/gen-abis.js"];
for (const [exportName, contract] of Object.entries(MAP)) {
  const artifact = path.join(root, "artifacts", "src", `${contract}.sol`, `${contract}.json`);
  if (!fs.existsSync(artifact)) { console.warn(`skip ${contract} (no artifact)`); continue; }
  const { abi } = JSON.parse(fs.readFileSync(artifact, "utf8"));
  lines.push(`export const ${exportName} = ${JSON.stringify(abi)} as const;`);
}
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`Wrote ${out} (${Object.keys(MAP).length} ABIs)`);
