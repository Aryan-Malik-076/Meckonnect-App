import { LocationSelector } from "@/components/screens";
import { MoveBack, SafeAreaViews } from "@/components/ui";
import React from "react";

const LocationSelectionPage = () => {
  return (
    <SafeAreaViews style={{ padding: 0 }}>
      <MoveBack path={"/"} />
      <LocationSelector />
    </SafeAreaViews>
  );
};
export default LocationSelectionPage;
