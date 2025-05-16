"use strict";

// netlify/functions/api-test.js
exports.handler = async (event, context) => {
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
    console.log("API test function called successfully");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "API test successful",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        requestPath: event.path,
        requestMethod: event.httpMethod
      })
    };
  } catch (error) {
    console.error("Error in api-test function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "An error occurred processing your request",
        message: error.message || "Unknown error"
      })
    };
  }
};
//# sourceMappingURL=api-test.js.map
