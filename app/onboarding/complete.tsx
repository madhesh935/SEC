import React from "react";
import { Redirect } from "expo-router";
// Legacy links re-enter the validated startup flow.
export default function SetupCompleteScreen() {
  return <Redirect href="/" />;
}
