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

// netlify/functions/test-api.js
var test_api_exports = {};
__export(test_api_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(test_api_exports);
var handler = async (event, context) => {
  console.log("API Test function called - checking all endpoints");
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };
  try {
    const results = {};
    try {
      console.log("Testing leaderboard endpoint...");
      const leaderboardUrl = "http://localhost:9000/.netlify/functions/leaderboard";
      const leaderboardResponse = await fetch(leaderboardUrl);
      if (!leaderboardResponse.ok) {
        results.leaderboard = {
          status: leaderboardResponse.status,
          error: `Failed with status: ${leaderboardResponse.status}`
        };
      } else {
        const data = await leaderboardResponse.json();
        results.leaderboard = {
          status: "success",
          dataStructure: {
            hasParticipants: Boolean(data.participants && Array.isArray(data.participants)),
            participantCount: data.participants ? data.participants.length : 0,
            hasDelegations: Boolean(data.delegations && Array.isArray(data.delegations)),
            delegationCount: data.delegations ? data.delegations.length : 0
          }
        };
      }
    } catch (error) {
      results.leaderboard = {
        status: "error",
        message: error.message
      };
    }
    try {
      console.log("Testing protocol-proposals endpoint...");
      const proposalsUrl = "http://localhost:9000/.netlify/functions/protocol-proposals";
      const proposalsResponse = await fetch(proposalsUrl);
      if (!proposalsResponse.ok) {
        results.protocolProposals = {
          status: proposalsResponse.status,
          error: `Failed with status: ${proposalsResponse.status}`
        };
      } else {
        const data = await proposalsResponse.json();
        results.protocolProposals = {
          status: "success",
          dataStructure: {
            isArray: Array.isArray(data),
            itemCount: Array.isArray(data) ? data.length : 0,
            firstItemFields: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []
          }
        };
      }
    } catch (error) {
      results.protocolProposals = {
        status: "error",
        message: error.message
      };
    }
    try {
      console.log("Testing protocol-metrics endpoint...");
      const metricsUrl = "http://localhost:9000/.netlify/functions/protocol-metrics";
      const metricsResponse = await fetch(metricsUrl);
      if (!metricsResponse.ok) {
        results.protocolMetrics = {
          status: metricsResponse.status,
          error: `Failed with status: ${metricsResponse.status}`
        };
      } else {
        const data = await metricsResponse.json();
        results.protocolMetrics = {
          status: "success",
          dataStructure: {
            isObject: typeof data === "object" && data !== null && !Array.isArray(data),
            fields: typeof data === "object" && data !== null ? Object.keys(data).sort() : []
          }
        };
      }
    } catch (error) {
      results.protocolMetrics = {
        status: "error",
        message: error.message
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "API Test Results",
        results,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (error) {
    console.error("Error in test-api function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "An error occurred during API testing",
        message: error.message
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=test-api.js.map
