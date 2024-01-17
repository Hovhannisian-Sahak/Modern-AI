"use client";
import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";
export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("f04042ac-8510-4395-94a6-7eb1f7183f09");
  }, []);
  return null;
};
