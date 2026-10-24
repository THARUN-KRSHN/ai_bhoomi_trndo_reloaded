"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  BusinessRequest,
  DemoOpportunity,
  StrategyReport,
  Objective,
} from "@/lib/api/types";
import { DEMO_OPPORTUNITIES, createOpportunityFromTrend } from "@/lib/demo/opportunities";

interface StrategyContextType {
  selectedOpportunity: DemoOpportunity;
  selectOpportunity: (opp: DemoOpportunity) => void;
  selectOpportunityFromTrend: (keyword: string, score?: number, category?: string, city?: string) => void;
  brief: BusinessRequest;
  updateBrief: (partial: Partial<BusinessRequest>) => void;
  currentReport: StrategyReport | null;
  setCurrentReport: (report: StrategyReport | null) => void;
  reportHistory: Record<string, StrategyReport>;
  saveReportToHistory: (report: StrategyReport) => void;
  getReportById: (id: string) => StrategyReport | null;
  saveDraft: () => void;
  isDraftSaved: boolean;
  resetBriefToOpportunity: (opp?: DemoOpportunity) => void;
}

const STORAGE_KEY_BRIEF = "trndo_strategy_brief_draft";
const STORAGE_KEY_OPP_ID = "trndo_strategy_selected_opp_id";
const STORAGE_KEY_REPORTS = "trndo_strategy_reports_cache";

function createInitialBrief(opp: DemoOpportunity): BusinessRequest {
  return {
    business_name: "TRNDO Business",
    category: opp.category,
    subcategory: opp.subcategory,
    city: opp.city,
    region: opp.region,
    country: opp.country,
    primary_language: "English",
    secondary_languages: ["Malayalam"],
    products_services: [
      {
        ...opp.default_product,
      },
    ],
    target_audience: opp.target_audience_sample,
    objective: "qualified_inquiries" as Objective,
    preferred_channels: ["instagram", "whatsapp"],
    budget_type: "organic",
    budget_amount: null,
    brand_personality: "modern, quality-driven, aesthetic",
    product_positioning: `${opp.title} tailored for verified regional demand and customer interest`,
    desired_tone: "warm, refined, helpful",
    campaign_time_horizon: "14 days",
    constraints: [
      "Do not discount below the approved price floor",
      "Do not claim availability beyond verified weekly batch capacity",
    ],
    approved_price_floor: opp.default_product.price ? Number(opp.default_product.price) : 500,
    maximum_discount: null,
    fulfilment_capacity: opp.default_product.stock_or_capacity || 25,
    preferred_content_formats: ["short video", "carousel menu", "unboxing story"],
  };
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export function StrategyProvider({ children }: { children: React.ReactNode }) {
  const [selectedOpportunity, setSelectedOpportunityState] = useState<DemoOpportunity>(
    DEMO_OPPORTUNITIES[0]
  );
  const [brief, setBrief] = useState<BusinessRequest>(() =>
    createInitialBrief(DEMO_OPPORTUNITIES[0])
  );
  const [currentReport, setCurrentReport] = useState<StrategyReport | null>(null);
  const [reportHistory, setReportHistory] = useState<Record<string, StrategyReport>>({});
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const savedOppId = localStorage.getItem(STORAGE_KEY_OPP_ID);
      let activeOpp = DEMO_OPPORTUNITIES[0];
      if (savedOppId) {
        const found = DEMO_OPPORTUNITIES.find((o) => o.id === savedOppId);
        if (found) {
          activeOpp = found;
          setSelectedOpportunityState(found);
        }
      }

      const savedBrief = localStorage.getItem(STORAGE_KEY_BRIEF);
      if (savedBrief) {
        try {
          const parsed = JSON.parse(savedBrief);
          if (parsed.product_positioning && parsed.product_positioning.toLowerCase().includes("cake") && activeOpp.category !== "bakery") {
            parsed.product_positioning = `${activeOpp.title} tailored for verified regional demand`;
          }
          setBrief(parsed);
        } catch {
          setBrief(createInitialBrief(activeOpp));
        }
      } else {
        setBrief(createInitialBrief(activeOpp));
      }

      const savedReports = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (savedReports) {
        setReportHistory(JSON.parse(savedReports));
      }
    } catch (e) {
      console.warn("Could not hydrate strategy state from localStorage", e);
    }
  }, []);

  const selectOpportunity = useCallback((opp: DemoOpportunity) => {
    setSelectedOpportunityState(opp);
    try {
      localStorage.setItem(STORAGE_KEY_OPP_ID, opp.id);
    } catch {}
    setBrief((prev) => ({
      ...prev,
      category: opp.category,
      subcategory: opp.subcategory,
      city: opp.city,
      region: opp.region,
      country: opp.country,
      products_services: [{ ...opp.default_product }],
      target_audience: opp.target_audience_sample,
      product_positioning: `${opp.title} tailored for verified regional demand and customer interest`,
      approved_price_floor: opp.default_product.price ? Number(opp.default_product.price) : 500,
      fulfilment_capacity: opp.default_product.stock_or_capacity || 15,
    }));
  }, []);

  const updateBrief = useCallback((partial: Partial<BusinessRequest>) => {
    setBrief((prev) => {
      const updated = { ...prev, ...partial };
      setIsDraftSaved(false);
      return updated;
    });
  }, []);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRIEF, JSON.stringify(brief));
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 3000);
    } catch (e) {
      console.warn("Failed to save draft to localStorage", e);
    }
  }, [brief]);

  const saveReportToHistory = useCallback((report: StrategyReport) => {
    setReportHistory((prev) => {
      const updated = { ...prev, [report.strategy_id]: report };
      try {
        localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCurrentReport(report);
  }, []);

  const getReportById = useCallback(
    (id: string): StrategyReport | null => {
      if (currentReport && currentReport.strategy_id === id) {
        return currentReport;
      }
      return reportHistory[id] || null;
    },
    [currentReport, reportHistory]
  );

  const resetBriefToOpportunity = useCallback(
    (opp?: DemoOpportunity) => {
      const targetOpp = opp || selectedOpportunity;
      const fresh = createInitialBrief(targetOpp);
      setBrief(fresh);
      try {
        localStorage.removeItem(STORAGE_KEY_BRIEF);
      } catch {}
    },
    [selectedOpportunity]
  );

  const selectOpportunityFromTrend = useCallback(
    (keyword: string, score: number = 85, category: string = "Retail & Fashion", city: string = "Kerala") => {
      const opp = createOpportunityFromTrend(keyword, score, category, city);
      selectOpportunity(opp);
    },
    [selectOpportunity]
  );

  return (
    <StrategyContext.Provider
      value={{
        selectedOpportunity,
        selectOpportunity,
        selectOpportunityFromTrend,
        brief,
        updateBrief,
        currentReport,
        setCurrentReport,
        reportHistory,
        saveReportToHistory,
        getReportById,
        saveDraft,
        isDraftSaved,
        resetBriefToOpportunity,
      }}
    >
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error("useStrategy must be used within a StrategyProvider");
  }
  return context;
}
