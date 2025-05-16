"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/protocol-metrics.js
var protocol_metrics_exports = {};
__export(protocol_metrics_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(protocol_metrics_exports);
var protocolMetrics = {
  // Enhanced metrics with additional fields for frontend display
  tvl: 1245e4,
  // Total value locked in USD
  tvlChange: 8.7,
  // Percent change in TVL
  dloopPrice: 2.76,
  // DLOOP token price in USD
  dloopPriceChange: 3.2,
  // Percent change in DLOOP price
  d_ai_price: 1.01,
  // D-AI token price in USD
  totalProtocolValue: 4589e4,
  // Total protocol value in USD
  d_ai_supply: 4588e4,
  // Total D-AI token supply
  dloop_supply: 1e7,
  // Total DLOOP token supply
  dloop_circulating: 325e4,
  // Circulating supply of DLOOP tokens
  proposal_count: 42,
  // Number of proposals created
  active_nodes: 18,
  // Number of active AI nodes
  treasuryBalance: 525e4,
  // Treasury balance in USD
  stakingApy: 12.4,
  // Annual percentage yield for staking
  tradingVolume24h: 876500,
  // 24-hour trading volume in USD
  userCount: 8750
  // Total number of users
};
var handler = async (event, context) => {
  console.log("Protocol metrics function called - ESM version");
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
    // Always set Content-Type for all responses
  };
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers,
        body: ""
      };
    }
    if (event.httpMethod === "GET") {
      console.log("Returning protocol metrics data");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(protocolMetrics)
      };
    }
    console.log(`Unsupported method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  } catch (error) {
    console.error("Error in protocol-metrics function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "An error occurred processing your request",
        message: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : void 0
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=protocol-metrics.js.map
