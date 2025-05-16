"use strict";

// netlify/functions/config.js
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }
  if (event.httpMethod === "GET") {
    try {
      const infuraApiKey = "ca485bd6567e4c5fb5693ee66a5885d8";
      const walletConnectProjectId = "6f23ad7f41333ccb23a5b2b6d330509a";
      console.log("Sending API configuration to client:", {
        infuraApiKey: infuraApiKey.substring(0, 5) + "...",
        walletConnectProjectId: walletConnectProjectId.substring(0, 5) + "..."
      });
      return {
        statusCode: 200,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          infuraApiKey,
          walletConnectProjectId
        })
      };
    } catch (error) {
      console.error("config.js error:", error);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Failed to retrieve API configuration",
          message: error.message || "Unknown error"
        })
      };
    }
  }
  return {
    statusCode: 405,
    headers: {
      ...headers,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ error: "Method not allowed" })
  };
};
//# sourceMappingURL=config.js.map
