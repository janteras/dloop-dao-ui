"use strict";

// netlify/functions/test-function.js
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      message: "Test function working successfully",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    })
  };
};
//# sourceMappingURL=test-function.js.map
