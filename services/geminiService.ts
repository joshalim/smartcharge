
import { GoogleGenAI, Type } from "@google/genai";
import { Charger, OCPPLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIInsights = async (chargers: Charger[], logs: OCPPLog[]) => {
  const prompt = `
    As an expert EV Network Operations Center (NOC) engineer, analyze the current state of my charging network and provide actionable insights.
    
    Current Chargers:
    ${JSON.stringify(chargers, null, 2)}
    
    Recent OCPP Logs:
    ${JSON.stringify(logs, null, 2)}
    
    Analyze for:
    1. Charger health (identify patterns in faults).
    2. Energy utilization trends.
    3. Maintenance recommendations.
    4. Immediate critical issues.
    
    Return the response as a clear, professional summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Failed to generate AI insights. Please check your network connectivity or API key.";
  }
};

export const diagnoseError = async (chargerId: string, errorCode: string) => {
  const prompt = `Provide a step-by-step diagnostic and fix guide for an OCPP-compliant EV charger (ID: ${chargerId}) reporting error code: ${errorCode}. Be specific about OCPP message flows (Reset, ClearCache, etc.)`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Error generating diagnostic report.";
  }
};
