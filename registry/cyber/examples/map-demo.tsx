import * as React from "react"
import { Map, type MapAnnotation, type MapMarker, type MapProjection, type MapRoute } from "@/registry/cyber/ui/map"
import { SegmentedControl } from "@/registry/cyber/ui/segmented-control"

// Fictional relay stations plotted on the Atlantic coast.
export const relayMarkers: MapMarker[] = [
  { id: "tidewall", code: "TW-01", label: "Tidewall landing", coordinate: [-70.25, 43.66] },
  { id: "sound", code: "DS-02", label: "Deep Sound station", coordinate: [-52.71, 47.56] },
  { id: "boreal", code: "BR-03", label: "Boreal exchange", coordinate: [-21.94, 64.15] },
  { id: "meridian", code: "ME-04", label: "Meridian exchange", coordinate: [-10.30, 51.93] },
  { id: "lowtide", code: "LT-05", label: "Lowtide landing", coordinate: [-9.14, 38.72] },
  { id: "glass", code: "GL-06", label: "Glasswater relay", coordinate: [-25.67, 37.74] },
]

export const relayRoutes: MapRoute[] = [
  { id: "northern", from: "tidewall", to: "boreal" },
  { id: "west", from: "tidewall", to: "sound" },
  { id: "main", from: "sound", to: "meridian" },
  { id: "polar", from: "sound", to: "boreal" },
  { id: "east", from: "boreal", to: "meridian" },
  { id: "coastal", from: "meridian", to: "lowtide" },
  { id: "southern", from: "tidewall", to: "glass" },
  { id: "island", from: "glass", to: "lowtide" },
]

export const relayAnnotations: MapAnnotation[] = [
  { label: "Greenland", coordinate: [-44, 62.1] },
  { label: "North Atlantic", coordinate: [-40.6, 43] },
]

export const relayGlobeAnnotations: MapAnnotation[] = [
  { label: "North America", coordinate: [-98, 50] },
  { label: "South America", coordinate: [-56, -4] },
  { label: "Europe", coordinate: [27, 54] },
  { label: "Africa", coordinate: [13, 18] },
]

export default function MapDemo() {
  const [projection, setProjection] = React.useState<MapProjection>("mercator")
  return (
    <>
      <SegmentedControl<MapProjection>
        label="Projection"
        value={projection}
        onValueChange={(next) => { if (next) setProjection(next) }}
        options={[{ value: "mercator", label: "Flat map" }, { value: "globe", label: "Globe" }]}
      />
      <Map
        label="Atlantic relay network"
        projection={projection}
        markers={relayMarkers}
        routes={relayRoutes}
        annotations={projection === "globe" ? relayGlobeAnnotations : relayAnnotations}
        defaultValue="sound"
      />
    </>
  )
}
