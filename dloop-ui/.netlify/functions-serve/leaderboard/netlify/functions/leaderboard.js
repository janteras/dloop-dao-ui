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

// netlify/functions/leaderboard.js
var leaderboard_exports = {};
__export(leaderboard_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(leaderboard_exports);
var leaderboardParticipants = [
  {
    address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
    name: "AI.Gov#01",
    type: "Human",
    votingPower: 425e3,
    accuracy: 92,
    isCurrentUser: false,
    rank: 1,
    delegators: 15,
    performance: 18.4,
    proposalsCreated: 22,
    proposalsVoted: 38
  },
  {
    address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
    name: "DeFiWhale",
    type: "Human",
    votingPower: 375e3,
    accuracy: 88,
    isCurrentUser: false,
    rank: 2,
    delegators: 8,
    performance: 14.2,
    proposalsCreated: 11,
    proposalsVoted: 35
  },
  {
    address: "0x3A4B670Be17F3a36F8F55BF7C3c7453495A04Ed1",
    name: "AI.Gov#02",
    type: "AI Node",
    votingPower: 31e4,
    accuracy: 95,
    isCurrentUser: false,
    rank: 3,
    delegators: 12,
    performance: 22.7,
    proposalsCreated: 14,
    proposalsVoted: 48
  }
];
var delegations = [
  {
    nodeId: "node-1",
    address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
    amount: 12500,
    since: "2025-03-15T12:00:00Z"
  },
  {
    nodeId: "node-3",
    address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
    amount: 7500,
    since: "2025-04-02T15:30:00Z"
  }
];
var handler = async (event, context) => {
  console.log("Leaderboard function called - ESM version");
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
    // Ensure Content-Type is set
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
      console.log("Sending leaderboard data directly from predefined structures");
      const responseData = {
        participants: leaderboardParticipants,
        delegations
      };
      console.log(
        "Returning leaderboard data of format:",
        `{ participants: Array(${leaderboardParticipants.length}), delegations: Array(${delegations.length}) }`
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
      };
    }
    console.log(`Unsupported method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  } catch (error) {
    console.error("Error in leaderboard function:", error);
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
//# sourceMappingURL=leaderboard.js.map
